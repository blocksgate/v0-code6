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
    this.apiKey = config.zxProtocol.apiKey
    this.baseUrl = config.zxProtocol.baseUrl

    if (!this.apiKey) {
      console.warn("[0x] API key not configured - swap functionality will be limited")
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
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
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

    const response = await fetch(url, {
      headers: {
        "0x-api-key": this.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`0x API error: ${error}`)
    }

    return response.json()
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
