"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock } from "lucide-react"

interface LimitOrderProps {
  userAddress: string
  chainId: number
}

export function LimitOrder({ userAddress, chainId }: LimitOrderProps) {
  const [sellToken, setSellToken] = useState("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
  const [buyToken, setBuyToken] = useState("0x6b175474e89094c44da98b954eedeac495271d0f")
  const [sellAmount, setSellAmount] = useState("1")
  const [limitPrice, setLimitPrice] = useState("2500")
  const [expiry, setExpiry] = useState("1h")
  const [orders, setOrders] = useState<any[]>([
    {
      id: "1",
      sellAmount: "10 WETH",
      buyAmount: "25000 DAI",
      limitPrice: "2500",
      status: "Active",
      filledPercent: 45,
    },
  ])

  const handleCreateOrder = () => {
    const newOrder = {
      id: Date.now().toString(),
      sellAmount: `${sellAmount} WETH`,
      buyAmount: (Number.parseFloat(sellAmount) * Number.parseFloat(limitPrice)).toString(),
      limitPrice,
      status: "Active",
      filledPercent: 0,
    }
    setOrders([...orders, newOrder])
  }

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          <div>
            <CardTitle>Limit Orders</CardTitle>
            <CardDescription>Set price targets for automatic execution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="create">Create Order</TabsTrigger>
            <TabsTrigger value="active">Active Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sell Amount</label>
              <Input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limit Price (DAI per WETH)</label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="Enter limit price"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry</label>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
              >
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            <div className="bg-card/50 border border-border rounded-lg p-3">
              <div className="text-sm text-muted-foreground">You will receive</div>
              <div className="text-lg font-semibold">
                {(Number.parseFloat(sellAmount) * Number.parseFloat(limitPrice)).toFixed(2)} DAI
              </div>
            </div>

            <Button
              onClick={handleCreateOrder}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Create Limit Order
            </Button>
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-4">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No active orders</div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-card/50 border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-muted-foreground">{order.sellAmount}</div>
                      <div className="font-medium">{order.buyAmount}</div>
                    </div>
                    <Badge variant={order.status === "Active" ? "default" : "secondary"}>{order.status}</Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Limit: ${order.limitPrice}</span>
                    <span>{order.filledPercent}% filled</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-1 rounded-full"
                      style={{ width: `${order.filledPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
