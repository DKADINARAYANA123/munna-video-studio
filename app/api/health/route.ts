import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "autoclip-flow-ai",
    mode: process.env.LLM_API_KEY ? "llm-configured" : "demo",
    timestamp: new Date().toISOString()
  });
}
