import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Platform, ContentStatus } from "@/types/content";
import { PLATFORM_LABELS, PLATFORM_TEXT_COLORS } from "@/types/content";
import { ChevronLeft, ChevronRight, Calendar, Linkedin, Instagram, Facebook, BookOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchLibrary, type LibraryItem } from "@/lib/libraryService";
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

const STATUS_CONFIG: Record<ContentStatus, { label: string; class: string; dot: string }> = {
  borrador: { label: "Borrador", class: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  programado: { label: "Programado", class: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  publicado: { label: "Publicado", class: "bg-green-100 text-green-700", dot: "bg-green-500" },
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface Props {
  refreshTrigger?: number;
}

export function ContentCalendar({ refreshTrigger }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLibrary();
      setItems(data);
    } catch {
      toast.error("No se pudo cargar el calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const formatDateKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build calendar data from scheduled items
  const calendarData: Record<string, LibraryItem[]> = {};
  for (const item of items) {
    if (!item.scheduled_for) continue;
    const dateKey = item.scheduled_for.split("T")[0];
    if (!calendarData[dateKey]) calendarData[dateKey] = [];
    calendarData[dateKey].push(item);
  }

  const selectedItems = selectedDate ? (calendarData[selectedDate] ?? []) : [];

  const stats = items.reduce<Record<ContentStatus, number>>(
    (acc, c) => { acc[c.status]++; return acc; },
    { borrador: 0, programado: 0, publicado: 0 }
  );

  const upcoming = items
    .filter((c) => c.scheduled_for && (c.status === "programado" || c.status === "borrador"))
    .sort((a, b) => (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["publicado", "programado", "borrador"] as ContentStatus[]).map((status) => (
          <div key={status} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", STATUS_CONFIG[status].dot)} />
            <div>
              <p className="text-2xl font-bold">{loading ? "—" : stats[status]}</p>
              <p className="text-xs text-muted-foreground">{STATUS_CONFIG[status].label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{MONTHS[viewMonth]} {viewYear}</h3>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={load} disabled={loading}>
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </Button>
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(day);
              const dayItems = calendarData[dateKey] ?? [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={cn(
                    "relative min-h-14 p-1.5 rounded-lg border text-left transition-all",
                    isToday && !isSelected ? "border-primary bg-primary/5" : "border-transparent",
                    isSelected ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                    dayItems.length > 0 ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday ? "text-primary font-bold" : "text-foreground")}>
                    {day}
                  </span>
                  {dayItems.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 2).map((item, idx) => {
                        const platform = item.platform as Platform;
                        const Icon = PLATFORM_ICONS[platform] ?? BookOpen;
                        return (
                          <div key={idx} className={cn("flex items-center gap-1 text-[10px] rounded px-1 py-0.5", STATUS_CONFIG[item.status].class)}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate hidden sm:block">{PLATFORM_LABELS[platform] ?? platform}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 2} más</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedDate && selectedItems.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-sm">{new Date(selectedDate + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</h4>
              {selectedItems.map((item) => {
                const platform = item.platform as Platform;
                const Icon = PLATFORM_ICONS[platform] ?? BookOpen;
                const platformColor = PLATFORM_TEXT_COLORS[platform] ?? "text-foreground";
                return (
                  <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", platformColor)}>
                        <Icon className="w-3.5 h-3.5" />
                        {PLATFORM_LABELS[platform] ?? platform}
                      </div>
                      <Badge className={cn("text-[10px] border-0", STATUS_CONFIG[item.status].class)}>
                        {STATUS_CONFIG[item.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground line-clamp-2">{item.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{item.character_count.toLocaleString()} chars · {item.tone}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">
                {loading ? "Cargando..." : "Selecciona un día"}
              </p>
              <p className="text-xs mt-1">Los días con contenido programado muestran etiquetas de color</p>
            </div>
          )}

          {/* Upcoming scheduled */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              Próximos programados
              <Badge variant="outline" className="text-[10px]">{upcoming.length}</Badge>
            </h4>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : "Sin contenido programado — usa el botón del calendario en la Biblioteca"}
              </p>
            ) : (
              upcoming.map((item) => {
                const platform = item.platform as Platform;
                const Icon = PLATFORM_ICONS[platform] ?? BookOpen;
                const platformColor = PLATFORM_TEXT_COLORS[platform] ?? "text-foreground";
                return (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={cn("mt-0.5", platformColor)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{item.topic}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={cn("text-[10px] px-1.5 border-0", STATUS_CONFIG[item.status].class)}>
                          {STATUS_CONFIG[item.status].label}
                        </Badge>
                        {item.scheduled_for && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.scheduled_for + (item.scheduled_for.includes("T") ? "" : "T12:00:00")).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
