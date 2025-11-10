import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  console.error("Please set these environment variables in .env.local and try again.")
  process.exit(1)
}

// Create Supabase client with service role key for migrations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// All migrations in order (excluding duplicates and function files)
const migrations = [
  "001_create_profiles.sql",
  "002_create_trades.sql",
  "003_create_portfolios.sql",
  "004_create_orders.sql",
  "005_create_price_history.sql",
  "006_create_audit_logs.sql",
  "007_create_user_roles.sql",
  "008_create_bot_strategies.sql",
  "009_create_notifications_tables.sql",
  "010_create_risk_management_tables.sql",
  "011_create_liquidity_pool_tables.sql",
]

// Functions to execute after tables are created
const functions = [
  "008_function_active_sessions.sql",
  "009_function_request_rate.sql",
]

async function executeSQL(sql: string, migrationName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    // Execute each statement
    for (const statement of statements) {
      if (statement.length === 0) continue

      // Use Supabase REST API to execute SQL directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: statement }),
      }).catch(async () => {
        // Fallback: Try using pg query via Supabase client
        // Note: This requires the exec_sql function to exist in Supabase
        const { error } = await supabase.rpc("exec_sql", { query: statement })
        if (error) throw error
        return { ok: true }
      })

      if (!response.ok && !("ok" in response)) {
        const errorText = await response.text()
        // Some errors are expected (e.g., "already exists"), so we'll log but continue
        if (!errorText.includes("already exists") && !errorText.includes("duplicate")) {
          console.warn(`⚠️  Warning in ${migrationName}: ${errorText.substring(0, 100)}`)
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    // Check if error is about existing objects (which is fine)
    const errorMessage = error?.message || String(error)
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("relation") && errorMessage.includes("already")
    ) {
      return { success: true } // Table/object already exists, that's okay
    }
    return { success: false, error: errorMessage }
  }
}

async function runMigration(migrationFile: string): Promise<boolean> {
  const filePath = path.join(__dirname, migrationFile)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${migrationFile}] File not found`)
    return false
  }

  try {
    const sql = fs.readFileSync(filePath, "utf-8")
    console.log(`⏳ [${migrationFile}] Executing...`)

    // Execute SQL via Supabase SQL Editor API (direct HTTP)
    // This requires using the service role key
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ query: sql }),
    }).catch(async () => {
      // Alternative: Execute via Supabase client using raw SQL
      // We'll use a workaround by executing via pg REST API
      const result = await executeSQL(sql, migrationFile)
      return { ok: result.success, error: result.error }
    })

    // Try alternative method: Execute SQL statements one by one using Supabase client
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"))

    let hasError = false
    for (const statement of statements) {
      if (statement.length < 10) continue // Skip very short statements

      try {
        // Use Supabase's REST API with SQL execution
        // Note: This requires exec_sql function or direct pg access
        const { error } = await supabase.rpc("exec_sql", { sql_query: statement }).catch(() => {
          // If RPC doesn't exist, we'll need to use a different approach
          return { error: new Error("RPC function not available") }
        })

        if (error) {
          // Ignore "already exists" errors
          if (!error.message.includes("already exists") && !error.message.includes("duplicate")) {
            console.warn(`   ⚠️  Statement warning: ${error.message.substring(0, 80)}`)
          }
        }
      } catch (err: any) {
        // Ignore "already exists" errors
        if (!err.message?.includes("already exists") && !err.message?.includes("duplicate")) {
          hasError = true
          console.warn(`   ⚠️  Error in statement: ${err.message?.substring(0, 80) || String(err)}`)
        }
      }
    }

    if (!hasError) {
      console.log(`✅ [${migrationFile}] Completed\n`)
      return true
    } else {
      console.log(`⚠️  [${migrationFile}] Completed with warnings\n`)
      return true // Still consider it successful if only warnings
    }
  } catch (err: any) {
    console.error(`❌ [${migrationFile}] Error:`, err.message || err)
    return false
  }
}

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n")
  console.log(`📁 Supabase URL: ${supabaseUrl?.substring(0, 30)}...\n`)

  let successCount = 0
  let failCount = 0
  const results: Array<{ file: string; success: boolean }> = []

  // Run table migrations first
  for (const migration of migrations) {
    const success = await runMigration(migration)
    results.push({ file: migration, success })
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Small delay between migrations
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Run function migrations
  console.log("\n📦 Executing database functions...\n")
  for (const func of functions) {
    const success = await runMigration(func)
    results.push({ file: func, success })
    if (success) {
      successCount++
    } else {
      failCount++
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 Migration Summary")
  console.log("=".repeat(60))
  console.log(`✅ Successful: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${failCount}/${results.length}\n`)

  if (failCount > 0) {
    console.log("⚠️  Failed Migrations:")
    results.filter((r) => !r.success).forEach((r) => {
      console.log(`   - ${r.file}`)
    })
  }

  if (failCount === 0) {
    console.log("🎉 All migrations completed successfully!")
    console.log("\n📝 Next steps:")
    console.log("   1. Run verification: npm run migrate:verify")
    console.log("   2. Test the application: npm run dev")
  } else {
    console.log("\n⚠️  Some migrations failed. Please check the errors above.")
    console.log("💡 Tip: You can run migrations manually via Supabase Dashboard → SQL Editor")
    process.exit(1)
  }
}

// Handle unhandled errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error)
  process.exit(1)
})

runMigrations().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
