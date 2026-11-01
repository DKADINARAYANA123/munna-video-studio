import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
const payloadSchema = z.record(z.unknown());

export async function POST(request: NextRequest, context: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(workflowId)) return NextResponse.json({ error: "Invalid workflow ID." }, { status: 400 });

  // Replace with a per-workflow signing secret and HMAC verification.
  // Never treat an arbitrary public webhook as an authenticated privileged action.
  const secret = process.env.WORKER_SHARED_SECRET;
  if (secret && request.headers.get("x-workflow-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Expected JSON payload." }, { status: 401 }); }
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload must be an object." }, { status: 400 });

  // Production: look up the workflow by ID, verify enabled/owner, then enqueue a durable run.
  return NextResponse.json({ accepted: true, workflowId, status: "QUEUED", message: "Webhook received; connect durable queue and database to execute." }, { status: 202 });
}
