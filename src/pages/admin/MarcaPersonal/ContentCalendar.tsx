import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generatedContents } from "@/data/mockContent";
import type { Platform, ContentStatus } from "@/types/content";
import { PLATFORM_LABELS, PLATFORM_TEXT_COLORS } from "@/types/content";
import { ChevronLeft, ChevronRight, Plus, Calendar, Linkedin, Instagram, Facebook, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<ContentStatus, { label: string; class: string }> = {
  borrador: { label: "Borrador", class: "bg-muted text-muted-foreground" },
  programado: { label: "Programado", class: "bg-blue-100 text-blue-700" },
  publicado: { label: "Publicado", class: "bg-green-100 text-green-700" },
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Map content to calendar slots for demonstration
const calendarData: Record<string, { content: (typeof generatedContents)[0]; hour: number }[]> = {
  "2026-05-22": [{ content: generatedContents[0], hour: 12 }],
  "2026-05-20": [{ content: generatedContents[3], hour: 11 }],
  "2026-05-24": [{ content: generatedContents[1], hour: 10 }],
  "2026-05-26": [{ content: generatedContents[2], hour: 18 }],
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Convert to Mon=0
}

export function ContentCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const selectedItems = selectedDate ? (calendarData[selectedDate] ?? []) : [];

  // Platform summary stats
  const stats = generatedContents.reduce<Record<ContentStatus, number>>(
    (acc, c) => { acc[c.status]++; return acc; },
    { borrador: 0, programado: 0, publicado: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["publicado", "programado", "borrador"] as ContentStatus[]).map((status) => (
          <div key={status} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full", status === "publicado" ? "bg-green-500" : status === "programado" ? "bg-blue-500" : "bg-muted-foreground")} />
            <div>
              <p className="text-2xl font-bold">{stats[status]}</p>
              <p className="text-xs text-muted-foreground capitalize">{STATUS_CONFIG[status].label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{MONTHS[viewMonth]} {viewYear}</h3>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = formatDateKey(day);
              const items = calendarData[dateKey] ?? [];
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
                    items.length > 0 ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium",
                    isToday ? "text-primary font-bold" : "text-foreground"
                  )}>
                    {day}
                  </span>
                  {/* Content dots */}
                  {items.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {items.slice(0, 2).map((item, idx) => {
                        const Icon = PLATFORM_ICONS[item.content.platform];
                        return (
                          <div key={idx} className={cn("flex items-center gap-1 text-[10px] rounded px-1 py-0.5", STATUS_CONFIG[item.content.status].class)}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate hidden sm:block">{PLATFORM_LABELS[item.content.platform]}</span>
                          </div>
                        );
                      })}
                      {items.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{items.length - 2} más</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: selected day / upcoming */}
        <div className="space-y-4">
          {selectedDate && selectedItems.length > 0 ? (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-sm">{selectedDate}</h4>
              {selectedItems.map((item, idx) => {
                const Icon = PLATFORM_ICONS[item.content.platform];
                const platformColor = PLATFORM_TEXT_COLORS[item.content.platform];
                return (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", platformColor)}>
                        <Icon className="w-3.5 h-3.5" />
                        {PLATFORM_LABELS[item.content.platform]}
                      </div>
                      <Badge className={cn("text-[10px]", STATUS_CONFIG[item.content.status].class)}>
                        {STATUS_CONFIG[item.content.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{item.content.topic}</p>
                    <p className="text-[10px] text-muted-foreground">{String(item.hour).padStart(2, "0")}:00 hrs</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">Selecciona un día</p>
              <p className="text-xs mt-1">Los días con contenido programado aparecen con etiquetas de color</p>
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <span>Próximos a publicar</span>
              <Badge variant="outline" className="text-[10px]">Esta semana</Badge>
            </h4>
            {generatedContents
              .filter((c) => c.status === "programado" || c.status === "borrador")
              .map((content) => {
                const Icon = PLATFORM_ICONS[content.platform];
                const platformColor = PLATFORM_TEXT_COLORS[content.platform];
                return (
                  <div key={content.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className={cn("mt-0.5", platformColor)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{content.topic}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={cn("text-[10px] px-1.5", STATUS_CONFIG[content.status].class)}>
                          {STATUS_CONFIG[content.status].label}
                        </Badge>
                        {content.scheduledFor && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(content.scheduledFor).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              Programar contenido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
