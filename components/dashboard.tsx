"use client";

import { useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bot, CheckCircle2, ChevronRight,
  CirclePlay, Clock3, CloudUpload, Command, Film, GitBranch, LayoutDashboard,
  ListChecks, Plus, Radio, RefreshCw, Settings2, Sparkles, Workflow, Zap
} from "lucide-react";

type Run = { id: string; status: string; workflow: string; time: string; detail: string };

const initialRuns: Run[] = [
  { id: "run_01", status: "SUCCESS", workflow: "Inbound lead qualifier", time: "2 min ago", detail: "Lead scored 86/100" },
  { id: "run_02", status: "PENDING", workflow: "Podcast to Shorts", time: "5 min ago", detail: "Waiting for media worker" },
  { id: "run_03", status: "FAILED", workflow: "Slack sales alert", time: "12 min ago", detail: "Webhook timed out" }
];

export default function Dashboard() {
  const [tab, setTab] = useState<"overview" | "workflows" | "studio">("overview");
  const [runs, setRuns] = useState(initialRuns);
  const [source, setSource] = useState("");
  const [jobMessage, setJobMessage] = useState("");
  const [busy, setBusy] = useState(false);

 
async function createVideoJob() {
  setBusy(true);
  setJobMessage("Creating video job...");

  try {
    const res = await fetch("/api/video/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sourceUrl: source.trim() || undefined
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || `Request failed: ${res.status}`
      );
    }

    if (!data.job?.id) {
      throw new Error("API did not return a Job ID.");
    }

    setJobMessage(
      `Job ${data.job.id.slice(0, 8)} queued. ${data.job.note || ""}`
    );

  } catch (error) {
    console.error("Video Job Error:", error);

    setJobMessage(
      error instanceof Error
        ? error.message
        : "Unexpected error occurred."
    );

  } finally {
    setBusy(false);
  }
}


  async function runDemoWorkflow() {
    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: "demo-lead-qualifier",
          input: { email: "alex@example.com", company: "Northstar Labs", source: "website form" },
          actions: [{ type: "AI_LEAD_QUALIFIER" }]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution failed");
      setRuns(prev => [{
        id: data.runId, status: data.status, workflow: "Inbound lead qualifier",
        time: "just now", detail: "Demo execution completed"
      }, ...prev]);
    } catch (e) {
      setRuns(prev => [{ id: crypto.randomUUID(), status: "FAILED", workflow: "Inbound lead qualifier", time: "just now", detail: e instanceof Error ? e.message : "Failed" }, ...prev]);
    }
  }

  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "workflows" as const, label: "Workflow Hub", icon: GitBranch },
    { id: "studio" as const, label: "Video Studio", icon: Film }
  ];
  return <div className="min-h-screen bg-ink text-slate-100">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-[#0d101a] p-5 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 shadow-glow"><Command size={21}/></div>
        <div><div className="font-semibold tracking-tight">AutoClip <span className="text-violet-300">&</span> Flow</div><div className="mt-0.5 text-xs text-slate-500">AI WORKSPACE</div></div>
      </div>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</div>
      <nav className="space-y-1">{nav.map(item => {
        const Icon = item.icon; const active = tab === item.id;
        return <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={18}/>{item.label}{active && <ChevronRight className="ml-auto" size={15}/>}</button>;
      })}</nav>
      <div className="mt-10 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Sparkles size={16} className="text-violet-300"/> Pro workspace</div>
        <p className="text-xs leading-5 text-slate-400">Your AI toolkit is ready to connect to real providers.</p>
        <div className="mt-4 h-1.5 rounded-full bg-white/10"><div className="h-1.5 w-2/5 rounded-full bg-violet-400"/></div>
        <div className="mt-2 text-[11px] text-slate-500">Demo usage · 2 of 5 jobs</div>
      </div>
      <button className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5"><Settings2 size={17}/> Settings <span className="ml-auto text-xs">⌘ ,</span></button>
    </aside>

    <main className="lg:pl-64">
      <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-line bg-ink/85 px-5 backdrop-blur-xl md:px-9">
        <div><div className="text-xs text-slate-500">Workspace <span className="mx-2">/</span> <span className="text-slate-300">{nav.find(n => n.id === tab)?.label}</span></div><div className="mt-1 text-sm font-semibold">Good afternoon, Creator <span className="ml-1">✦</span></div></div>
        <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-slate-500 sm:flex"><span>⌘</span><span>K</span><span className="ml-2">Quick search</span></div><div className="grid h-9 w-9 place-items-center rounded-full border border-violet-300/30 bg-violet-400/15 text-sm font-semibold text-violet-200">C</div></div>
      </header>
      <div className="mx-auto max-w-[1500px] p-5 md:p-9">
        {tab === "overview" && <Overview runs={runs} onRun={runDemoWorkflow} onStudio={() => setTab("studio")} onWorkflows={() => setTab("workflows")}/>}
        {tab === "workflows" && <WorkflowHub onRun={runDemoWorkflow} runs={runs}/>}
        {tab === "studio" && <VideoStudio source={source} setSource={setSource} onCreate={createVideoJob} busy={busy} message={jobMessage}/>}
      </div>
    </main>
  </div>;
}

