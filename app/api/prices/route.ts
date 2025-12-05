import { type NextRequest, NextResponse } from "next/server"
import { priceFeed } from "@/lib/price-feed"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("token_id")
    const tokens = searchParams.getAll("tokens")

    if (tokenId) {
      // Get single token price
      const price = await priceFeed.getPrice(tokenId)
      return NextResponse.json({ token: tokenId, price })
    }

    if (tokens.length > 0) {
      // Get multiple token prices
      const prices: Record<string, number> = {}
      for (const token of tokens) {
        try {
          prices[token] = await priceFeed.getPrice(token)
        } catch (error) {
          console.error(`Failed to fetch price for ${token}:`, error)
          prices[token] = 0
        }
      }
      return NextResponse.json({ prices })
    }

    // Popular tokens by default
    const popularTokens = ["bitcoin", "ethereum", "usdc", "dai"]
    const prices: Record<string, number> = {}
    for (const token of popularTokens) {
      try {
        prices[token] = await priceFeed.getPrice(token)
      } catch (error) {
        prices[token] = 0
      }
    }

    return NextResponse.json({ prices })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prices" },
      { status: 500 },
    )
  }
}
