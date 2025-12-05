"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { MonitorDashboard } from "@/components/arbitrage/monitor-dashboard"
import { OpportunityCard } from "@/components/arbitrage/opportunity-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Zap } from "lucide-react"
import { getSystemMetrics } from "@/app/actions/integrated-systems"

const opportunities = [
  {
    id: "1",
    sellToken: "WETH",
    buyToken: "DAI",
    profit: "125.50",
    profitPercent: 0.85,
    sources: ["Uniswap", "0x", "SushiSwap"],
    expiresIn: 45,
    estimatedGas: "0.015 ETH",
  },
  {
    id: "2",
    sellToken: "USDC",
    buyToken: "WETH",
    profit: "89.25",
    profitPercent: 0.62,
    sources: ["Curve", "0x"],
    expiresIn: 28,
    estimatedGas: "0.008 ETH",
  },
  {
    id: "3",
    sellToken: "DAI",
    buyToken: "USDC",
    profit: "45.75",
    profitPercent: 0.38,
    sources: ["Balancer", "Curve"],
    expiresIn: 12,
    estimatedGas: "0.006 ETH",
  },
]

export default function ArbitragePage() {
  const [mevStats, setMevStats] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getSystemMetrics()
      if (metrics.success && metrics.systems?.mev) {
        setMevStats(metrics.systems.mev)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Arbitrage Opportunities</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and execute profitable arbitrage trades across DeFi protocols with MEV protection
          </p>
        </div>

        <MonitorDashboard />

        {mevStats && (
          <Card className="neon-border border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-orange-400">MEV Protection Status</CardTitle>
              <CardDescription>Protection metrics for arbitrage execution</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Protected Trades</p>
                <p className="text-2xl font-bold text-orange-400">{mevStats.metrics?.protectedTransactions || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Avg Savings</p>
                <p className="text-2xl font-bold text-orange-400">
                  ${mevStats.metrics?.averageSavings?.toFixed(2) || 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Risk Level</p>
                <p className="text-2xl font-bold text-orange-400">{mevStats.metrics?.riskLevel || "Low"}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="opportunities">Active Opportunities</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Current Opportunities</h2>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Alert className="bg-accent/10 border-accent/30">
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Opportunities are sorted by profit potential and MEV-protected. Click "Execute" to perform the arbitrage
                trade.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} {...opp} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Arbitrage Settings</CardTitle>
                <CardDescription>Configure your arbitrage monitoring preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Profit Threshold (%)</label>
                  <Input type="number" defaultValue="0.3" placeholder="0.3" className="bg-input border-border" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Maximum Gas Price (Gwei)</label>
                  <Input type="number" defaultValue="50" placeholder="50" className="bg-input border-border" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Trade Size ($)</label>
                  <Input type="number" defaultValue="50000" placeholder="50000" className="bg-input border-border" />
                </div>

                <div className="flex items-center justify-between bg-card/50 border border-border rounded-lg p-3">
                  <label className="text-sm font-medium">Auto-Execute Profitable Trades</label>
                  <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between bg-card/50 border border-border rounded-lg p-3">
                  <label className="text-sm font-medium">Include Cross-Chain Arbs</label>
                  <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
