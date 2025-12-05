import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    const missing = []
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    console.error("[v0] Missing Supabase environment variables:", missing.join(", "))
    throw new Error(`Supabase configuration error: ${missing.join(", ")} not set`)
  }

  browserClient = createBrowserClient(url, key)

  return browserClient
}
