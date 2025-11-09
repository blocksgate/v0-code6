import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    let query = supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ orders: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Rate limit per IP/key to protect public POST endpoints
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.2 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }
    const body = await request.json()

    // Validate incoming order payload to prevent malformed data being written to DB
    const OrderSchema = z.object({
      type: z.enum(["limit", "market"]).optional(),
      token_in: z.string().min(1),
      token_out: z.string().min(1),
      // accept string or number for amount and normalize to string
      amount: z.union([z.string().min(1), z.number()]).transform((v) => String(v)),
      // optional price for limit orders
      price: z.union([z.string(), z.number()]).optional(),
      side: z.enum(["buy", "sell"]).optional(),
      chain_id: z.number().optional(),
      status: z.string().optional(),
      metadata: z.any().optional(),
    })

    const parsed = OrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const orderPayload = parsed.data

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        ...orderPayload,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 },
    )
  }
}
