import { askLLM } from "@/lib/llm";

export type Highlight = { title: string; hook: string; startSec: number; endSec: number; reason: string };

export async function chooseHighlights(transcript: string, durationSec = 600): Promise<Highlight[]> {
  const safeDuration = Math.max(1, Math.min(durationSec, 24 * 60 * 60));
  const result = await askLLM([
    { role: "system", content: "Select short-form video highlights. Output only a JSON array. Each item needs title, hook, startSec, endSec, reason. Clips should be 30-60 seconds, within the supplied duration, and should not invent transcript content." },
    { role: "user", content: `Duration seconds: ${safeDuration}\nTranscript:\n${transcript.slice(0, 18000)}` }
  ]);
  if (result) {
    try {
      const parsed = JSON.parse(result) as Highlight[];
      return parsed.filter(h => Number.isFinite(h.startSec) && Number.isFinite(h.endSec) &&
        h.startSec >= 0 && h.endSec > h.startSec && h.endSec <= safeDuration &&
        h.endSec - h.startSec <= 90).slice(0, 8);
    } catch {
      // A malformed model response falls through to safe demo highlights.
    }
  }
  return [{
    title: "Opening highlight",
    hook: "The key idea in 45 seconds",
    startSec: 0,
    endSec: Math.min(45, safeDuration),
    reason: "Demo highlight. Configure an LLM and transcript provider for real analysis."
  }];
}

export async function createVideoJob(sourceUrl?: string) {
  // This is a queue adapter seam. In production, enqueue a durable job in BullMQ/SQS/Cloud Tasks.
  // Do not run FFmpeg or download arbitrary remote URLs inside a short-lived serverless function.
  return {
    id: crypto.randomUUID(),
    status: "QUEUED",
    sourceUrl: sourceUrl ?? null,
    steps: [
      { name: "Audio extraction", status: "PENDING" },
      { name: "Transcription", status: "PENDING" },
      { name: "Highlight selection", status: "PENDING" },
      { name: "Vertical rendering", status: "PENDING" }
    ],
    note: "Queue adapter demo. Connect a durable worker to perform real processing."
  };
}
