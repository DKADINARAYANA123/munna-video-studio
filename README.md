# AutoClip & Flow AI

A Next.js starter for AI workflow automation and short-form video repurposing.

## Current implementation
- Responsive dark dashboard with Overview, Workflow Hub, and Video Studio.
- `POST /api/workflows/execute`: validates and executes supported demo actions.
- `POST /api/webhooks/:workflowId`: webhook intake scaffold.
- `POST /api/video/jobs`: validates input and creates a demo queue job.
- Optional OpenAI-compatible chat-completions integration for lead scoring/highlight selection.
- Prisma schema for users, workflows, workflow runs, video projects, and clip assets.
- Worker health endpoint scaffold.

## Not yet production-complete
Authentication, tenant authorization, durable queue, database writes, signed media uploads, source URL SSRF defenses, actual transcription, FFmpeg rendering, object storage, billing, rate limiting, and provider OAuth need to be configured before public launch. The UI's metrics and initial logs are illustrative demo data. Do not represent them as live analytics.

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local` and configure `DATABASE_URL`.
3. Install dependencies: `npm install`.
4. Generate Prisma client: `npm run db:generate`.
5. Apply schema: `npm run db:push`.
6. Start development server: `npm run dev`.
7. Open `http://localhost:3000`.

If no LLM key is configured, lead qualification uses a clearly labeled demo fallback. Keep API keys in server environment variables only.

## Netlify
1. Push this repository to GitHub.
2. Import the repository in Netlify.
3. Add environment variables from `.env.example` in Site configuration > Environment variables.
4. Use the Netlify Next.js plugin configuration in `netlify.toml`.
5. Deploy and check `/api/health`.
6. Use managed PostgreSQL (Neon, Supabase, or equivalent) for `DATABASE_URL`.
7. Deploy `worker/` to a separate Node host/container with FFmpeg, then connect a durable queue.

Do not store uploaded videos in a serverless function's local filesystem. Use signed direct uploads to object storage (S3/R2) and a worker that downloads only validated sources.

## Security checklist before production
- Add authentication (e.g. Auth.js or a managed identity provider) and derive user ID from the verified session.
- Replace demo IDs with tenant-scoped DB queries and ownership checks.
- Add rate limits and abuse monitoring to all public endpoints.
- Sign webhooks with per-workflow HMAC secrets and constant-time comparison.
- Use an allowlist for outbound HTTP actions; block localhost/private/link-local IPs and redirects to them.
- Validate source URL DNS/redirect destinations, MIME type, file size, and duration in the worker.
- Use signed object-storage URLs with short expirations.
- Persist workflow and video job states, add idempotency keys, and retry with exponential backoff/dead-letter handling.
- Add tests, structured logs, metrics, alerts, privacy policy, and deletion/export workflows.
