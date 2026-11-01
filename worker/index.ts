
import { createServer } from "node:http";

const port = Number(process.env.WORKER_HEALTH_PORT || 8787);

const server = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200);

    res.end(
      JSON.stringify({
        ok: true,
        worker: "munna-video-studio-worker",
        readyForJobs: false,
        message: "Worker health check successful"
      })
    );

    return;
  }

  res.writeHead(503);

  res.end(
    JSON.stringify({
      ok: false,
      error: "Media processing is not configured yet.",
      required: [
        "Durable job queue",
        "Secure file storage",
        "FFmpeg",
        "AI video provider",
        "AI transcription provider"
      ]
    })
  );
});

server.listen(port, () => {
  console.log(
    `Munna Video Studio Worker running on port ${port}`
  );
});
