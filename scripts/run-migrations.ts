import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  console.error("Please set these environment variables and try again.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
})

const migrations = [
  "001_create_profiles.sql",
  "002_create_trades.sql",
  "003_create_portfolios.sql",
  "004_create_orders.sql",
  "005_create_price_history.sql",
  "006_create_audit_logs.sql",
]

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n")

  let successCount = 0
  let failCount = 0

  for (const migration of migrations) {
    const filePath = path.join(__dirname, migration)

    try {
      const sql = fs.readFileSync(filePath, "utf-8")

      console.log(`⏳ [${migration}] Executing...`)

      const { data, error } = await supabase.rpc("exec", {
        sql_query: sql,
      })

      if (error) {
        console.error(`❌ [${migration}] Error:`, error.message)
        failCount++
      } else {
        console.log(`✅ [${migration}] Success\n`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ [${migration}] Error reading file:`, (err as Error).message)
      failCount++
    }
  }

  console.log(`\n📊 Migration Summary:`)
  console.log(`✅ Success: ${successCount}/${migrations.length}`)
  console.log(`❌ Failed: ${failCount}/${migrations.length}`)

  if (failCount === 0) {
    console.log("\n🎉 All migrations completed successfully!")
  } else {
    console.log("\n⚠️ Some migrations failed. Please check the errors above.")
    process.exit(1)
  }
}

runMigrations().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
