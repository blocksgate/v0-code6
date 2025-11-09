import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getWalletSignature } from "@/lib/wallet-auth"

export enum UserRole {
  USER = "user",
  TRADER = "trader",
  ADMIN = "admin",
}

export interface AuthenticatedUser {
  id: string
  role: UserRole
  walletAddress?: string
}

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Check session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = [
    "/api/orders",
    "/api/portfolio",
    "/api/trades",
    "/dashboard",
  ]

  // Admin only routes
  const adminPaths = [
    "/api/admin",
    "/dashboard/admin",
  ]

  const path = request.nextUrl.pathname

  // Check if route requires authentication
  const isProtectedRoute = protectedPaths.some(route => path.startsWith(route))
  const isAdminRoute = adminPaths.some(route => path.startsWith(route))

  if (isProtectedRoute || isAdminRoute) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role from database
    const { data: userData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json({ error: "User role not found" }, { status: 403 })
    }

    // Check admin access
    if (isAdminRoute && userData.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // For routes requiring wallet authentication
    if (path.startsWith("/api/orders") || path.startsWith("/api/trades")) {
      const walletSignature = request.headers.get("x-wallet-signature")
      if (!walletSignature) {
        return NextResponse.json({ error: "Wallet signature required" }, { status: 401 })
      }

      // Verify wallet signature
      try {
        const isValid = await getWalletSignature(session.user.id, walletSignature)
        if (!isValid) {
          return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 })
        }
      } catch (error) {
        return NextResponse.json({ error: "Wallet verification failed" }, { status: 500 })
      }
    }

    // Attach user info to request
    const authenticatedUser: AuthenticatedUser = {
      id: session.user.id,
      role: userData.role as UserRole,
      walletAddress: session.user.user_metadata.wallet_address,
    }

    // Clone request headers and append authenticated user info
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", authenticatedUser.id)
    requestHeaders.set("x-user-role", authenticatedUser.role)
    if (authenticatedUser.walletAddress) {
      requestHeaders.set("x-wallet-address", authenticatedUser.walletAddress)
    }

    // Create new request with modified headers
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: requestHeaders,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    })

    return NextResponse.next({
      request: modifiedRequest,
    })
  }

  return res
}