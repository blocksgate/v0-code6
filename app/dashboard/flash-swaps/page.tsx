"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { FlashSwapBuilder } from "@/components/flash/flash-swap-builder"
import { MevAnalyzer } from "@/components/flash/mev-analyzer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSystemMetrics } from "@/app/actions/integrated-systems"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function FlashSwapsPage() {
  const [flashLoanStatus, setFlashLoanStatus] = useState<any>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await getSystemMetrics()
      if (metrics.success && metrics.systems?.flashLoans) {
        setFlashLoanStatus(metrics.systems.flashLoans)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Flash Swaps & MEV</h1>
          <p className="text-muted-foreground mt-2">Advanced trading tools for flash loans and MEV analysis</p>
        </div>

        {flashLoanStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="neon-border border-cyan-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Available Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{flashLoanStatus.metrics?.providersCount || 0}</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {flashLoanStatus.providerStatus?.map((provider: any) => (
                    <Badge key={provider.name} variant="secondary" className="text-xs">
                      {provider.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="neon-border border-pink-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Executed Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-pink-400">{flashLoanStatus.metrics?.executedLoans || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">This session</p>
              </CardContent>
            </Card>

            <Card className="neon-border border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  ${(flashLoanStatus.metrics?.totalVolume || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aggregated</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="flash" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="flash">Flash Swaps</TabsTrigger>
            <TabsTrigger value="mev">MEV Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="flash" className="space-y-4 mt-6">
            <FlashSwapBuilder />
          </TabsContent>

          <TabsContent value="mev" className="space-y-4 mt-6">
            <MevAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
