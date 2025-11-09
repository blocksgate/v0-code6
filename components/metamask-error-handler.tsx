"use client"

import { useEffect } from "react"

/**
 * Suppresses MetaMask RPC errors for methods that don't exist
 * These errors come from MetaMask's internal code and don't affect functionality
 */
export function MetaMaskErrorHandler() {
  useEffect(() => {
    // Suppress console errors from MetaMask for non-existent methods
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const message = args[0]?.message || args[0] || ""
      const errorString = String(message)
      
      // Suppress MetaMask RPC errors for non-existent methods
      if (
        errorString.includes("isDefaultWallet") ||
        errorString.includes("getEnabledChains") ||
        errorString.includes("does not exist / is not available")
      ) {
        return // Suppress these errors
      }
      
      originalConsoleError.apply(console, args)
    }

    // Handle unhandled promise rejections from MetaMask
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      if (
        error?.message?.includes("isDefaultWallet") ||
        error?.message?.includes("getEnabledChains") ||
        error?.message?.includes("does not exist / is not available")
      ) {
        event.preventDefault() // Suppress the error
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      console.error = originalConsoleError
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

