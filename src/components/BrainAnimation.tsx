import { useEffect, useRef } from "react";
import { CASES } from "@/lib/cases";
import { renderSlice } from "@/lib/mri-render";

export function BrainAnimation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = CASES[1];
    let s = -0.7, dir = 1, raf = 0, last = 0;
    const loop = (t: number) => {
      if (t - last > 70) {
        last = t;
        s += 0.025 * dir;
        if (s > 0.7 || s < -0.7) dir *= -1;
        const ctx = ref.current?.getContext("2d");
        if (ctx) renderSlice(ctx, 200, c, "axial", s, { wl: 0.5, ww: 0.95, zoom: 1.05, heat: true, bbox: false });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-scan shadow-glow">
      <canvas ref={ref} width={200} height={200} className="h-full w-full" />
      <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
      <div className="absolute left-4 top-4 font-mono text-[11px] text-accent">AX T1+C · 3.0T<br /><span className="text-muted-foreground">SEG: SwinUNETR</span></div>
      <div className="absolute bottom-4 right-4 rounded-md border border-destructive/60 bg-background/70 px-2 py-1 font-mono text-[11px] text-destructive">GLIOMA · 92%</div>
    </div>
  );
}
