// Procedural MRI volume synthesis so demo cases work without large DICOM files.
import type { MriCase, Region } from "./cases";

export type View = "axial" | "sagittal" | "coronal";

const fract = (v: number) => v - Math.floor(v);
const noise = (x: number, y: number, z: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);

type Lesion = MriCase["lesion"];

function brain(x: number, y: number, z: number, L: Lesion): number {
  const r = Math.sqrt((x / 0.78) ** 2 + (y / 0.92) ** 2 + (z / 0.82) ** 2);
  const n = noise(x, y, z) * 0.06;
  if (r > 1) return 0.02 + n * 0.4;
  if (r > 0.94) return 0.78 + n;
  if (r > 0.88) return 0.07 + n * 0.5;
  if (r > 0.85) return 0.2 + n;
  let v = 0.64;
  const ang = Math.atan2(y, x);
  if (r > 0.68) {
    const g = Math.sin(ang * 24 + z * 16 + r * 34);
    v = g > 0.72 ? 0.22 : 0.47;
  } else if (r > 0.6) v = 0.55;
  if (Math.abs(x) < 0.014 && r > 0.25) v = 0.22;
  const vent = ((Math.abs(x) - 0.12) / 0.075) ** 2 + ((y - 0.03) / 0.3) ** 2 + ((z - 0.05) / 0.13) ** 2;
  if (vent < 1) v = 0.15;
  if (Math.sqrt(x * x + (y - 0.1) ** 2 + (z + 0.05) ** 2) < 0.12) v = 0.42; // thalami
  if (L) {
    const [cx, cy, cz] = L.center;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / L.r;
    if (d < 0.55) v = 0.3 + noise(x * 3, y * 3, z) * 0.18;
    else if (d < 0.82) v = 0.92 + n;
    else if (d < 1.7) v *= 0.8;
  }
  return v + n;
}

type V3 = [number, number, number];
function distSeg(p: V3, a: V3, b: V3) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2];
  const px = p[0] - a[0], py = p[1] - a[1], pz = p[2] - a[2];
  const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  const d = Math.hypot(px - bx * t, py - by * t, pz - bz * t);
  return { d, t };
}

function knee(x: number, y: number, z: number, L: Lesion): number {
  const n = noise(x, y, z) * 0.06;
  const leg = (x / 0.72) ** 2 + (y / 0.64) ** 2;
  if (leg > 1) return 0.02 + n * 0.4;
  if (leg > 0.8) return 0.82 + n;
  const fem = z > 0.35 ? (x / 0.27) ** 2 + (y / 0.25) ** 2 : (x / 0.5) ** 2 + (y / 0.4) ** 2 + ((z - 0.35) / 0.3) ** 2;
  const tib = z < -0.4 ? (x / 0.3) ** 2 + ((y - 0.03) / 0.27) ** 2 : (x / 0.5) ** 2 + ((y - 0.03) / 0.38) ** 2 + ((z + 0.4) / 0.34) ** 2;
  const pat = ((x) / 0.2) ** 2 + ((y + 0.5) / 0.08) ** 2 + ((z - 0.15) / 0.16) ** 2;
  const notch = Math.abs(x) < 0.07 && z < 0.22 && z > 0.04 && y > -0.12;
  const bone = (m: number) => (m > 0.85 ? 0.06 : 0.76 + n);
  if (fem < 1 && !notch && z > 0.05) {
    let v = bone(fem);
    if (L && x > 0.15 && z < 0.2 && fem < 0.85) v = 0.95;
    return v;
  }
  if (tib < 1 && z < -0.05) {
    let v = bone(tib);
    if (L && x > 0.1 && y > 0.1 && z > -0.15 && tib < 0.85) v = 0.93;
    return v;
  }
  if (pat < 1) return bone(pat);
  if ((fem < 1.18 && z > 0.02 && z < 0.25) || (tib < 1.18 && z < -0.02 && z > -0.2)) return 0.58 + n;
  if (Math.abs(z) < 0.055 && Math.abs(x) > 0.24 && Math.abs(x) < 0.48 && Math.abs(y) < 0.32) {
    if (L && x < -0.24 && y > 0.05 && Math.abs(z - 0.005) < 0.012) return 0.8;
    return 0.06 + n * 0.5;
  }
  const acl = distSeg([x, y, z], [0.04, 0.16, 0.22], [-0.02, -0.15, -0.14]);
  if (acl.d < 0.035) {
    if (L && acl.t > 0.35 && acl.t < 0.68) return 0.72 + noise(x * 5, y, z) * 0.2;
    return 0.1 + n;
  }
  const pcl = distSeg([x, y, z], [-0.04, 0.0, 0.22], [0.0, 0.3, -0.2]);
  if (pcl.d < 0.04) return 0.08 + n;
  if (L && y < -0.28 && z > 0.05 && z < 0.55 && pat > 1) return 0.9 + n;
  return 0.38 + Math.sin(x * 45 + y * 10) * 0.03 + n;
}

