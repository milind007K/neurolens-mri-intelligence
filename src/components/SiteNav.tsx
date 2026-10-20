import { Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow"><Brain className="h-4 w-4" /></span>
          NeuroLens<span className="text-accent">AI</span>
        </Link>
        <nav className="flex gap-5 text-sm text-muted-foreground">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Overview</Link>
          <Link to="/dashboard" activeProps={{ className: "text-foreground" }}>Dashboard</Link>
        </nav>
        <span className="ml-auto hidden rounded-full border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground sm:block">MR-ONLY · RCOEM CSE AI/ML 2026-27</span>
      </div>
    </header>
  );
}
