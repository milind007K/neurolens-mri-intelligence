import { useEffect, useRef, useState } from "react";
import type { MriCase } from "@/lib/cases";
import { render3D, renderSlice, type RenderOpts, type View } from "@/lib/mri-render";
import { Layers, ScanSearch, Flame, ZoomIn, SunMedium } from "lucide-react";

const SLICES = 32;
const PRESETS = [
  { name: "Default", wl: 0.5, ww: 0.95 },
  { name: "Brain", wl: 0.48, ww: 0.6 },
  { name: "Soft tissue", wl: 0.42, ww: 0.75 },
  { name: "Bone", wl: 0.6, ww: 0.5 },
];

function initialSlice(c: MriCase, view: View) {
  if (!c.lesion) return Math.round(SLICES * 0.55);
  const [x, y, z] = c.lesion.center;
  const s = view === "axial" ? z : view === "sagittal" ? x : y;
  return Math.round(((s + 1) / 2) * (SLICES - 1));
}

function Pane({ c, view, opts }: { c: MriCase; view: View; opts: RenderOpts }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [slice, setSlice] = useState(() => initialSlice(c, view));
  useEffect(() => setSlice(initialSlice(c, view)), [c, view]);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) renderSlice(ctx, 224, c, view, (slice / (SLICES - 1)) * 2 - 1, opts);
  }, [c, view, slice, opts]);
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-scan">
      <canvas
        ref={ref}
        width={224}
        height={224}
        className="aspect-square w-full cursor-ns-resize [image-rendering:auto]"
        onWheel={(e) => setSlice((s) => Math.max(0, Math.min(SLICES - 1, s + (e.deltaY > 0 ? 1 : -1))))}
      />
      <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between font-mono text-[10px] text-accent">
        <span className="uppercase">{view}</span>
        <span>IM {slice + 1}/{SLICES}</span>
      </div>
      <div className="pointer-events-none absolute bottom-9 left-2 font-mono text-[9px] leading-tight text-muted-foreground">
        W {Math.round(opts.ww * 1000)} L {Math.round(opts.wl * 1000)}
        <br />
        {c.dicom.sliceThickness} · TR {c.dicom.tr}
      </div>
      <input
        type="range"
        min={0}
        max={SLICES - 1}
        value={slice}
        onChange={(e) => setSlice(+e.target.value)}
        className="absolute inset-x-2 bottom-2 accent-primary"
        aria-label={`${view} slice`}
      />
    </div>
  );
}

function Pane3D({ c }: { c: MriCase }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let a = 0, raf = 0, last = 0;
    const loop = (t: number) => {
      if (t - last > 90) {
        last = t;
        a += 0.08;
        const ctx = ref.current?.getContext("2d");
        if (ctx) render3D(ctx, 112, c, a);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [c]);
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-scan">
      <canvas ref={ref} width={112} height={112} className="aspect-square w-full" />
      <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between font-mono text-[10px] text-accent">
        <span>3D VOLUME RENDER</span>
        <span>MIP</span>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 font-mono text-[10px] text-muted-foreground">
        {c.lesion ? <span className="text-destructive">● lesion {c.lesion.volume}</span> : "no lesion segmented"}
      </div>
    </div>
  );
}

export function MriViewer({ c }: { c: MriCase }) {
  const [opts, setOpts] = useState<RenderOpts>({ wl: 0.5, ww: 0.95, zoom: 1, heat: !!c.lesion, bbox: !!c.lesion });
  const set = (p: Partial<RenderOpts>) => setOpts((o) => ({ ...o, ...p }));
  const btn = (on: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${on ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-auto flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-accent" /> DICOM MR Viewer</span>
        <button className={btn(opts.bbox)} onClick={() => set({ bbox: !opts.bbox })}><ScanSearch className="h-3.5 w-3.5" />Lesion box</button>
        <button className={btn(opts.heat)} onClick={() => set({ heat: !opts.heat })}><Flame className="h-3.5 w-3.5" />Grad-CAM</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Pane c={c} view="axial" opts={opts} />
        <Pane c={c} view="sagittal" opts={opts} />
        <Pane c={c} view="coronal" opts={opts} />
        <Pane3D c={c} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 flex items-center gap-1"><SunMedium className="h-3 w-3" />Window width</span>
          <input type="range" min={0.2} max={1.4} step={0.01} value={opts.ww} onChange={(e) => set({ ww: +e.target.value })} className="w-full accent-primary" />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 block">Window level</span>
          <input type="range" min={0.1} max={0.9} step={0.01} value={opts.wl} onChange={(e) => set({ wl: +e.target.value })} className="w-full accent-primary" />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 flex items-center gap-1"><ZoomIn className="h-3 w-3" />Zoom {opts.zoom.toFixed(1)}×</span>
          <input type="range" min={1} max={2.5} step={0.1} value={opts.zoom} onChange={(e) => set({ zoom: +e.target.value })} className="w-full accent-primary" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.name} className={btn(opts.wl === p.wl && opts.ww === p.ww)} onClick={() => set({ wl: p.wl, ww: p.ww })}>{p.name}</button>
        ))}
        <span className="ml-auto self-center font-mono text-[10px] text-muted-foreground">Scroll on a view to change slice</span>
      </div>
    </div>
  );
}
