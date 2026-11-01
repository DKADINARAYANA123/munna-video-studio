
"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type Scene = {
  text: string;
};

function makeScenes(value: string): Scene[] {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((text) => ({ text }));
}

function drawFrame(
  canvas: HTMLCanvasElement,
  scenes: Scene[],
  title: string,
  elapsed: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const sceneIndex = Math.min(
    Math.floor(elapsed / 4),
    Math.max(0, scenes.length - 1)
  );

  const scene = scenes[sceneIndex];

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#101044");
  gradient.addColorStop(0.5, "#4b1d72");
  gradient.addColorStop(1, "#0d7180");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 12; i++) {
    const x = (i * 137 + elapsed * 25) % width;
    const y = (i * 83 + Math.sin(elapsed + i) * 35) % height;

    ctx.beginPath();
    ctx.arc(x, y, 20 + (i % 4) * 10, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#facc15";
  ctx.font = "bold 34px Arial";
  ctx.fillText(title || "Munna Video Studio", width / 2, 100);

  if (scene) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px Arial";

    const words = scene.text.split(" ");
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;

      if (ctx.measureText(test).width > 1050 && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);

    const lineHeight = 72;
    const startY =
      height / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((text, index) => {
      ctx.fillText(text, width / 2, startY + index * lineHeight);
    });

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "22px Arial";
    ctx.fillText(
      `Scene ${sceneIndex + 1} / ${scenes.length}`,
      width / 2,
      height - 65
    );
  }
}

