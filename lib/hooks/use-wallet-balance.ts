/**
 * Simplified hook for wallet balance without Web3 dependency
 * Falls back to mock data if Web3 is not available
 */

import { useState, useEffect } from "react"
import { useWallet } from "../wallet-context"

export function useWalletBalance() {
  const [ethBalance, setEthBalance] = useState("0")
  const [loading, setLoading] = useState(true)
  const { address, connected } = useWallet()

  useEffect(() => {
    if (!connected || !address) {
      setEthBalance("0")
      setLoading(false)
      return
    }

    const fetchBalance = async () => {
      try {
        setLoading(true)
        
        // Try to get balance from Web3 provider
        if (typeof window !== "undefined" && window.ethereum) {
          try {
            const balance = await window.ethereum.request({
              method: "eth_getBalance",
              params: [address, "latest"],
            })
            
            // Convert from hex wei to ETH
            const balanceInWei = BigInt(balance)
            const balanceInEth = Number(balanceInWei) / 1e18
            setEthBalance(balanceInEth.toFixed(6))
          } catch (error) {
            console.error("[Balance] Web3 error:", error)
            // Fallback to mock data
            setEthBalance("0.00")
          }
        } else {
          // No Web3 provider, use mock data
          setEthBalance("0.00")
        }
      } catch (error) {
        console.error("[Balance] Error:", error)
        setEthBalance("0.00")
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, connected])

  return { balance: ethBalance, loading }
}