export function sample(region: Region, L: Lesion, x: number, y: number, z: number) {
  return region === "brain" ? brain(x, y, z, L) : knee(x, y, z, L);
}

function toVol(view: View, u: number, v: number, s: number): [number, number, number] {
  if (view === "axial") return [u, v, s];
  if (view === "sagittal") return [s, u, -v];
  return [u, s, -v];
}

function jet(t: number): [number, number, number] {
  const r = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 3)));
  const g = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 2)));
  const b = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 1)));
  return [r * 255, g * 255, b * 255];
}

export interface RenderOpts {
  wl: number; // 0..1
  ww: number; // 0..1
  zoom: number;
  heat: boolean;
  bbox: boolean;
}

export function renderSlice(ctx: CanvasRenderingContext2D, size: number, c: MriCase, view: View, s: number, o: RenderOpts) {
  const img = ctx.createImageData(size, size);
  const lo = o.wl - o.ww / 2;
  const L = c.lesion;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = ((i / size) * 2 - 1) / o.zoom;
      const v = ((j / size) * 2 - 1) / o.zoom;
      const [x, y, z] = toVol(view, u, v, s);
      const raw = sample(c.region, L, x, y, z);
      let g = Math.max(0, Math.min(1, (raw - lo) / o.ww)) * 255;
      let R = g, G = g, B = g;
      if (o.heat && L) {
        const d2 = (x - L.center[0]) ** 2 + (y - L.center[1]) ** 2 + (z - L.center[2]) ** 2;
        const h = Math.exp(-d2 / (2 * (L.r * 0.95) ** 2));
        if (h > 0.18) {
          const [hr, hg, hb] = jet(h);
          const a = h * 0.55;
          R = R * (1 - a) + hr * a; G = G * (1 - a) + hg * a; B = B * (1 - a) + hb * a;
        }
      }
      const k = (j * size + i) * 4;
      img.data[k] = R; img.data[k + 1] = G; img.data[k + 2] = B; img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (o.bbox && L) {
    const [cx, cy, cz] = L.center;
    const map: Record<View, [number, number, number]> = { axial: [cx, cy, cz], sagittal: [cy, -cz, cx], coronal: [cx, -cz, cy] };
    const [pu, pv, depth] = map[view];
    const dd = Math.abs(depth - s);
    if (dd < L.r * 1.1) {
      const rr = Math.sqrt(Math.max(0.0025, (L.r * 1.1) ** 2 - dd * dd));
      const px = (a: number) => ((a * o.zoom + 1) / 2) * size;
      const x0 = px(pu - rr), y0 = px(pv - rr), w = px(pu + rr) - x0;
      ctx.strokeStyle = "#ff3b5c";
      ctx.lineWidth = Math.max(1.5, size / 170);
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x0, y0, w, w);
      ctx.setLineDash([]);
      ctx.fillStyle = "#ff3b5c";
      ctx.font = `600 ${Math.round(size / 26)}px IBM Plex Mono, monospace`;
      ctx.fillText(`${L.label} · ${c.confidence}%`, x0, Math.max(12, y0 - 5));
    }
  }
}

export function render3D(ctx: CanvasRenderingContext2D, size: number, c: MriCase, angle: number) {
  const img = ctx.createImageData(size, size);
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const steps = 26;
  const L = c.lesion;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = (i / size) * 2 - 1, v = (j / size) * 2 - 1;
      let acc = 0, hit = 0;
      for (let k = 0; k < steps; k++) {
        const t = (k / steps) * 2 - 1;
        const x = u * ca - t * sa, y = u * sa + t * ca, z = -v;
        const val = sample(c.region, L, x, y, z);
        if (val > 0.5) acc += val;
        if (L && (x - L.center[0]) ** 2 + (y - L.center[1]) ** 2 + (z - L.center[2]) ** 2 < L.r * L.r) hit++;
      }
      const g = Math.min(255, (acc / steps) * 420);
      const p = (j * size + i) * 4;
      const hr = hit > 0 ? Math.min(1, hit / 6) : 0;
      img.data[p] = g * 0.55 + hr * 255 * 0.9;
      img.data[p + 1] = g * 0.8 * (1 - hr * 0.6);
      img.data[p + 2] = g * (1 - hr * 0.7);
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function keyImage(c: MriCase, view: View = "axial"): string {
  const size = 320;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const s = c.lesion ? (view === "axial" ? c.lesion.center[2] : view === "coronal" ? c.lesion.center[1] : c.lesion.center[0]) : 0.1;
  renderSlice(ctx, size, c, view, s, { wl: 0.5, ww: 0.95, zoom: 1, heat: !!c.lesion, bbox: !!c.lesion });
  return cv.toDataURL("image/jpeg", 0.92);
}