export default function TextToVideoStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const ffmpegLoadingRef = useRef<Promise<FFmpeg> | null>(null);

  const [title, setTitle] = useState("Munna Video Studio");

  const [text, setText] = useState(
    "Welcome to Munna Video Studio\nCreate amazing videos with your ideas\nYour creativity starts here"
  );

  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [mp4Progress, setMp4Progress] = useState("");

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [voiceLang, setVoiceLang] = useState("te-IN");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicName, setMusicName] = useState("");
  const [musicVolume, setMusicVolume] = useState(0.25);

  const scenes = makeScenes(text);
  const duration = Math.max(1, scenes.length) * 4;

  // Load voices available in the browser
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Release uploaded music URL when it changes or component closes
  useEffect(() => {
    return () => {
      if (musicUrl) URL.revokeObjectURL(musicUrl);
    };
  }, [musicUrl]);

  // Preview animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = ((now - startTime) / 1000) % duration;
      drawFrame(canvas, scenes, title, elapsed);
      frameId = requestAnimationFrame(animate);
    };

    if (playing) {
      frameId = requestAnimationFrame(animate);
    } else {
      drawFrame(canvas, scenes, title, 0);
    }

    return () => cancelAnimationFrame(frameId);
  }, [playing, text, title, duration]);

  async function getFFmpeg() {
    if (ffmpegRef.current) return ffmpegRef.current;

    if (ffmpegLoadingRef.current) {
      return ffmpegLoadingRef.current;
    }

    const loading = (async () => {
      const ffmpeg = new FFmpeg();

      const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        )
      });

      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    })();

    ffmpegLoadingRef.current = loading;

    try {
      return await loading;
    } catch (error) {
      ffmpegLoadingRef.current = null;
      throw error;
    }
  }

  function speakScene(scene: Scene): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        reject(new Error("ఈ బ్రౌజర్‌లో Voice మద్దతు లేదు."));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(scene.text);
      const selectedVoice = voices.find(
        (voice) => voice.name === voiceName
      );

      utterance.lang = selectedVoice?.lang || voiceLang;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();

      utterance.onerror = (event) => {
        reject(new Error(`Voice సమస్య: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async function previewVoice() {
    if (scenes.length === 0) {
      setMessage("ముందుగా టెక్స్ట్ ఇవ్వండి.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      setMessage("మీ బ్రౌజర్‌లో Speech Voice అందుబాటులో లేదు.");
      return;
    }

    window.speechSynthesis.cancel();
    setMessage("Voice Preview ప్లే అవుతోంది...");

    try {
      for (const scene of scenes) {
        await speakScene(scene);
      }

      setMessage("Voice Preview పూర్తయింది.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Voice Preview విఫలమైంది."
      );
    }
  }

  function stopVoice() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMessage("Voice ఆపబడింది.");
  }

  function handleMusicUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/mp4",
      "audio/aac"
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !/\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)
    ) {
      setMessage("MP3, WAV, OGG, M4A లేదా AAC ఫైల్ ఎంచుకోండి.");
      event.target.value = "";
      return;
    }

    setMusicUrl(URL.createObjectURL(file));
    setMusicName(file.name);
    setMessage("Background Music జోడించబడింది.");
  }

  function playPreview() {
    if (scenes.length === 0) {
      setMessage("ముందుగా కొన్ని సన్నివేశాలు టైప్ చేయండి.");
      return;
    }

    setMessage("");
    setPlaying(true);
  }

  function stopPreview() {
    setPlaying(false);
  }

  async function exportVideo() {
    const canvas = canvasRef.current;
    const audio = audioRef.current;

    if (!canvas || scenes.length === 0) {
      setMessage("ముందుగా వీడియో టెక్స్ట్ ఇవ్వండి.");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setMessage("Chrome Desktop ఉపయోగించండి. Tab Audio Capture అందుబాటులో లేదు.");
      return;
    }

    if (!("speechSynthesis" in window)) {
      setMessage("ఈ బ్రౌజర్‌లో Voice మద్దతు లేదు.");
      return;
    }

    setExporting(true);
    setPlaying(false);
    setMessage("");
    setMp4Progress("Chrome Tab Audio అనుమతి కోసం వేచి ఉంది...");

    let displayStream: MediaStream | null = null;
    let canvasStream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;

    try {
      window.speechSynthesis.cancel();

      // Select Chrome Tab and enable Share tab audio
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const tabAudioTracks = displayStream.getAudioTracks();

      if (tabAudioTracks.length === 0) {
        throw new Error(
          "Tab Audio అందలేదు. Share tab audio ఎంపికను టిక్ చేసి మళ్లీ ప్రయత్నించండి."
        );
      }

      canvasStream = canvas.captureStream(30);

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...tabAudioTracks
      ]);

      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
      ].find((type) => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        throw new Error("మీ Chrome బ్రౌజర్‌లో WebM Recording అందుబాటులో లేదు.");
      }

      recorder = new MediaRecorder(combinedStream, {
        mimeType
      });

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const recordingFinished = new Promise<void>((resolve, reject) => {
        recorder!.onstop = async () => {
          try {
            setMp4Progress("FFmpeg ప్రారంభమవుతోంది...");

            const ffmpeg = await getFFmpeg();

            setMp4Progress("WebM నుంచి MP4కి మారుస్తోంది...");

            const webmBlob = new Blob(chunks, {
              type: mimeType
            });

            await ffmpeg.writeFile(
              "input.webm",
              await fetchFile(webmBlob)
            );

            await ffmpeg.exec([
              "-i", "input.webm",
              "-c:v", "libx264",
              "-preset", "ultrafast",
              "-crf", "28",
              "-pix_fmt", "yuv420p",
              "-c:a", "aac",
              "-b:a", "128k",
              "-movflags", "+faststart",
              "output.mp4"
            ]);

            const data = await ffmpeg.readFile("output.mp4");

            const mp4Blob = new Blob(
              [data as BlobPart],
              { type: "video/mp4" }
            );

            const url = URL.createObjectURL(mp4Blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "munna-video-studio.mp4";

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 60000);

            await ffmpeg.deleteFile("input.webm");
            await ffmpeg.deleteFile("output.mp4");

            setMp4Progress("MP4 Export పూర్తయింది!");
            setMessage("Voice + Background Music + Video డౌన్‌లోడ్ అయ్యాయి.");

            resolve();
          } catch (error) {
            reject(error);
          }
        };

        recorder!.onerror = () => {
          reject(new Error("Video Recordingలో సమస్య వచ్చింది."));
        };
      });

      recorder.start();

      // Start background music
      if (audio && musicUrl) {
        audio.volume = musicVolume;
        audio.currentTime = 0;
        audio.loop = true;
        await audio.play();
      }

      // Narrate each scene while displaying it
      for (let i = 0; i < scenes.length; i++) {
        drawFrame(canvas, scenes, title, i * 4);
        setMp4Progress(
          `Voice Recording: Scene ${i + 1} / ${scenes.length}`
        );

        await speakScene(scenes[i]);
      }

      // Allow a short tail for the final audio
      await new Promise((resolve) => setTimeout(resolve, 500));

      recorder.stop();
      await recordingFinished;
    } catch (error) {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      console.error("Export error:", error);

      setMp4Progress("Export విఫలమైంది.");
      setMessage(
        error instanceof Error
          ? error.message
          : "వీడియో తయారీలో సమస్య వచ్చింది."
      );
    } finally {
      window.speechSynthesis.cancel();

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      displayStream?.getTracks().forEach((track) => track.stop());
      canvasStream?.getTracks().forEach((track) => track.stop());

      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-300">
            Munna Video Studio
          </h1>
          <p className="text-slate-400 mt-2">
            Free Text-to-Video + Voice + Music Studio
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-5">
            <h2 className="text-xl font-bold">
              వీడియో వివరాలు
            </h2>

            <div>
              <label className="block text-sm mb-2">
                వీడియో టైటిల్
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600"
                placeholder="వీడియో పేరు"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                సన్నివేశాల టెక్స్ట్
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600"
                placeholder="ప్రతి సన్నివేశాన్ని కొత్త లైన్‌లో టైప్ చేయండి"
              />
              <p className="text-xs text-slate-400 mt-2">
                ఒక్కో కొత్త లైన్ ఒక సన్నివేశం. గరిష్ఠంగా 10 సన్నివేశాలు.
              </p>
            </div>

            <div className="border-t border-slate-700 pt-5 space-y-3">
              <h3 className="font-bold text-lg text-cyan-300">
                AI Voice / Browser Voice
              </h3>

              <div>
                <label className="block text-sm mb-2">
                  Voice Language
                </label>
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600"
                >
                  <option value="te-IN">Telugu</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="hi-IN">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">
                  Available Browser Voice
                </label>
                <select
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-800 border border-slate-600"
                >
                  <option value="">Default Browser Voice</option>
                  {voices.map((voice) => (
                    <option
                      key={`${voice.name}-${voice.lang}`}
                      value={voice.name}
                    >
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>

                <p className="text-xs text-slate-400 mt-2">
                  Telugu Voice కనిపించకపోతే మీ కంప్యూటర్‌లో Telugu Speech Voice
                  అందుబాటులో లేకపోవచ్చు.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={previewVoice}
                  disabled={exporting || scenes.length === 0}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-4 py-2 rounded-lg"
                >
                  ▶ Play Voice
                </button>

                <button
                  onClick={stopVoice}
                  disabled={exporting}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                >
                  ■ Stop Voice
                </button>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-5 space-y-3">
              <h3 className="font-bold text-lg text-cyan-300">
                Background Music
              </h3>

              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.aac,audio/*"
                onChange={handleMusicUpload}
                className="w-full text-sm text-slate-300"
              />

              {musicName && (
                <p className="text-sm text-green-300">
                  ఎంచుకున్న సంగీతం: {musicName}
                </p>
              )}

              {musicUrl && (
                <audio
                  ref={audioRef}
                  src={musicUrl}
                  controls
                  loop
                  className="w-full"
                />
              )}

              <div>
                <label className="block text-sm mb-2">
                  Music Volume: {Math.round(musicVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) =>
                    setMusicVolume(Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="border-t border-slate-700 pt-5">
              <p className="text-sm text-slate-300">
                సన్నివేశాలు: {scenes.length}
              </p>
              <p className="text-sm text-slate-300">
                అంచనా వీడియో నిడివి: {duration} సెకన్లు (Voice నిడివిని బట్టి Export ఎక్కువ సమయం తీసుకోవచ్చు)
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={playPreview}
                disabled={exporting || scenes.length === 0}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-3 rounded-lg font-semibold"
              >
                ▶ Preview
              </button>

              <button
                onClick={stopPreview}
                disabled={exporting}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-lg font-semibold"
              >
                ■ Stop
              </button>

              <button
                onClick={exportVideo}
                disabled={exporting || scenes.length === 0}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-3 rounded-lg font-semibold"
              >
                {exporting ? "MP4 తయారవుతోంది..." : "⬇ Export MP4"}
              </button>
            </div>

            {mp4Progress && (
              <p className="p-3 rounded-lg bg-slate-800 text-cyan-300 text-sm">
                {mp4Progress}
              </p>
            )}

            {message && (
              <p className="p-3 rounded-lg bg-slate-800 text-sm text-green-300">
                {message}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">
              వీడియో ప్రివ్యూ
            </h2>

            <div className="bg-black rounded-2xl overflow-hidden border border-slate-700">
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="w-full h-auto"
              />
            </div>

            <div className="mt-5 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 space-y-2">
              <p>✓ Text-to-Video Animation</p>
              <p>✓ Browser Voiceover</p>
              <p>✓ Uploaded Background Music</p>
              <p>✓ MP4 Export with Audio</p>
              <p className="text-slate-400">
                Export సమయంలో Chrome Tab Audio Sharing అనుమతి అవసరం.
              </p>
            </div>
          </section>
        </div>

        <footer className="mt-8 text-xs text-slate-500">
          Free Browser Voice ఉపయోగించబడుతుంది. అందుబాటులో ఉన్న వాయిస్‌లు
          కంప్యూటర్ మరియు బ్రౌజర్‌పై ఆధారపడి ఉంటాయి. ఈ ఫీచర్‌కు AI API Key అవసరం లేదు.
        </footer>
      </div>
    </main>
  );
}
