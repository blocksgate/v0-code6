#!/usr/bin/env node
/*
  Background worker scaffold for executing pending orders.
  This is a safe scaffold that logs pending orders and demonstrates how to hook into trading-engine/trade-service.
  Run locally with: `pnpm worker` (script added to package.json)
*/

import { createClient } from "@/lib/supabase/server"
import { sleep } from "@/lib/utils"

async function processPendingOrders() {
  const supabase = await createClient()

  console.log("[worker] starting order executor loop")

  while (true) {
    try {
      // fetch a small batch of pending orders (status = 'pending')
      const { data: orders, error } = await supabase.from("orders").select("*").eq("status", "pending").limit(10)
      if (error) {
        console.error("[worker] supabase error fetching orders:", error.message || error)
      } else if (orders && orders.length > 0) {
        for (const order of orders) {
          console.log(`[worker] would execute order id=${order.id} user=${order.user_id} token_in=${order.token_in} amount=${order.amount}`)
          // TODO: replace the following with calls to trading-engine / trade-service
          // e.g. await tradingEngine.executeOrder(order)

          // For safety, mark as 'queued' instead of executing automatically in scaffold
          await supabase.from("orders").update({ status: "queued" }).eq("id", order.id)
        }
      }
    } catch (err) {
      console.error("[worker] unexpected error:", err)
    }

    // sleep between iterations
    await sleep(3000)
  }
}

// allow running directly
if (require.main === module) {
  processPendingOrders().catch((err) => {
    console.error("Order executor failed:", err)
    process.exit(1)
  })
}
