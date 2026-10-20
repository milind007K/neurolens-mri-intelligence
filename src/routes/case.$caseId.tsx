import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileCheck2, Loader2, Stethoscope } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { MriViewer } from "@/components/MriViewer";
import { AgentTerminal } from "@/components/AgentTerminal";
import { CASES, getCase, type MriCase } from "@/lib/cases";
import type { DicomTags } from "@/lib/dicom";
import { generateHospitalReport } from "@/lib/report-pdf";

export const Route = createFileRoute("/case/$caseId")({
  loader: ({ params }) => {
    if (params.caseId !== "upload" && !getCase(params.caseId)) throw notFound();
    return { caseId: params.caseId };
  },
  head: ({ params }) => {
    const c = getCase(params.caseId);
    const t = c ? `${c.label} — NeuroLens AI` : "Uploaded MRI — NeuroLens AI";
    return {
      meta: [
        { title: t },
        { name: "description", content: c ? `AI analysis: ${c.diagnosis}` : "AI analysis of an uploaded MRI study." },
        { property: "og:title", content: t },
        { property: "og:description", content: "MRI viewer, agentic analysis and hospital report." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CasePage,
});

function fromUpload(t: DicomTags): MriCase {
  const knee = /KNEE/i.test(t.bodyPart);
  const base = (knee ? CASES[2] : CASES[0])!;
  return {
    ...base,
    id: "upload",
    code: "U",
    label: `Uploaded ${t.bodyPart} MRI`,
    mriType: `MRI ${t.bodyPart.toUpperCase()}`,
    patient: { ...base.patient, name: t.name, age: parseInt(t.age) || 0, sex: t.sex === "F" ? "F" : "M", id: t.id },
    dicom: { ...base.dicom, studyDate: t.studyDate, sliceThickness: t.sliceThickness, tr: t.tr, te: t.te, field: t.field, manufacturer: t.manufacturer, series: t.series, bodyPart: t.bodyPart },
  };
}

const triageCls = { CRITICAL: "bg-destructive text-destructive-foreground", URGENT: "bg-warning text-accent-foreground", ROUTINE: "bg-success text-accent-foreground" };

function CasePage() {
  const { caseId } = Route.useLoaderData();
  const [c, setC] = useState<MriCase | null>(() => getCase(caseId) ?? null);
  const [done, setDone] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    setDone(false);
    if (caseId === "upload") {
      const raw = sessionStorage.getItem("neurolens-upload");
      setC(raw ? fromUpload(JSON.parse(raw)) : CASES[0]!);
    } else setC(getCase(caseId) ?? null);
  }, [caseId]);

  if (!c) return <div className="min-h-screen bg-background"><SiteNav /></div>;

  const download = async () => {
    setPdfBusy(true);
    try { await generateHospitalReport(c); } finally { setPdfBusy(false); }
  };

  const tags = [
    ["Patient", c.patient.name], ["Age/Sex", `${c.patient.age} / ${c.patient.sex}`], ["Patient ID", c.patient.id],
    ["Study date", c.dicom.studyDate], ["Modality", c.dicom.modality], ["Field", c.dicom.field],
    ["Slice thk.", c.dicom.sliceThickness], ["TR / TE", `${c.dicom.tr} / ${c.dicom.te}`], ["Series", c.dicom.series],
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Worklist</Link>
          <h1 className="text-xl font-bold">{c.label}</h1>
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${triageCls[c.triage]}`}>{c.triage}</span>
          <div className="ml-auto flex gap-1.5">
            {CASES.map((x) => (
              <Link key={x.id} to="/case/$caseId" params={{ caseId: x.id }} className={`rounded-md border px-2.5 py-1 font-mono text-xs ${x.id === c.id ? "border-primary bg-primary/20" : "border-border text-muted-foreground hover:text-foreground"}`}>Case {x.code}</Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border font-mono text-[11px] sm:grid-cols-5 lg:grid-cols-9">
          {tags.map(([k, v]) => (
            <div key={k} className="bg-card px-3 py-2"><div className="text-muted-foreground">{k}</div><div className="truncate text-foreground">{v}</div></div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7"><MriViewer key={c.id} c={c} /></div>
          <div className="space-y-4 lg:col-span-5">
            <AgentTerminal key={c.id} c={c} onDone={() => setDone(true)} />
            {done ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">AI Diagnosis</div>
                      <div className="mt-1 font-semibold">{c.diagnosis}</div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">ICD-10 {c.icd} · Dice {c.metrics.dice} · {c.metrics.inference}</div>
                    </div>
                    <div className="text-right"><div className="font-mono text-3xl font-bold text-accent">{c.confidence}%</div><div className="text-[10px] text-muted-foreground">confidence</div></div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
                    {c.findings.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />{f}</li>)}
                  </ul>
                  <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm font-semibold">IMPRESSION: {c.impression}</p>
                </div>
                <div className="rounded-xl border border-primary/50 bg-primary/10 p-5">
                  <div className="flex items-center gap-2 font-semibold"><Stethoscope className="h-4 w-4 text-accent" />Clinical Decision Support</div>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{c.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol>
                  <div className="mt-3 text-sm text-muted-foreground"><span className="text-foreground">Prognosis:</span> {c.prognosis}</div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{c.followUp.map((f) => <span key={f} className="rounded-md border border-border bg-card px-2 py-1 font-mono text-[10px]">{f}</span>)}</div>
                </div>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Agents are analysing the study…</div>
            )}
          </div>
        </div>

        <button
          onClick={download}
          disabled={!done || pdfBusy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-primary py-5 text-lg font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pdfBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : done ? <Download className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
          {done ? "Download Official Hospital Report PDF" : "Report will be available when agents finish"}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Academic demonstration. AI-assisted output — final correlation with clinical findings advised.</p>
      </main>
    </div>
  );
}
