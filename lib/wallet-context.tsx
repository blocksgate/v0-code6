"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { initializeWalletConnect } from "@/lib/wallet-connect"

interface WalletContextType {
  address: string | null
  connected: boolean
  connect: (type?: "metamask" | "walletconnect" | "demo") => Promise<void>
  disconnect: () => void
  isConnecting: boolean
  error: string | null
  isDemoMode: boolean
  setDemoMode: (demo: boolean) => void
  walletType: "metamask" | "walletconnect" | "demo"
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [walletType, setWalletType] = useState<"metamask" | "walletconnect" | "demo">("demo")

  const connect = useCallback(async (type: "metamask" | "walletconnect" | "demo" = "demo") => {
    setIsConnecting(true)
    setError(null)
    try {
      if (typeof window === "undefined") {
        throw new Error("Wallet connection requires browser environment")
      }

      if (type === "walletconnect") {
        const wcProvider = initializeWalletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        })
        await wcProvider.initialize()
        const accounts = await wcProvider.connect()

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setConnected(true)
          setWalletType("walletconnect")
          setIsDemoMode(false)
          localStorage.setItem("walletAddress", accounts[0])
          localStorage.setItem("walletType", "walletconnect")
          console.log("[v0] WalletConnect connected:", accounts[0])
          return
        }
      } else if (type === "metamask") {
        if (!window.ethereum) {
          console.log("[v0] No wallet detected, entering demo mode")
          setIsDemoMode(true)
          setAddress("0x1234567890123456789012345678901234567890")
          setConnected(true)
          setWalletType("demo")
          localStorage.setItem("walletAddress", "0x1234567890123456789012345678901234567890")
          localStorage.setItem("demoMode", "true")
          return
        }

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setConnected(true)
          setWalletType("metamask")
          setIsDemoMode(false)
          localStorage.setItem("walletAddress", accounts[0])
          localStorage.setItem("walletType", "metamask")
          localStorage.removeItem("demoMode")
          console.log("[v0] MetaMask connected:", accounts[0])
        }
      } else if (type === "demo") {
        setIsDemoMode(true)
        setAddress("0x1234567890123456789012345678901234567890")
        setConnected(true)
        setWalletType("demo")
        localStorage.setItem("walletAddress", "0x1234567890123456789012345678901234567890")
        localStorage.setItem("demoMode", "true")
        console.log("[v0] Demo mode activated")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet"
      console.log("[v0] Connection error:", errorMessage)
      setError(errorMessage)
      setConnected(false)
      setAddress(null)
      localStorage.removeItem("walletAddress")
      localStorage.removeItem("walletType")
      localStorage.removeItem("demoMode")
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setConnected(false)
    setIsDemoMode(false)
    setError(null)
    setWalletType("demo")
    localStorage.removeItem("walletAddress")
    localStorage.removeItem("walletType")
    localStorage.removeItem("demoMode")
    console.log("[v0] Wallet disconnected")
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const attemptAutoConnect = () => {
      try {
        if (typeof window !== "undefined") {
          const savedAddress = localStorage.getItem("walletAddress")
          const wasDemoMode = localStorage.getItem("demoMode") === "true"
          const savedWalletType = localStorage.getItem("walletType")

          if (savedAddress) {
            setAddress(savedAddress)
            setConnected(true)
            if (savedWalletType === "walletconnect") {
              setWalletType("walletconnect")
            } else if (savedWalletType === "metamask") {
              setWalletType("metamask")
            } else {
              setWalletType("demo")
            }
            if (wasDemoMode) {
              setIsDemoMode(true)
            }
            console.log("[v0] Auto-connected wallet:", savedAddress)
          }
        }
      } catch (err) {
        // Silently ignore auto-connect errors
      }
    }

    attemptAutoConnect()
  }, [isMounted])

  return (
    <WalletContext.Provider
      value={{
        address,
        connected,
        connect,
        disconnect,
        isConnecting,
        error,
        isDemoMode,
        setDemoMode: setIsDemoMode,
        walletType,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return context
}
