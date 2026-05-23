import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generatedContents } from "@/data/mockContent";
import type { Platform, ContentStatus, GeneratedContent } from "@/types/content";
import { PLATFORM_LABELS, PLATFORM_TEXT_COLORS, FORMAT_LABELS } from "@/types/content";
import { Copy, Check, Linkedin, Instagram, Facebook, BookOpen, Eye, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.88a4.85 4.85 0 01-1.01-.19z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTokIcon,
  blog: BookOpen,
};

const STATUS_STYLES: Record<ContentStatus, string> = {
  borrador: "bg-muted text-muted-foreground",
  programado: "bg-blue-100 text-blue-700",
  publicado: "bg-green-100 text-green-700",
};

function ContentCard({ content }: { content: GeneratedContent }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const Icon = PLATFORM_ICONS[content.platform];
  const platformColor = PLATFORM_TEXT_COLORS[content.platform];

  const handleCopy = () => {
    navigator.clipboard.writeText(content.body);
    setCopied(true);
    toast.success("Contenido copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", platformColor)}>
            <Icon className="w-4 h-4" />
            {PLATFORM_LABELS[content.platform]}
          </div>
          <Badge variant="outline" className="text-xs">
            {FORMAT_LABELS[content.format]}
          </Badge>
          <Badge className={cn("text-xs", STATUS_STYLES[content.status])}>
            {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(content.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* Topic */}
      <p className="text-sm font-medium text-foreground">{content.topic}</p>

      {/* Body preview */}
      <div className="relative">
        <p className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-line", !expanded && "line-clamp-4")}>
          {content.body}
        </p>
        {content.body.length > 300 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-primary font-medium mt-1 hover:underline"
          >
            {expanded ? "Ver menos" : "Ver completo"}
          </button>
        )}
      </div>

      {/* Hashtags */}
      {content.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {content.hashtags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
          {content.hashtags.length > 5 && (
            <span className="text-[10px] text-muted-foreground px-1">+{content.hashtags.length - 5}</span>
          )}
        </div>
      )}

      {/* Visual suggestion */}
      {content.suggestedVisual && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border">
          <span className="font-medium text-foreground">Visual sugerido: </span>
          {content.suggestedVisual}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          {content.characterCount.toLocaleString()} caracteres
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setExpanded((e) => !e)}>
            <Eye className="w-3.5 h-3.5" />
            {expanded ? "Colapsar" : "Ver"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContentLibrary() {
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ContentStatus | "all">("all");

  const filtered = generatedContents.filter((c) => {
    if (filterPlatform !== "all" && c.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  const platforms = ["all", ...Object.keys(PLATFORM_LABELS)] as (Platform | "all")[];
  const statuses: (ContentStatus | "all")[] = ["all", "publicado", "programado", "borrador"];

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filtrar:</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {platforms.map((p) => {
            const Icon = p !== "all" ? PLATFORM_ICONS[p] : null;
            return (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  filterPlatform === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {p === "all" ? "Todas" : PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 flex-wrap sm:ml-2 sm:pl-2 sm:border-l sm:border-border">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} pieza{filtered.length !== 1 ? "s" : ""} de contenido
      </p>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay contenido con estos filtros</p>
        </div>
      )}
    </div>
  );
}
