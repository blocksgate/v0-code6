import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase credentials missing. Skipping auth proxy.")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

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

  // Check if route requires authentication
  const isProtectedRoute = protectedPaths.some(route => path.startsWith(route))
  const isAdminRoute = adminPaths.some(route => path.startsWith(route))

  // Handle protected routes
  if (isProtectedRoute || isAdminRoute) {
    if (!user) {
      // For API routes, return JSON error
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      // For page routes, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Get user role from database
    const { data: userData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (error || !userData) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "User role not found" }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // Check admin access
    if (isAdminRoute && userData.role !== UserRole.ADMIN) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // For routes requiring wallet authentication
    // Note: Wallet signature verification should be handled in the API route itself
    // since it requires browser APIs that aren't available in middleware
    if (path.startsWith("/api/orders") || path.startsWith("/api/trades")) {
      const walletSignature = request.headers.get("x-wallet-signature")
      if (!walletSignature) {
        return NextResponse.json({ error: "Wallet signature required" }, { status: 401 })
      }
      // Signature validation will be done in the API route handler
    }

    // Attach user info to request headers
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      role: userData.role as UserRole,
      walletAddress: user.user_metadata?.wallet_address,
    }

    // Clone request headers and append authenticated user info
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", authenticatedUser.id)
    requestHeaders.set("x-user-role", authenticatedUser.role)
    if (authenticatedUser.walletAddress) {
      requestHeaders.set("x-wallet-address", authenticatedUser.walletAddress)
    }

    // Update response with modified headers
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Redirect authenticated users away from auth pages
  if (
    (path.startsWith("/auth/login") || path.startsWith("/auth/sign-up")) &&
    user
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
