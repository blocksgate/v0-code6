"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { SwapInterface } from "@/components/swap/interface"

export default function SwapPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Token Swap</h1>
        <SwapInterface />
      </div>
    </DashboardLayout>
  )
}
