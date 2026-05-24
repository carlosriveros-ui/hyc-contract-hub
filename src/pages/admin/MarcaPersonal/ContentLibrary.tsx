import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Platform, ContentStatus } from "@/types/content";
import { PLATFORM_LABELS, PLATFORM_TEXT_COLORS, FORMAT_LABELS } from "@/types/content";
import { Copy, Check, Linkedin, Instagram, Facebook, BookOpen, Eye, Filter, Trash2, RefreshCw, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchLibrary, deleteFromLibrary, scheduleLibraryItem, type LibraryItem } from "@/lib/libraryService";

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

function ContentCard({
  item,
  onDelete,
  onSchedule,
}: {
  item: LibraryItem;
  onDelete: (id: string) => void;
  onSchedule: (id: string, date: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(
    item.scheduled_for ? item.scheduled_for.split("T")[0] : ""
  );
  const [scheduling, setScheduling] = useState(false);

  const platform = item.platform as Platform;
  const Icon = PLATFORM_ICONS[platform] ?? BookOpen;
  const platformColor = PLATFORM_TEXT_COLORS[platform] ?? "text-foreground";

  const handleCopy = () => {
    navigator.clipboard.writeText(item.body);
    setCopied(true);
    toast.success("Contenido copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteFromLibrary(item.id);
      onDelete(item.id);
      toast.success("Eliminado de la biblioteca");
    } catch {
      toast.error("Error al eliminar");
      setDeleting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setScheduling(true);
    try {
      await scheduleLibraryItem(item.id, scheduleDate);
      onSchedule(item.id, scheduleDate);
      toast.success("Contenido programado para " + new Date(scheduleDate + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }));
      setShowScheduler(false);
    } catch {
      toast.error("Error al programar");
    } finally {
      setScheduling(false);
    }
  };

  const currentStatus = item.status;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", platformColor)}>
            <Icon className="w-4 h-4" />
            {PLATFORM_LABELS[platform] ?? platform}
          </div>
          <Badge variant="outline" className="text-xs">
            {FORMAT_LABELS[item.format as keyof typeof FORMAT_LABELS] ?? item.format}
          </Badge>
          <Badge className={cn("text-xs border-0", STATUS_STYLES[currentStatus])}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(item.saved_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* Topic */}
      <p className="text-sm font-medium text-foreground line-clamp-2">{item.topic}</p>

      {/* Source */}
      {item.source_title && (
        <p className="text-xs text-muted-foreground">
          Fuente: <span className="font-medium">{item.source_title}</span>
        </p>
      )}

      {/* Scheduled date */}
      {item.scheduled_for && !showScheduler && (
        <p className="text-xs text-blue-600 font-medium">
          Programado:{" "}
          {new Date(item.scheduled_for + (item.scheduled_for.includes("T") ? "" : "T12:00:00")).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      )}

      {/* Body preview */}
      <div>
        <p className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-line", !expanded && "line-clamp-4")}>
          {item.body}
        </p>
        {item.body.length > 250 && (
          <button onClick={() => setExpanded((e) => !e)} className="text-xs text-primary font-medium mt-1 hover:underline">
            {expanded ? "Ver menos" : "Ver completo"}
          </button>
        )}
      </div>

      {/* Inline scheduler */}
      {showScheduler && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="text-xs border border-border rounded px-2 py-1 bg-background flex-1 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handleSchedule}
            disabled={!scheduleDate || scheduling}
          >
            {scheduling ? "..." : "Guardar"}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setShowScheduler(false)}>
            ✕
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {item.character_count.toLocaleString()} chars · {item.tone}
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setExpanded((e) => !e)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2", showScheduler ? "text-primary" : "")}
            onClick={() => setShowScheduler((s) => !s)}
            title="Programar publicación"
          >
            <CalendarClock className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  refreshTrigger?: number;
}

export function ContentLibrary({ refreshTrigger }: Props) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ContentStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLibrary();
      setItems(data);
    } catch {
      toast.error("No se pudo cargar la biblioteca. ¿Está corriendo el servidor?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const handleDelete = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleSchedule = (id: string, date: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, scheduled_for: date, status: "programado" as const } : i
      )
    );
  };

  const filtered = items.filter((c) => {
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
                  filterPlatform === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {p === "all" ? "Todas" : PLATFORM_LABELS[p]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 flex-wrap sm:ml-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={load} disabled={loading}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "Cargando..." : `${filtered.length} pieza${filtered.length !== 1 ? "s" : ""} guardada${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} onDelete={handleDelete} onSchedule={handleSchedule} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">
            {items.length === 0 ? "Aún no has guardado contenido" : "No hay contenido con estos filtros"}
          </p>
          <p className="text-sm mt-1">
            {items.length === 0 ? "Genera contenido y haz clic en Guardar para verlo aquí" : "Prueba cambiando los filtros"}
          </p>
        </div>
      )}
    </div>
  );
}
