import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  // Deterministic color based on name length
  const palette = ["bg-primary/15 text-primary", "bg-info/15 text-info", "bg-success/15 text-success", "bg-warning/20 text-warning", "bg-pink/20 text-pink"];
  const color = palette[name.length % palette.length];
  return (
    <div className={cn("flex items-center justify-center rounded-full font-semibold text-xs shrink-0", color, className)}>
      {initials}
    </div>
  );
}
