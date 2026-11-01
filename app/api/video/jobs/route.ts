import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createVideoJob } from "@/lib/video-pipeline";
import { isValidHttpUrl } from "@/lib/http";

export const runtime = "nodejs";
const schema = z.object({ sourceUrl: z.string().url().optional() });

export async function POST(request: NextRequest) {
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid sourceUrl." }, { status: 400 });
  if (parsed.data.sourceUrl && !isValidHttpUrl(parsed.data.sourceUrl)) {
    return NextResponse.json({ error: "Only HTTP or HTTPS source URLs are accepted." }, { status: 400 });
  }

  // Important: URL validation alone does not prevent SSRF. A production worker must
  // block private IP ranges, re-check redirects/DNS, limit file size and content type,
  // and allowlist source providers where possible.
  try {
    const job = await createVideoJob(parsed.data.sourceUrl);
    // Production: persist VideoProject and enqueue job to SQS/Cloud Tasks/BullMQ.
    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not queue video job." }, { status: 500 });
  }
}
