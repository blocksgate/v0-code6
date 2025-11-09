"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function TradeModule() {
  const [activeTab, setActiveTab] = useState("swap")

  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Trade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("swap")}
              className={`flex-1 py-2 rounded transition-colors ${
                activeTab === "swap"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab("limit")}
              className={`flex-1 py-2 rounded transition-colors ${
                activeTab === "limit"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Limit
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sell</label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <input type="number" placeholder="0.00" className="w-full bg-transparent text-white outline-none" />
                <div className="text-xs text-gray-400 mt-2">Balance: 5.42 ETH</div>
              </div>
            </div>

            <button className="w-full text-gray-400 hover:text-white py-2 text-sm">↓ Swap ↑</button>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Buy</label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <input type="number" placeholder="0.00" className="w-full bg-transparent text-white outline-none" />
                <div className="text-xs text-gray-400 mt-2">Balance: 12,450 USDC</div>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
              Connect Wallet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
