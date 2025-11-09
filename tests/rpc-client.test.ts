import { describe, it, expect, vi, beforeEach } from "vitest"
import { SupabaseRpcClient } from "../lib/supabase/rpc-client"
import { RpcError } from "../lib/types/supabase-functions"
import { supabase } from "../lib/supabase/client"

vi.mock("../lib/supabase/client", () => ({
  supabase: {
    rpc: vi.fn()
  }
}))

describe("SupabaseRpcClient", () => {
  let client: SupabaseRpcClient

  beforeEach(() => {
    client = new SupabaseRpcClient()
    vi.clearAllMocks()
  })

  describe("getDailyPnL", () => {
    const mockArgs = {
      user_id: "test-user",
      start_date: "2025-01-01",
      end_date: "2025-01-02",
      token_filter: null
    }

    it("should return data on successful RPC call", async () => {
      const mockData = [{ date: "2025-01-01", pnl: "100" }]
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockData, error: null })

      const result = await client.getDailyPnL(mockArgs)
      expect(result).toEqual(mockData)
      expect(supabase.rpc).toHaveBeenCalledWith("get_daily_pnl", mockArgs)
    })

    it("should throw RpcError on error response", async () => {
      const mockError = { message: "Test error", code: "TEST_ERROR" }
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: mockError })

      await expect(client.getDailyPnL(mockArgs)).rejects.toThrow(RpcError)
      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("code", "TEST_ERROR")
    })

    it("should throw RpcError on null data", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null })

      await expect(client.getDailyPnL(mockArgs)).rejects.toThrow(RpcError)
      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("code", "NO_DATA")
    })
  })

  // Similar tests for other RPC methods...
})