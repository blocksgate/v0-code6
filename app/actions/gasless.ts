"use server"

const ZX_API_BASE = "https://api.0x.org"
const ZX_API_KEY = process.env.ZX_API_KEY || ""

export interface GaslessQuote {
  chainId: number
  price: string
  guaranteedPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  approval?: {
    type: "executeMetaTransaction::approve" | "permit" | "daiPermit"
    eip712: any
  }
  trade: {
    eip712: any
    type: string
  }
  totalNetworkFee: string
}

export async function getGaslessSwapPriceAction(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
): Promise<GaslessQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless price:", error)
    return null
  }
}

export async function getGaslessSwapQuoteAction(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
): Promise<GaslessQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/quote?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless quote:", error)
    return null
  }
}

export async function submitGaslessSwapAction(
  chainId: number,
  tradeHash: string,
  approvalSignature: string,
  tradeSignature: string,
): Promise<any> {
  try {
    const response = await fetch(`${ZX_API_BASE}/gasless/submit`, {
      method: "POST",
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId,
        approval: {
          eip712Signature: approvalSignature,
        },
        trade: {
          eip712Signature: tradeSignature,
        },
      }),
    })

    if (!response.ok) throw new Error("Failed to submit gasless swap")
    return await response.json()
  } catch (error) {
    console.error("Error submitting gasless swap:", error)
    return null
  }
}

export async function getGaslessSwapStatusAction(chainId: number, tradeHash: string): Promise<any> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/status/${tradeHash}?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch swap status")
    return await response.json()
  } catch (error) {
    console.error("Error fetching swap status:", error)
    return null
  }
}

export async function getGaslessApprovalTokensAction(chainId: number): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/gasless-approval-tokens?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless approval tokens")
    const data = await response.json()
    return data.tokens || []
  } catch (error) {
    console.error("Error fetching gasless approval tokens:", error)
    return []
  }
}
