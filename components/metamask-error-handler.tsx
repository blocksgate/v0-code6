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
    const originalConsoleWarn = console.warn
    
    console.error = (...args: any[]) => {
      const message = args[0]?.message || args[0] || ""
      const errorString = String(message)
      
      // Suppress MetaMask RPC errors for non-existent methods
      if (
        errorString.includes("isDefaultWallet") ||
        errorString.includes("getEnabledChains") ||
        errorString.includes("does not exist / is not available") ||
        errorString.includes("ethereum.send")
      ) {
        return // Suppress these errors
      }
      
      originalConsoleError.apply(console, args)
    }

    console.warn = (...args: any[]) => {
      const message = args[0]?.message || args[0] || ""
      const errorString = String(message)
      
      // Suppress MetaMask deprecation warnings
      if (
        errorString.includes("ethereum.send") ||
        errorString.includes("isDefaultWallet") ||
        errorString.includes("getEnabledChains")
      ) {
        return // Suppress these warnings
      }
      
      originalConsoleWarn.apply(console, args)
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
      console.warn = originalConsoleWarn
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

