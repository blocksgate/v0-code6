import { ArbitrageMonitor, FlashSwapEngine, TradingBot } from "./trading-engine"
import { ZeroExClient } from "./0x-client"
import { wsPrice } from "./websocket-price-feed"
import { supabase } from "./supabase/client"

export interface Order {
  id: string
  userId: string
  type: "limit" | "market"
  side: "buy" | "sell"
  token: string
  amount: string
  price?: string
  status: "pending" | "filled" | "cancelled" | "expired"
  createdAt: number
  expiresAt?: number
  filledAt?: number
  txHash?: string
}

export interface Trade {
  id: string
  orderId: string
  userId: string
  type: "market" | "limit"
  side: "buy" | "sell"
  token: string
  amount: string
  price: string
  fee: string
  txHash: string
  status: "pending" | "confirmed" | "failed"
  executedAt: number
}

export class OrderManager {
  private orders: Map<string, Order> = new Map()
  private readonly zeroEx: ZeroExClient

  constructor() {
    this.zeroEx = new ZeroExClient()
    this.startPriceSubscription()
  }

  private startPriceSubscription() {
    wsPrice.on("price", async ({ token, price }) => {
      await this.checkLimitOrders(token, price)
    })
  }

  private async checkLimitOrders(token: string, currentPrice: number) {
    const pendingOrders = Array.from(this.orders.values()).filter(
      order => order.status === "pending" && order.token === token && order.price
    )

    for (const order of pendingOrders) {
      const orderPrice = parseFloat(order.price!)
      const shouldExecute = (
        (order.side === "buy" && currentPrice <= orderPrice) ||
        (order.side === "sell" && currentPrice >= orderPrice)
      )

      if (shouldExecute) {
        await this.executeOrder(order, currentPrice)
      }
    }
  }

  async createOrder(orderData: Omit<Order, "id" | "status" | "createdAt">): Promise<Order> {
    const order: Order = {
      ...orderData,
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: Date.now(),
    }

    // Store order in memory
    this.orders.set(order.id, order)

    // Store in database
    const { error } = await supabase
      .from("orders")
      .insert([order])

    if (error) {
      this.orders.delete(order.id)
      throw new Error(`Failed to create order: ${error.message}`)
    }

    // Execute immediately if market order
    if (order.type === "market") {
      const currentPrice = await wsPrice.getPrice(order.token)
      await this.executeOrder(order, currentPrice)
    }

    return order
  }

  private async executeOrder(order: Order, executionPrice: number): Promise<void> {
    try {
      // Get quote from 0x API
      const quote = await this.zeroEx.getQuote({
        token: order.token,
        amount: order.amount,
        side: order.side,
      })

      // Execute trade using 0x Protocol
      const txHash = await this.zeroEx.executeTrade({
        quote,
        order,
      })

      // Create trade record
      const trade: Trade = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId: order.id,
        userId: order.userId,
        type: order.type,
        side: order.side,
        token: order.token,
        amount: order.amount,
        price: executionPrice.toString(),
        fee: quote.fee,
        txHash,
        status: "pending",
        executedAt: Date.now(),
      }

      // Update order status
      order.status = "filled"
      order.filledAt = Date.now()
      order.txHash = txHash

      // Update database
      await Promise.all([
        supabase
          .from("orders")
          .update({
            status: order.status,
            filledAt: order.filledAt,
            txHash: order.txHash,
          })
          .eq("id", order.id),
        
        supabase
          .from("trades")
          .insert([trade]),
      ])

      // Monitor transaction confirmation
      this.monitorTradeConfirmation(trade)
    } catch (error) {
      console.error(`Failed to execute order ${order.id}:`, error)
      
      // Update order status in database
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id)
    }
  }

  private async monitorTradeConfirmation(trade: Trade) {
    try {
      const receipt = await this.zeroEx.waitForTransactionReceipt(trade.txHash)
      
      const status = receipt.status ? "confirmed" : "failed"
      
      await supabase
        .from("trades")
        .update({ status })
        .eq("id", trade.id)

    } catch (error) {
      console.error(`Failed to confirm trade ${trade.id}:`, error)
      
      await supabase
        .from("trades")
        .update({ status: "failed" })
        .eq("id", trade.id)
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const order = this.orders.get(orderId)
    
    if (!order) {
      throw new Error("Order not found")
    }

    if (order.userId !== userId) {
      throw new Error("Unauthorized")
    }

    if (order.status !== "pending") {
      throw new Error(`Cannot cancel order in ${order.status} status`)
    }

    order.status = "cancelled"
    
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)

    this.orders.delete(orderId)
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`)
    }

    return data
  }
}

export const orderManager = new OrderManager()