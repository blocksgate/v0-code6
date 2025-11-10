// 0x Protocol Client for swap execution

import { config } from "./config"

export interface ZxQuote {
  chainId: number
  price: string
  guaranteedPrice: string
  to: string
  data: string
  value: string
  gasPrice: string
  gas: string
  estimatedGas: string
  protocolFees: unknown
  minimumProtocolFee: string
  buyTokenAddress: string
  sellTokenAddress: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
  sources: Array<{ name: string; proportion: string }>
  fees: unknown
}

export class ZxClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // Check both server-side and client-side env vars
    this.apiKey = config.zxProtocol.apiKey || process.env.NEXT_PUBLIC_0X_API_KEY || ""
    this.baseUrl = config.zxProtocol.baseUrl

    if (!this.apiKey) {
      console.warn("[0x] API key not configured - swap functionality will be limited. Set ZX_API_KEY or NEXT_PUBLIC_0X_API_KEY in environment variables.")
    }
  }

  async getQuote(
    chainId: number,
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    slippagePercentage?: number,
    method?: "permit2" | "allowance-holder"
  ): Promise<ZxQuote> {
    // Validate inputs
    if (!sellToken || !buyToken || !sellAmount) {
      throw new Error("Missing required parameters: sellToken, buyToken, sellAmount")
    }

    // Convert ETH placeholder to WETH for 0x API if needed
    // 0x API uses WETH address for native ETH
    const ETH_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    const WETH_ADDRESS = chainId === 1 
      ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" // Mainnet WETH
      : "0x4200000000000000000000000000000000000006" // Base/OP WETH
    
    const normalizedSellToken = sellToken.toLowerCase() === ETH_PLACEHOLDER.toLowerCase() 
      ? WETH_ADDRESS 
      : sellToken
    const normalizedBuyToken = buyToken.toLowerCase() === ETH_PLACEHOLDER.toLowerCase() 
      ? WETH_ADDRESS 
      : buyToken

    // Validate sell amount is greater than 0
    try {
      const amount = BigInt(sellAmount)
      if (amount <= 0) {
        throw new Error("Sell amount must be greater than 0")
      }
    } catch (error) {
      throw new Error(`Invalid sell amount: ${sellAmount}`)
    }

    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken: normalizedSellToken,
      buyToken: normalizedBuyToken,
      sellAmount,
      ...(slippagePercentage && { slippagePercentage: slippagePercentage.toString() }),
    })

    // Use different endpoints for different methods
    let endpoint = "/swap/v1/quote"
    if (method === "permit2") {
      endpoint = "/swap/permit2/quote"
    } else if (method === "allowance-holder") {
      endpoint = "/swap/allowance-holder/quote"
    }

    const url = `${this.baseUrl}${endpoint}?${params}`

    try {
      const response = await fetch(url, {
        headers: {
          ...(this.apiKey && { "0x-api-key": this.apiKey }),
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `0x API error: ${errorText}`
        
        // Provide more helpful error messages
        if (response.status === 400) {
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.message?.includes("no Route matched")) {
              errorMessage = `No swap route available for ${sellToken} -> ${buyToken}. This pair may have insufficient liquidity or the tokens may not be supported.`
            } else {
              errorMessage = `Invalid request: ${errorJson.message || errorText}`
            }
          } catch {
            // If parsing fails, use the original error text
          }
        } else if (response.status === 403) {
          errorMessage = "0x API key is invalid or missing. Please configure NEXT_PUBLIC_0X_API_KEY in your environment variables."
        } else if (response.status === 429) {
          errorMessage = "0x API rate limit exceeded. Please wait before making more requests."
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to get quote from 0x API: ${error}`)
    }
  }

  async getPrices(chainId: number, tokens: string[]): Promise<Record<string, string>> {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      tokens: tokens.join(","),
    })

    const url = `${this.baseUrl}/swap/v1/price?${params}`

    const response = await fetch(url, {
      headers: {
        "0x-api-key": this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch prices from 0x")
    }

    const data = await response.json()
    return data.data || {}
  }

  async executeTrade(
    chainId: number,
    userAddress: string,
    sellToken: string,
    buyToken: string,
    sellAmount: string,
    slippagePercentage?: number
  ) {
    const quote = await this.getQuote(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      slippagePercentage
    );

    return {
      to: quote.to,
      data: quote.data,
      value: quote.value,
      gas: quote.gas,
      gasPrice: quote.gasPrice,
    };
  }
}

export const zxClient = new ZxClient()
