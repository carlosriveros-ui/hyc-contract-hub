import logo from "@/assets/manthyc-logo.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ size = "md", variant = "light", className }: {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}) {
  const sizes = { sm: "h-6", md: "h-8", lg: "h-10" };
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" };
  return (
    <div className={cn("flex items-center gap-2 font-bold tracking-tight", className)}>
      <img src={logo} alt="HYC" width={32} height={32} className={cn(sizes[size], "w-auto")} />
      <span className={cn(text[size], variant === "light" ? "text-sidebar-foreground" : "text-foreground")}>
        Mant<span className="text-primary">HYC</span>
      </span>
    </div>
  );
}
