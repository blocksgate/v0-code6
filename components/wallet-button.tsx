"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/wallet-context"
import { Spinner } from "@/components/ui/spinner"

export function WalletButton() {
  const { address, connected, connect, disconnect, isConnecting, error, isDemoMode } = useWallet()

  const handleClick = async () => {
    if (connected) {
      disconnect()
    } else {
      try {
        await connect("demo")
      } catch (error) {
        console.error("[v0] Connection error:", error)
      }
    }
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={isConnecting}
        className={`${
          connected
            ? isDemoMode
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        } text-white border-0`}
      >
        {isConnecting ? (
          <>
            <Spinner className="mr-2" />
            Connecting...
          </>
        ) : connected ? (
          <>
            {truncateAddress(address || "0x")}
            {isDemoMode && " (Demo)"}
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>
      {error && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{error}</div>}
    </div>
  )
}
