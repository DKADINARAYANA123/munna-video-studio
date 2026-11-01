type ChatMessage = { role: "system" | "user"; content: string };

export async function askLLM(messages: ChatMessage[]): Promise<string | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.2
    }),
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LLM provider error (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}
