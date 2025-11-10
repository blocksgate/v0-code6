import { NextResponse } from "next/server"

/**
 * WebSocket endpoint for real-time arbitrage opportunities
 * 
 * This endpoint provides Server-Sent Events (SSE) for real-time arbitrage updates
 * since Next.js API routes don't support WebSocket directly.
 * 
 * Alternative: Use a WebSocket server (e.g., Socket.io) for true WebSocket support
 */
export async function GET(request: Request) {
  // Check if this is an SSE request
  const acceptHeader = request.headers.get("accept")
  if (acceptHeader?.includes("text/event-stream")) {
    // Set up SSE headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    })

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(encoder.encode("data: {\"type\":\"connected\"}\n\n"))

        // Poll for arbitrage opportunities every 5 seconds
        const interval = setInterval(async () => {
          try {
            // Import here to avoid circular dependencies
            const { detectArbitrageOpportunities } = await import("@/lib/arbitrage-detector")
            
            const opportunities = await detectArbitrageOpportunities(1, undefined, 0.1)
            
            // Send opportunities as SSE events
            for (const opp of opportunities) {
              const data = JSON.stringify({
                type: "arbitrage_opportunity",
                ...opp,
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          } catch (error) {
            console.error("[Arbitrage SSE] Error:", error)
            controller.enqueue(encoder.encode(`data: {\"type\":\"error\",\"message\":\"${error}\"}\n\n`))
          }
        }, 5000) // Poll every 5 seconds

        // Clean up on client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new Response(stream, { headers })
  }

  // Return regular JSON response for non-SSE requests
  return NextResponse.json({
    error: "This endpoint supports Server-Sent Events (SSE). Use Accept: text/event-stream header.",
    usage: "Connect with EventSource or fetch with Accept: text/event-stream header",
  })
}

