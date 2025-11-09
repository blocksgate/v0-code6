"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { PortfolioCard } from "@/components/dashboard/portfolio-card"
import { TradeModule } from "@/components/dashboard/trade-module"
import { PoolsOverview } from "@/components/dashboard/pools-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { AuthGuard } from "@/components/auth-guard"
import { SystemIntegrationMonitor } from "@/components/dashboard/system-integration-monitor"
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary"
import { RecentTrades } from "@/components/dashboard/recent-trades"

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time trading platform with integrated backend systems</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PortfolioCard />
              <TradeModule />
            </div>
            <div className="space-y-6">
              <PortfolioSummary />
              <RecentTrades />
            </div>
          </div>

          <PoolsOverview />

          <div className="border-t border-border/50 pt-8">
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <SystemIntegrationMonitor />
          </div>

          <RecentTransactions />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
