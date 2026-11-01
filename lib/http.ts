import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function getDemoUserId() {
  // DEMO ONLY: replace with a verified session user ID from your auth provider.
  return process.env.DEMO_USER_ID || "demo-user";
}
export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
