import { useEffect, useRef, useState } from "react";
import type { MriCase } from "@/lib/cases";
import { Bot, CheckCircle2, Loader2 } from "lucide-react";

type Line = { agent: string; text: string };

function buildLog(c: MriCase): Line[] {
  const brain = c.region === "brain";
  return [
    { agent: "SUPERVISOR", text: `Received study ${c.patient.id} · Modality=MR · BodyPart=${c.dicom.bodyPart}` },
    { agent: "SUPERVISOR", text: "Validated modality MR ✓ (X-ray/CT rejected by policy). Building LangGraph plan…" },
    { agent: "SUPERVISOR", text: "plan = [segmentation_agent → report_writer_agent → decision_agent]" },
    { agent: "SEG-AGENT", text: `Loading MONAI ${brain ? "SwinUNETR (BraTS-2023)" : "UNet (SKI10 knee)"} weights…` },
    { agent: "SEG-AGENT", text: `Preprocess: N4 bias correction, resample 1mm iso, z-score norm · ${c.dicom.series}` },
    { agent: "SEG-AGENT", text: c.lesion ? `Lesion detected → ${c.lesion.label}, volume ${c.lesion.volume}` : "No lesion voxels above threshold." },
    { agent: "SEG-AGENT", text: `BiomedCLIP zero-shot confidence ${c.confidence}% · Grad-CAM generated` },
    { agent: "REPORT-AGENT", text: "Prompting LLaVA-Med + BioGPT with key slices & structured measurements…" },
    { agent: "REPORT-AGENT", text: `Drafted ${c.findings.length} findings · impression generated` },
    { agent: "DECISION-AGENT", text: "Querying PubMed / guideline vector store (FAISS, 48k chunks)…" },
    ...c.reasoning.slice(-2).map((t) => ({ agent: "DECISION-AGENT", text: t })),
    { agent: "DECISION-AGENT", text: `ICD-10 ${c.icd} · Triage=${c.triage}` },
    { agent: "SUPERVISOR", text: `All agents converged. Total inference ${c.metrics.inference}. Report ready ✓` },
  ];
}

const color: Record<string, string> = {
  SUPERVISOR: "text-accent",
  "SEG-AGENT": "text-success",
  "REPORT-AGENT": "text-warning",
  "DECISION-AGENT": "text-primary",
};

export function AgentTerminal({ c, onDone }: { c: MriCase; onDone: () => void }) {
  const log = buildLog(c);
  const [n, setN] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= log.length ? v : v + 1)), 380);
    return () => clearInterval(t);
  }, [c.id]);
  useEffect(() => {
    box.current?.scrollTo({ top: 1e6 });
    if (n === log.length) onDone();
  }, [n]);
  const done = n >= log.length;
  const agents = ["SUPERVISOR", "SEG-AGENT", "REPORT-AGENT", "DECISION-AGENT"];

  return (
    <div className="rounded-xl border border-border bg-scan">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Bot className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold">Agentic Pipeline · LangGraph</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          {done ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Loader2 className="h-3 w-3 animate-spin" />}
          {done ? "COMPLETE" : "RUNNING"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1 border-b border-border p-2">
        {agents.map((a) => {
          const seen = log.slice(0, n).some((l) => l.agent === a);
          const last = log.map((l) => l.agent).lastIndexOf(a);
          const fin = n > last;
          return (
            <div key={a} className={`rounded-md border px-2 py-1 text-center font-mono text-[9px] ${fin ? "border-success/50 text-success" : seen ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}>
              {a}
            </div>
          );
        })}
      </div>
      <div ref={box} className="h-56 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
        {log.slice(0, n).map((l, i) => (
          <div key={i}>
            <span className="text-muted-foreground">[{String(i * 0.38 + 0.12).slice(0, 4)}s]</span>{" "}
            <span className={color[l.agent]}>{l.agent}</span> <span className="text-foreground/90">{l.text}</span>
          </div>
        ))}
        {!done && <span className="animate-blink text-accent">▋</span>}
      </div>
    </div>
  );
}
