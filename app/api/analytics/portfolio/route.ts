import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // For wallet-only users, return mock/demo data
    if (auth.isWalletOnly) {
      return NextResponse.json({
        portfolio_value: 0,
        total_cost_basis: 0,
        unrealized_pnl: 0,
        total_trades: 0,
        winning_trades: 0,
        win_rate: 0,
        holdings_count: 0,
        message: "Wallet-only mode: Connect with email to track portfolio history"
      })
    }

    // Supabase authenticated user - fetch from database
    const supabase = await createClient()
    
    // Get portfolio data
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", auth.userId)

    if (portfolioError) throw portfolioError

    // Get trades for performance metrics
    const { data: trades, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("status", "completed")

    if (tradesError) throw tradesError

    // Calculate metrics
    const totalTrades = trades?.length || 0
    const winningTrades = trades?.filter((t: { profit_loss: number }) => t.profit_loss && t.profit_loss > 0).length || 0
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const totalPnL = trades?.reduce((sum: any, t: { profit_loss: any }) => sum + (t.profit_loss || 0), 0) || 0

    return NextResponse.json({
      portfolio_value: portfolio?.reduce((sum: any, t: { usd_value: any }) => sum + (t.usd_value || 0), 0) || 0,
      total_cost_basis: portfolio?.reduce((sum: any, t: { cost_basis: any }) => sum + (t.cost_basis || 0), 0) || 0,
      unrealized_pnl: totalPnL,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      win_rate: winRate,
      holdings_count: portfolio?.length || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 },
    )
  }
}