function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-violet-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-400"/>{eyebrow}</div><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{subtitle}</p></div>{action}</div>;
}
function Button({ children, onClick, secondary = false, disabled = false }: { children: React.ReactNode; onClick?: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${secondary ? "border border-line bg-white/[.02] text-slate-300 hover:bg-white/[.06]" : "bg-violet-500 text-white shadow-lg shadow-violet-900/20 hover:bg-violet-400"}`}>{children}</button>;
}
function Overview({ runs, onRun, onStudio, onWorkflows }: { runs: Run[]; onRun: () => void; onStudio: () => void; onWorkflows: () => void }) {
  return <>
    <PageTitle eyebrow="Command center" title="Your AI, in motion." subtitle="Automate repetitive work and turn long-form content into scroll-stopping short videos." action={<Button onClick={onRun}><Zap size={16}/> Run test workflow</Button>}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Workflow runs" value="1,284" change="+12.8%" icon={Workflow} up/>
      <Stat label="Clips generated" value="346" change="+8.2%" icon={Film} up/>
      <Stat label="Hours saved" value="62.4" change="+18.4%" icon={Clock3} up/>
      <Stat label="Success rate" value="98.2%" change="Last 30 days" icon={Activity}/>
    </div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line p-5"><div><h2 className="font-semibold">Quick launch</h2><p className="mt-1 text-xs text-slate-500">Pick up where your creativity left off</p></div><Sparkles size={18} className="text-violet-300"/></div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <button onClick={onWorkflows} className="group rounded-xl border border-line bg-white/[.02] p-5 text-left transition hover:border-violet-400/40 hover:bg-violet-500/[.06]"><div className="mb-5 flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><GitBranch size={20}/></div><ArrowUpRight size={17} className="text-slate-600 group-hover:text-violet-300"/></div><div className="font-medium">Build an automation</div><p className="mt-2 text-xs leading-5 text-slate-400">Connect triggers, AI decisions, and business tools in a repeatable pipeline.</p><div className="mt-5 text-xs font-medium text-violet-300">Open workflow hub <ChevronRight className="ml-1 inline" size={13}/></div></button>
          <button onClick={onStudio} className="group rounded-xl border border-line bg-white/[.02] p-5 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/[.04]"><div className="mb-5 flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Film size={20}/></div><ArrowUpRight size={17} className="text-slate-600 group-hover:text-cyan-300"/></div><div className="font-medium">Repurpose a video</div><p className="mt-2 text-xs leading-5 text-slate-400">Find highlights, style captions, and prepare vertical social clips.</p><div className="mt-5 text-xs font-medium text-cyan-300">Open video studio <ChevronRight className="ml-1 inline" size={13}/></div></button>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Automation activity</h2><p className="mt-1 text-xs text-slate-500">Latest executions across your workspace</p></div><Radio size={18} className="text-emerald-300"/></div>
        <div className="mt-5 space-y-4">{runs.slice(0, 4).map(run => <RunRow key={run.id} run={run}/>)}</div>
        <button onClick={onWorkflows} className="mt-5 w-full rounded-xl border border-line py-2.5 text-xs text-slate-400 hover:bg-white/[.03]">View all executions <ArrowDownRight className="ml-1 inline" size={13}/></button>
      </section>
    </div>
    <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Recent video projects</h2><p className="mt-1 text-xs text-slate-500">A snapshot of your content pipeline</p></div><Button secondary onClick={onStudio}>Open studio <ChevronRight size={15}/></Button></div>
      <div className="grid gap-3 md:grid-cols-3"><VideoCard title="Founder interview" meta="3 clips · 12:48 source" status="Ready"/><VideoCard title="Product walkthrough" meta="5 clips · 08:22 source" status="Rendering"/><VideoCard title="Weekly podcast #18" meta="4 clips · 42:16 source" status="Queued"/></div>
    </section>
  </>;
}
function Stat({ label, value, change, icon: Icon, up = false }: { label: string; value: string; change: string; icon: React.ElementType; up?: boolean }) {
  return <div className="rounded-2xl border border-line bg-panel p-5"><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{label}</span><div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.04] text-slate-300"><Icon size={16}/></div></div><div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div><div className={`mt-2 text-[11px] ${up ? "text-emerald-300" : "text-slate-500"}`}>{up && <ArrowUpRight className="mr-1 inline" size={12} />}{change}</div></div>;
}
function RunRow({ run }: { run: Run }) {
  const tone = run.status === "SUCCESS" ? "text-emerald-300 bg-emerald-400/10" : run.status === "FAILED" ? "text-rose-300 bg-rose-400/10" : "text-amber-200 bg-amber-400/10";
  const Icon = run.status === "SUCCESS" ? CheckCircle2 : run.status === "FAILED" ? Activity : Clock3;
  return <div className="flex items-start gap-3"><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={15}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="truncate font-medium">{run.workflow}</span><span className="text-[10px] text-slate-600">{run.time}</span></div><div className="mt-1 truncate text-xs text-slate-500">{run.detail}</div></div></div>;
}
function VideoCard({ title, meta, status }: { title: string; meta: string; status: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[.02] p-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-400/10 text-violet-200"><CirclePlay size={20}/></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{title}</div><div className="mt-1 text-[11px] text-slate-500">{meta}</div></div><span className={`rounded-full px-2 py-1 text-[10px] ${status === "Ready" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>{status}</span></div>;
}
function WorkflowHub({ onRun, runs }: { onRun: () => void; runs: Run[] }) {
  return <><PageTitle eyebrow="Automation engine" title="Workflow Hub" subtitle="Design reliable pipelines from business events to AI-powered actions." action={<Button onClick={onRun}><Zap size={16}/> Test workflow</Button>}/>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-line bg-panel p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Lead qualification pipeline</h2><p className="mt-1 text-xs text-slate-500">Active · Updated just now</p></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">● Enabled</span></div>
      <div className="space-y-2">
        <FlowNode icon={Radio} label="Trigger" title="New form submission" detail="Webhook · POST /api/webhooks/:workflowId" tone="cyan"/>
        <div className="ml-7 h-5 border-l border-dashed border-slate-700"/>
        <FlowNode icon={Bot} label="AI action" title="Qualify lead with AI" detail="Score, tier, intent, and next best action" tone="violet"/>
        <div className="ml-7 h-5 border-l border-dashed border-slate-700"/>
        <FlowNode icon={ListChecks} label="Action" title="Send Slack sales alert" detail="Notify #sales when score ≥ 70" tone="green"/>
      </div><div className="mt-5 flex flex-wrap gap-2"><Button onClick={onRun}><Zap size={15}/> Run test</Button><Button secondary><Plus size={15}/> Add step</Button></div></section>
      <section className="rounded-2xl border border-line bg-panel p-5"><h2 className="font-semibold">Execution logs</h2><p className="mt-1 text-xs text-slate-500">Status and retry visibility</p><div className="mt-5 space-y-4">{runs.map(run => <RunRow key={run.id} run={run}/>)}</div><button onClick={onRun} className="mt-5 flex items-center gap-2 text-xs text-violet-300"><RefreshCw size={13}/> Retry / execute demo</button></section>
    </div>
    <div className="mt-5 rounded-2xl border border-dashed border-line p-5"><div className="flex gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.04]"><Plus size={18}/></div><div><div className="font-medium">Create a new workflow</div><p className="mt-1 text-sm text-slate-500">Connect a webhook or form trigger to an AI action. Persist workflows after configuring authentication and database-backed CRUD.</p></div></div></div>
  </>;
}
function FlowNode({ icon: Icon, label, title, detail, tone }: { icon: React.ElementType; label: string; title: string; detail: string; tone: string }) {
  const colors: Record<string, string> = { cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20", violet: "text-violet-300 bg-violet-400/10 border-violet-400/20", green: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" };
  return <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[.02] p-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${colors[tone]}`}><Icon size={18}/></div><div className="min-w-0"><div className="text-[10px] uppercase tracking-[.16em] text-slate-500">{label}</div><div className="mt-1 text-sm font-medium">{title}</div><div className="mt-1 truncate text-xs text-slate-500">{detail}</div></div><ChevronRight className="ml-auto shrink-0 text-slate-600" size={16}/></div>;
}
function VideoStudio({ source, setSource, onCreate, busy, message }: { source: string; setSource: (s: string) => void; onCreate: () => void; busy: boolean; message: string }) {
  return <><PageTitle eyebrow="Content intelligence" title="Video Studio" subtitle="Turn long-form recordings into short, caption-ready vertical clips." action={<div className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Processing queue ready</div>}/>
    <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-line bg-panel p-5"><div className="mb-4 flex items-center gap-2"><CloudUpload size={18} className="text-violet-300"/><h2 className="font-semibold">Import a video</h2></div>
          <div className="rounded-xl border border-dashed border-slate-700 bg-white/[.015] p-7 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-400/10 text-violet-300"><CloudUpload size={22}/></div><div className="mt-4 text-sm font-medium">Paste a public video URL</div><p className="mt-1 text-xs leading-5 text-slate-500">The queue API accepts a URL. Real ingestion must run in a worker with source validation and storage.</p>
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="https://example.com/video.mp4" className="mt-5 w-full rounded-xl border border-line bg-ink px-3 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400/50"/>
          <Button onClick={onCreate} disabled={busy} ><Sparkles size={15}/>{busy ? "Queueing..." : "Generate clips"}</Button>
          {message && <p className="mt-4 break-words text-left text-xs leading-5 text-violet-200">{message}</p>}
          </div><p className="mt-3 text-[11px] leading-5 text-slate-600">File upload UI is intentionally not wired to permanent storage yet. Use signed uploads to S3/R2 in production; avoid sending large media through a serverless API.</p>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-5"><h2 className="font-semibold">Processing queue</h2><p className="mt-1 text-xs text-slate-500">Pipeline stages and current state</p><div className="mt-5 space-y-4">{["Audio extraction","Speech transcription","AI highlight selection","Vertical video rendering"].map((s,i) => <div key={s} className="flex items-center gap-3"><div className={`grid h-8 w-8 place-items-center rounded-lg ${i===0 ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[.04] text-slate-500"}`}>{i===0 ? <CheckCircle2 size={15}/> : <Clock3 size={15}/>}</div><div className="flex-1 text-sm">{s}</div><span className={`text-[10px] ${i===0 ? "text-emerald-300" : "text-slate-500"}`}>{i===0 ? "READY" : "WAITING"}</span></div>)}</div></section>
      </div>
      <section className="rounded-2xl border border-line bg-panel p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Clip preview studio</h2><p className="mt-1 text-xs text-slate-500">9:16 composition · Caption style preview</p></div><span className="rounded-lg border border-line px-2 py-1 text-[10px] text-slate-400">1080 × 1920</span></div>
        <div className="mx-auto mt-6 max-w-[280px] rounded-[28px] border border-slate-700 bg-[#07080e] p-2 shadow-2xl"><div className="relative flex aspect-[9/16] flex-col justify-between overflow-hidden rounded-[22px] bg-[radial-gradient(ellipse_at_60%_25%,rgba(34,211,238,.35),transparent_35%),radial-gradient(ellipse_at_30%_60%,rgba(139,92,246,.5),transparent_45%),linear-gradient(145deg,#1b1b31,#080a12_65%)] p-5">
          <div className="flex items-center justify-between"><span className="rounded-full bg-black/30 px-2.5 py-1 text-[9px] font-bold tracking-widest text-white">YOUR BRAND</span><span className="text-[10px] text-white/70">00:32</span></div>
          <div><div className="mb-3 inline-block -rotate-2 bg-cyan-300 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">The big insight</div><div className="text-2xl font-black uppercase leading-[1.08] tracking-tight text-white drop-shadow-lg">Stop doing<br/><span className="text-cyan-300">busy work.</span></div><div className="mt-4 rounded-md bg-black/55 px-2 py-2 text-center text-[11px] font-bold leading-4 text-white">Automate the process. Focus on what matters.</div></div>
          <div className="flex items-center justify-between text-[9px] font-medium text-white/70"><span>@yourchannel</span><span>▶ 00:32 / 00:45</span></div>
        </div></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Caption theme<select className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-200"><option>Neon highlight</option><option>Minimal white</option><option>Creator bold</option></select></label><label className="text-xs text-slate-400">Hook template<select className="mt-2 w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-slate-200"><option>Bold statement</option><option>Curiosity gap</option><option>3 quick tips</option></select></label></div>
        <Button secondary onClick={() => alert("Export becomes available after a real worker renders an MP4 asset.")}><Film size={15}/> Export MP4 <span className="text-[10px] text-slate-500">(worker required)</span></Button>
      </section>
    </div>
  </>;
}
