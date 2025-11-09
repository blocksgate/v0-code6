// Real-time arbitrage opportunity detection using 0x Protocol

import { zxClient } from "@/lib/0x-client"
import { ethers } from "ethers"
import { priceFeed } from "@/lib/price-feed"

export interface ArbitrageOpportunity {
  id: string
  sellToken: string
  buyToken: string
  profitUSD: string
  profitPercent: number
  sources: string[]
  paths: {
    sourceRoute: string[]
    destinationRoute: string[]
  }
  expiresIn: number
  estimatedGas: string
  riskScore: number
  timestamp: number
  chainId: number
  sellAmount: string
  buyAmount: string
  gasCostUSD?: string
  netProfitUSD?: string
}

export interface TokenPrice {
  address: string
  symbol: string
  price: number
  liquidity: string
  volume24h: string
}

// Popular token pairs for arbitrage detection
const POPULAR_PAIRS = [
  { sell: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", buy: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, // ETH -> USDC
  { sell: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", buy: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }, // USDC -> ETH
  { sell: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", buy: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // ETH -> DAI
  { sell: "0x6B175474E89094C44Da98b954EedeAC495271d0F", buy: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" }, // DAI -> ETH
  { sell: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", buy: "0x6B175474E89094C44Da98b954EedeAC495271d0F" }, // USDC -> DAI
  { sell: "0x6B175474E89094C44Da98b954EedeAC495271d0F", buy: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, // DAI -> USDC
]

/**
 * Get quote from 0x Protocol with specific DEX sources
 */
async function getQuoteFromDex(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  chainId: number,
  excludedSources?: string[],
): Promise<{ buyAmount: string; sources: string[]; gas: string; price: string } | null> {
  try {
    const quote = await zxClient.getQuote(chainId, sellToken, buyToken, sellAmount, 0.5)

    // Extract sources from quote
    const sources = quote.sources?.map((s: any) => s.name) || ["0x Protocol"]

    return {
      buyAmount: quote.buyAmount,
      sources,
      gas: quote.gas || quote.estimatedGas || "0",
      price: quote.price,
    }
  } catch (error) {
    console.warn(`[Arbitrage] Failed to get quote for ${sellToken} -> ${buyToken}:`, error)
    return null
  }
}

/**
 * Calculate profit in USD
 */
async function calculateProfitUSD(
  profitPercent: number,
  sellAmount: string,
  sellToken: string,
  buyToken: string,
): Promise<string> {
  try {
    // Get token prices in USD
    const sellTokenId = getTokenId(sellToken)
    const buyTokenId = getTokenId(buyToken)

    let sellPrice = 0
    let buyPrice = 0

    if (sellTokenId) {
      sellPrice = await priceFeed.getPrice(sellTokenId)
    }
    if (buyTokenId) {
      buyPrice = await priceFeed.getPrice(buyTokenId)
    }

    // If we have prices, calculate actual USD value
    if (sellPrice > 0) {
      const sellAmountNum = Number.parseFloat(ethers.formatEther(sellAmount))
      const baseValue = sellAmountNum * sellPrice
      const profit = (baseValue * profitPercent) / 100
      return profit.toFixed(2)
    }

    // Fallback: estimate based on ETH price
    const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
    const sellAmountNum = Number.parseFloat(ethers.formatEther(sellAmount))
    const baseValue = sellAmountNum * ethPrice
    const profit = (baseValue * profitPercent) / 100
    return profit.toFixed(2)
  } catch (error) {
    console.error("[Arbitrage] Error calculating profit USD:", error)
    return "0.00"
  }
}

/**
 * Get CoinGecko token ID from address
 */
function getTokenId(tokenAddress: string): string | null {
  const map: Record<string, string> = {
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "ethereum",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "usd-coin",
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": "dai",
    "0xdAC17F958D2ee523a2206206994597c13d831ec7": "tether",
    "0x2260FAC5E5542a773Aa44fBCfF9D83333Ad63169": "wrapped-bitcoin",
  }
  return map[tokenAddress.toLowerCase()] || null
}

/**
 * Calculate risk score (0-100, lower is better)
 */
function calculateRiskScore(profitPercent: number, gasCostUSD: number): number {
  // Higher profit with lower gas = lower risk
  // Very high profit (>1%) might indicate low liquidity = higher risk
  if (profitPercent < 0.3) return 20 // Low risk, low profit
  if (profitPercent < 0.6) return 45 // Medium risk
  if (profitPercent < 1.0) return 60 // Higher risk
  return 80 // Very high risk (might be low liquidity)
}

/**
 * Detect arbitrage opportunities by comparing quotes from different sources
 */
export async function detectArbitrageOpportunities(
  chainId: number = 1,
  tokenPairs?: Array<{ sell: string; buy: string }>,
  minProfitPercent: number = 0.1,
): Promise<ArbitrageOpportunity[]> {
  try {
    const opportunities: ArbitrageOpportunity[] = []
    const pairs = tokenPairs || POPULAR_PAIRS

    // Use a standard test amount (0.1 ETH worth)
    const testAmount = ethers.parseEther("0.1").toString()

    // For each token pair, get multiple quotes and compare
    for (const pair of pairs) {
      try {
        // Get quotes with different parameters to potentially hit different DEXs
        const quote1 = await getQuoteFromDex(pair.sell, pair.buy, testAmount, chainId)
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
        const quote2 = await getQuoteFromDex(pair.buy, pair.sell, testAmount, chainId)

        if (!quote1) continue

        // Check for triangular arbitrage: A -> B -> A
        if (quote1 && quote2) {
          const buyAmount1 = Number.parseFloat(ethers.formatEther(quote1.buyAmount))
          const buyAmount2 = Number.parseFloat(ethers.formatEther(quote2.buyAmount))

          // Calculate if we can profit from round trip
          const testAmountNum = Number.parseFloat(ethers.formatEther(testAmount))
          const roundTripAmount = buyAmount1 * (buyAmount2 / testAmountNum)
          const profitPercent = ((roundTripAmount - testAmountNum) / testAmountNum) * 100

          if (profitPercent > minProfitPercent) {
            // Calculate gas cost
            const gasCost = Number.parseFloat(ethers.formatEther(quote1.gas)) * 2 // Two transactions
            const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
            const gasCostUSD = gasCost * ethPrice

            // Calculate net profit
            const profitUSD = await calculateProfitUSD(profitPercent, testAmount, pair.sell, pair.buy)
            const netProfitUSD = (Number.parseFloat(profitUSD) - gasCostUSD).toFixed(2)

            if (Number.parseFloat(netProfitUSD) > 0) {
              opportunities.push({
                id: `arb-${pair.sell}-${pair.buy}-${Date.now()}`,
                sellToken: pair.sell,
                buyToken: pair.buy,
                profitUSD,
                profitPercent: Number.parseFloat(profitPercent.toFixed(2)),
                sources: [...new Set([...quote1.sources, ...quote2.sources])],
                paths: {
                  sourceRoute: quote1.sources,
                  destinationRoute: quote2.sources,
                },
                expiresIn: 60, // 60 seconds
                estimatedGas: `${gasCost.toFixed(6)} ETH`,
                gasCostUSD: gasCostUSD.toFixed(2),
                netProfitUSD,
                riskScore: calculateRiskScore(profitPercent, gasCostUSD),
                timestamp: Date.now(),
                chainId,
                sellAmount: testAmount,
                buyAmount: quote1.buyAmount,
              })
            }
          }
        }

        // Also check direct arbitrage by comparing with different sell amounts
        // (This simulates checking different DEXs by using different amounts)
        const quote3 = await getQuoteFromDex(pair.sell, pair.buy, ethers.parseEther("1").toString(), chainId)

        if (quote1 && quote3) {
          const buyAmount1 = Number.parseFloat(ethers.formatEther(quote1.buyAmount))
          const buyAmount3 = Number.parseFloat(ethers.formatEther(quote3.buyAmount))

          // Normalize to per-unit comparison
          const rate1 = buyAmount1 / Number.parseFloat(ethers.formatEther(testAmount))
          const rate3 = buyAmount3 / Number.parseFloat(ethers.formatEther(ethers.parseEther("1").toString()))

          const priceDiff = Math.abs(rate1 - rate3) / Math.min(rate1, rate3) * 100

          if (priceDiff > minProfitPercent) {
            const bestRate = Math.max(rate1, rate3)
            const worstRate = Math.min(rate1, rate3)
            const profitPercent = ((bestRate - worstRate) / worstRate) * 100

            const gasCost = Number.parseFloat(ethers.formatEther(quote1.gas))
            const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
            const gasCostUSD = gasCost * ethPrice

            const profitUSD = await calculateProfitUSD(profitPercent, testAmount, pair.sell, pair.buy)
            const netProfitUSD = (Number.parseFloat(profitUSD) - gasCostUSD).toFixed(2)

            if (Number.parseFloat(netProfitUSD) > 0) {
              opportunities.push({
                id: `arb-direct-${pair.sell}-${pair.buy}-${Date.now()}`,
                sellToken: pair.sell,
                buyToken: pair.buy,
                profitUSD,
                profitPercent: Number.parseFloat(profitPercent.toFixed(2)),
                sources: [...new Set([...quote1.sources, ...quote3.sources])],
                paths: {
                  sourceRoute: quote1.sources,
                  destinationRoute: quote3.sources,
                },
                expiresIn: 60,
                estimatedGas: `${gasCost.toFixed(6)} ETH`,
                gasCostUSD: gasCostUSD.toFixed(2),
                netProfitUSD,
                riskScore: calculateRiskScore(profitPercent, gasCostUSD),
                timestamp: Date.now(),
                chainId,
                sellAmount: testAmount,
                buyAmount: quote1.buyAmount,
              })
            }
          }
        }
      } catch (error) {
        console.error(`[Arbitrage] Error processing pair ${pair.sell} -> ${pair.buy}:`, error)
        continue
      }
    }

    // Sort by profit percentage (highest first)
    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent)
  } catch (error) {
    console.error("[Arbitrage] Error detecting arbitrage opportunities:", error)
    return []
  }
}

/**
 * Detect cross-chain arbitrage opportunities
 */
export async function detectCrossChainArbitrage(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
): Promise<ArbitrageOpportunity | null> {
  try {
    const testAmount = ethers.parseEther("0.1").toString()

    const quoteSource = await getQuoteFromDex(tokenAddress, tokenAddress, testAmount, fromChainId)
    const quoteDestination = await getQuoteFromDex(tokenAddress, tokenAddress, testAmount, toChainId)

    if (!quoteSource || !quoteDestination) return null

    const priceSource = Number.parseFloat(ethers.formatEther(quoteSource.buyAmount))
    const priceDestination = Number.parseFloat(ethers.formatEther(quoteDestination.buyAmount))
    const arbitragePercent = Math.abs(((priceDestination - priceSource) / priceSource) * 100)

    if (arbitragePercent > 0.5) {
      const gasCost = Number.parseFloat(ethers.formatEther(quoteSource.gas)) + Number.parseFloat(ethers.formatEther(quoteDestination.gas))
      const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
      const gasCostUSD = gasCost * ethPrice

      const profitUSD = await calculateProfitUSD(arbitragePercent, testAmount, tokenAddress, tokenAddress)
      const netProfitUSD = (Number.parseFloat(profitUSD) - gasCostUSD).toFixed(2)

      return {
        id: `cross-chain-${fromChainId}-${toChainId}-${Date.now()}`,
        sellToken: tokenAddress,
        buyToken: tokenAddress,
        profitUSD,
        profitPercent: Number.parseFloat(arbitragePercent.toFixed(2)),
        sources: ["Cross-Chain Bridge"],
        paths: {
          sourceRoute: [`Chain ${fromChainId}`],
          destinationRoute: [`Chain ${toChainId}`],
        },
        expiresIn: 120,
        estimatedGas: `${gasCost.toFixed(6)} ETH`,
        gasCostUSD: gasCostUSD.toFixed(2),
        netProfitUSD,
        riskScore: calculateRiskScore(arbitragePercent, gasCostUSD),
        timestamp: Date.now(),
        chainId: fromChainId,
        sellAmount: testAmount,
        buyAmount: quoteSource.buyAmount,
      }
    }

    return null
  } catch (error) {
    console.error("[Arbitrage] Error detecting cross-chain arbitrage:", error)
    return null
  }
}
