import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Clock, Gauge, ScanLine, Upload, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { CASES } from "@/lib/cases";
import { parseMriDicom } from "@/lib/dicom";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — NeuroLens AI" },
      { name: "description", content: "MRI worklist, model performance and demo cases for NeuroLens AI." },
      { property: "og:title", content: "NeuroLens AI Dashboard" },
      { property: "og:description", content: "MRI worklist and AI performance metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const triageCls = { CRITICAL: "bg-destructive text-destructive-foreground", URGENT: "bg-warning text-accent-foreground", ROUTINE: "bg-success text-accent-foreground" };

function Dashboard() {
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (f?: File) => {
    if (!f) return;
    setErr(null); setBusy(true);
    try {
      const tags = await parseMriDicom(f);
      sessionStorage.setItem("neurolens-upload", JSON.stringify(tags));
      nav({ to: "/case/$caseId", params: { caseId: "upload" } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read this file.");
    } finally { setBusy(false); }
  };

  const stats = [
    { icon: ScanLine, l: "Total MRIs analysed", v: "1,284" },
    { icon: Clock, l: "Avg report time", v: "6.2 s" },
    { icon: Gauge, l: "Diagnostic accuracy", v: "96.1%" },
    { icon: Activity, l: "Critical flagged (30d)", v: "37" },
  ];
  return (
    <div className="min-h-screen bg-hero">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">MRI Intelligence Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Brain · Spine · Knee MRI only. Select a pre-loaded case or upload a .dcm MR file.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card p-5">
              <s.icon className="h-5 w-5 text-accent" />
              <div className="mt-3 font-mono text-3xl font-semibold">{s.v}</div>
              <div className="text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-lg font-semibold">Demo worklist</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {CASES.map((c) => (
            <Link key={c.id} to="/case/$caseId" params={{ caseId: c.id }} className="group rounded-xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-glow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">CASE {c.code} · {c.patient.id}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${triageCls[c.triage]}`}>{c.triage}</span>
              </div>
              <h3 className="mt-3 font-semibold group-hover:text-accent">{c.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.patient.name} · {c.patient.age}{c.patient.sex} · {c.mriType}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-primary" style={{ width: `${c.confidence}%` }} /></div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">AI confidence {c.confidence}%</div>
            </Link>
          ))}
        </div>

        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center transition hover:border-primary"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
          <Upload className="h-6 w-6 text-accent" />
          <span className="font-semibold">{busy ? "Reading DICOM…" : "Upload your own MRI (.dcm)"}</span>
          <span className="text-xs text-muted-foreground">Tags are parsed in your browser. Only Modality = MR is accepted.</span>
          <input type="file" accept=".dcm,application/dicom" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {err && <p className="mt-3 flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{err}</p>}
      </main>
    </div>
  );
}
