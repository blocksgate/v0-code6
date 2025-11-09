import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get portfolio data
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)

    if (portfolioError) throw portfolioError

    // Get trades for performance metrics
    const { data: trades, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
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
