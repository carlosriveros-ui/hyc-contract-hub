import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trendingSources } from "@/data/mockContent";
import type { SourceCategory, TrendingSource } from "@/types/content";
import { CATEGORY_LABELS } from "@/types/content";
import {
  ExternalLink, Search, TrendingUp, ThumbsUp, Eye, Clock,
  Sparkles, Linkedin, Youtube, Globe, BookOpen, RefreshCw, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<SourceCategory, string> = {
  ia_tecnologia: "bg-violet-100 text-violet-700 border-violet-200",
  construccion: "bg-orange-100 text-orange-700 border-orange-200",
  gestion_proyectos: "bg-blue-100 text-blue-700 border-blue-200",
  materiales: "bg-green-100 text-green-700 border-green-200",
  tendencias: "bg-pink-100 text-pink-700 border-pink-200",
  liderazgo: "bg-amber-100 text-amber-700 border-amber-200",
};

const SOURCE_ICONS: Record<TrendingSource["platform"], React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  youtube: Youtube,
  medium: BookOpen,
  blog: Globe,
  twitter: Globe,
};

function EngagementBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", score >= 90 ? "bg-green-500" : score >= 75 ? "bg-yellow-500" : "bg-muted-foreground")}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-muted-foreground w-6">{score}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-4 w-full bg-muted rounded" />
      <div className="h-4 w-3/4 bg-muted rounded" />
      <div className="h-12 w-full bg-muted rounded" />
      <div className="flex gap-1">
        {[1,2,3].map((i) => <div key={i} className="h-4 w-16 bg-muted rounded-full" />)}
      </div>
      <div className="h-8 w-full bg-muted rounded-lg" />
    </div>
  );
}

interface Props {
  onGenerate: (source: TrendingSource) => void;
}

export function TrendingFeed({ onGenerate }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<SourceCategory | "all">("all");
  const [sources, setSources] = useState<TrendingSource[]>(trendingSources);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const categories: (SourceCategory | "all")[] = ["all", "ia_tecnologia", "construccion", "gestion_proyectos", "materiales", "liderazgo", "tendencias"];

  const fetchTrending = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const url = force ? "/api/trending?refresh=true" : "/api/trending";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar tendencias");
      const data = await res.json() as { items: TrendingSource[]; cached: boolean; fetchedAt?: number };
      if (data.items?.length > 0) {
        setSources(data.items);
        setIsLive(true);
        setLastFetch(new Date());
        if (force) toast.success(`${data.items.length} artículos actualizados desde fuentes reales`);
      } else {
        setSources(trendingSources);
        setIsLive(false);
      }
    } catch {
      setSources(trendingSources);
      setIsLive(false);
      if (force) toast.error("No se pudieron cargar fuentes en vivo. Mostrando demo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const filtered = sources
    .filter((s) => activeCategory === "all" || s.category === activeCategory)
    .filter((s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
        <span className="flex items-center gap-1.5">
          {isLive ? (
            <><Wifi className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600 font-medium">Fuentes reales</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-muted-foreground" /><span>Datos de demo</span></>
          )}
          {lastFetch && <span className="ml-1">· Actualizado {lastFetch.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span>}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs gap-1"
          onClick={() => fetchTrending(true)}
          disabled={loading}
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          {loading ? "Buscando..." : "Actualizar"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar temas, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {cat === "all" ? "Todos" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((source) => {
            const Icon = SOURCE_ICONS[source.platform];
            return (
              <div
                key={source.id}
                className="bg-surface border border-border rounded-xl p-5 shadow-card flex flex-col gap-3 hover:border-primary/40 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className={cn("text-xs font-medium border", CATEGORY_COLORS[source.category as SourceCategory])}>
                    {CATEGORY_LABELS[source.category as SourceCategory] ?? source.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs capitalize">{source.platform}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-2">
                  {source.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {source.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {source.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Metrics */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Engagement
                  </span>
                  <EngagementBar score={source.engagementScore} />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {source.views && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {source.views >= 1000 ? `${(source.views / 1000).toFixed(0)}K` : source.views}
                    </span>
                  )}
                  {source.likes && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {source.likes >= 1000 ? `${(source.likes / 1000).toFixed(1)}K` : source.likes}
                    </span>
                  )}
                  {source.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {source.readTime} min
                    </span>
                  )}
                  <span className="ml-auto">{source.publishedAt}</span>
                </div>

                {/* Author */}
                <div className="text-xs text-muted-foreground border-t border-border pt-2">
                  <span className="font-medium text-foreground">{source.author}</span>
                  {" · "}
                  {source.source}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => onGenerate(source)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generar contenido
                  </Button>
                  {source.url && source.url !== "#" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3"
                      onClick={() => window.open(source.url, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay fuentes para estos filtros</p>
          <p className="text-sm">Prueba con otra categoría o término de búsqueda</p>
        </div>
      )}
    </div>
  );
}
