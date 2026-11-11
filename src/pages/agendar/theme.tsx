import type { CSSProperties, ReactNode } from "react";
import marcas from "../../../videos/marcas.json";
import { buildTheme, type AgendaTheme, type MarcasJson } from "@/lib/agenda/theme";
import type { AgendaBrand } from "@/lib/agenda/types";
import { cn } from "@/lib/utils";

export function themeFor(brand: AgendaBrand): AgendaTheme {
  return buildTheme(marcas as unknown as MarcasJson, brand);
}

export function themeVars(t: AgendaTheme): CSSProperties {
  return {
    "--paper": t.paper,
    "--card": t.card,
    "--ink": t.ink,
    "--muted": t.muted,
    "--line": t.line,
    "--accent": t.accent,
    "--on-accent": t.onAccent,
    "--soft": t.soft,
    "--on-ink": t.onInk,
  } as CSSProperties;
}

/** Contenedor de página con la paleta de la marca y retícula de puntos. */
export function AgendaFrame({ brand, children, className }: { brand: AgendaBrand; children: ReactNode; className?: string }) {
  const t = themeFor(brand);
  return (
    <div
      className={cn("min-h-screen w-full bg-[var(--paper)] text-[var(--ink)] antialiased", className)}
      style={{
        ...themeVars(t),
        backgroundImage: "radial-gradient(var(--line) 1.2px, transparent 1.2px)",
        backgroundSize: "22px 22px",
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-[var(--ink)] px-3.5 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--on-ink)]", className)}>
      {children}
    </span>
  );
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
