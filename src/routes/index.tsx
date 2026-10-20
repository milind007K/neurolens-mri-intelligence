import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, FileText, Layers, ShieldCheck, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { BrainAnimation } from "@/components/BrainAnimation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroLens AI — MRI Report Generation & Clinical Decision Support" },
      { name: "description", content: "AI-powered MRI report generation and agentic clinical decision support for Brain, Spine and Knee MRI." },
      { property: "og:title", content: "NeuroLens AI — MRI Intelligence Platform" },
      { property: "og:description", content: "Generative + Agentic AI for hospital-grade MRI reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Layers, t: "4-view DICOM MR viewer", d: "Axial, sagittal, coronal & 3D with windowing, zoom, Grad-CAM and lesion boxes." },
  { icon: Bot, t: "Multi-agent LangGraph", d: "Supervisor orchestrates Segmentation, Report-Writer and Decision agents." },
  { icon: FileText, t: "Hospital-grade PDF", d: "Signed, QR-verified radiology report with structured findings & impression." },
  { icon: ShieldCheck, t: "MRI-only safety gate", d: "Non-MR modalities (X-ray, CT) are rejected at ingestion." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <SiteNav />
      <section className="grid-bg">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent">
              <Workflow className="h-3 w-3" /> RCOEM Nagpur · CSE (AI/ML) Major Project 2026-27
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
              AI-Powered MRI Report Generation &amp; Clinical Decision Support
              <span className="block bg-gradient-primary bg-clip-text text-transparent">using Generative &amp; Agentic AI</span>
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground">
              NeuroLens AI reads Brain, Spine and Knee MRI, segments lesions with MONAI, writes radiology reports with LLaVA-Med and
              recommends next steps from PubMed-grounded guidelines — in about 6 seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-5 py-3 font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/case/$caseId" params={{ caseId: "brain-glioma" }} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 font-semibold transition hover:border-primary">
                Run glioma demo
              </Link>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 font-mono">
              {[["96.1%", "accuracy"], ["6.2 s", "avg report"], ["0.91", "Dice"]].map(([v, l]) => (
                <div key={l}><div className="text-2xl font-semibold text-foreground">{v}</div><div className="text-[11px] uppercase text-muted-foreground">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md"><BrainAnimation /></div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((f) => (
            <div key={f.t} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-xl border border-border bg-card p-6 font-mono text-xs text-muted-foreground">
          <div className="mb-3 text-sm font-semibold text-foreground">Pipeline</div>
          DICOM (MR only) → Preprocess (N4, resample) → <span className="text-success">MONAI SwinUNETR</span> + <span className="text-success">BiomedCLIP</span> →
          <span className="text-warning"> LLaVA-Med / BioGPT report</span> → <span className="text-primary">Decision Agent (PubMed RAG)</span> → Signed PDF report
        </div>
      </section>
    </div>
  );
}
