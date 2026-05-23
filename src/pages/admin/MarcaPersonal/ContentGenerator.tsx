import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Platform, ContentFormat, ContentTone, TrendingSource } from "@/types/content";
import { PLATFORM_LABELS, FORMAT_LABELS } from "@/types/content";
import { generatePlatformContent } from "@/lib/contentAI";
import {
  Sparkles, Copy, Check, RefreshCw, Linkedin, Instagram,
  Facebook, BookOpen, Bookmark, ChevronRight, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// TikTok icon as SVG since it's not in lucide
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.88a4.85 4.85 0 01-1.01-.19z" />
    </svg>
  );
}

const PLATFORM_CONFIG: Record<Platform, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  formats: ContentFormat[];
  maxChars?: number;
}> = {
  linkedin: {
    icon: Linkedin,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    formats: ["post", "carrusel", "articulo_blog"],
    maxChars: 3000,
  },
  instagram: {
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-50 border-pink-200",
    formats: ["post", "carrusel", "story", "copy_corto"],
    maxChars: 2200,
  },
  facebook: {
    icon: Facebook,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
    formats: ["post", "copy_corto"],
    maxChars: 63206,
  },
  tiktok: {
    icon: TikTokIcon,
    color: "text-slate-900",
    bg: "bg-slate-50 border-slate-200",
    formats: ["script_video", "copy_corto"],
    maxChars: 2200,
  },
  blog: {
    icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    formats: ["articulo_blog", "post"],
    maxChars: undefined,
  },
};

const TONES: { value: ContentTone; label: string; emoji: string }[] = [
  { value: "profesional", label: "Profesional", emoji: "💼" },
  { value: "educativo", label: "Educativo", emoji: "📚" },
  { value: "inspiracional", label: "Inspiracional", emoji: "🔥" },
  { value: "practico", label: "Práctico", emoji: "🛠️" },
  { value: "controversial", label: "Controversial", emoji: "⚡" },
];

interface Props {
  prefillSource?: TrendingSource | null;
  onSave?: (content: string, platform: Platform) => void;
}

export function ContentGenerator({ prefillSource, onSave }: Props) {
  const [topic, setTopic] = useState(prefillSource?.summary ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["linkedin"]);
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>("post");
  const [selectedTone, setSelectedTone] = useState<ContentTone>("profesional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<Record<Platform, string>>({} as Record<Platform, string>);
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<Platform>("linkedin");

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !prefillSource) {
      toast.error("Escribe el tema o pega el contenido fuente");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Selecciona al menos una plataforma");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generatePlatformContent({
        topic: topic || prefillSource?.summary || "",
        sourceTitle: prefillSource?.title,
        sourceAuthor: prefillSource?.author,
        platforms: selectedPlatforms,
        format: selectedFormat,
        tone: selectedTone,
      });
      setGenerated(result);
      setActivePlatformTab(selectedPlatforms[0]);
      toast.success("Contenido generado exitosamente");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al generar: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (platform: Platform) => {
    if (generated[platform]) {
      navigator.clipboard.writeText(generated[platform]);
      setCopiedPlatform(platform);
      toast.success(`Copiado para ${PLATFORM_LABELS[platform]}`);
      setTimeout(() => setCopiedPlatform(null), 2000);
    }
  };

  const handleSave = (platform: Platform) => {
    onSave?.(generated[platform], platform);
    toast.success("Guardado en tu biblioteca");
  };

  const hasGenerated = Object.keys(generated).length > 0;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* LEFT: Config panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Source / Topic */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Tema o fuente</h3>
          </div>

          {prefillSource && (
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Fuente seleccionada:</p>
              <p className="text-sm font-medium line-clamp-2">{prefillSource.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{prefillSource.source} · {prefillSource.author}</p>
            </div>
          )}

          <Textarea
            placeholder="Describe el tema, pega el artículo fuente, o escribe las ideas clave que quieres comunicar..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-28 resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Puedes pegar el contenido completo de un artículo. La IA lo transformará en contenido original y de tu voz.
          </p>
        </div>

        {/* Platform selection */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Plataformas de destino</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
              const cfg = PLATFORM_CONFIG[platform];
              const Icon = cfg.icon;
              const selected = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                    selected
                      ? `${cfg.bg} ${cfg.color} border-current`
                      : "bg-surface border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {PLATFORM_LABELS[platform]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Formato</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMAT_LABELS) as ContentFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  selectedFormat === format
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary"
                )}
              >
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Tono</h3>
          <div className="grid grid-cols-1 gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedTone(t.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left",
                  selectedTone === t.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <Button
          className="w-full gap-2 text-sm h-11"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generando contenido...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar para {selectedPlatforms.length} plataforma{selectedPlatforms.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>

      {/* RIGHT: Output panel */}
      <div className="lg:col-span-3">
        {!hasGenerated && !isGenerating && (
          <div className="h-full min-h-80 bg-surface border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center p-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Listo para generar</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Configura el tema, selecciona las plataformas y el tono, luego haz clic en Generar.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <ChevronRight className="w-3 h-3" />
              La IA adaptará el contenido al formato y estilo de cada plataforma
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="h-full min-h-80 bg-surface border border-border rounded-xl flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Analizando y generando...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adaptando el contenido para {selectedPlatforms.map((p) => PLATFORM_LABELS[p]).join(", ")}
              </p>
            </div>
          </div>
        )}

        {hasGenerated && !isGenerating && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <Tabs value={activePlatformTab} onValueChange={(v) => setActivePlatformTab(v as Platform)}>
              <div className="border-b border-border px-4">
                <TabsList className="h-auto bg-transparent p-0 gap-1">
                  {selectedPlatforms.map((platform) => {
                    const cfg = PLATFORM_CONFIG[platform];
                    const Icon = cfg.icon;
                    return (
                      <TabsTrigger
                        key={platform}
                        value={platform}
                        className={cn(
                          "flex items-center gap-1.5 py-3 px-3 text-xs font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                          activePlatformTab === platform ? cfg.color : ""
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {PLATFORM_LABELS[platform]}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {selectedPlatforms.map((platform) => {
                const content = generated[platform] ?? "";
                const cfg = PLATFORM_CONFIG[platform];
                const charCount = content.length;
                const overLimit = cfg.maxChars ? charCount > cfg.maxChars : false;

                return (
                  <TabsContent key={platform} value={platform} className="m-0">
                    <div className="p-5 space-y-4">
                      {/* Toolbar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", cfg.bg, cfg.color)}>
                            {FORMAT_LABELS[selectedFormat]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {TONES.find((t) => t.value === selectedTone)?.emoji} {selectedTone}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs", overLimit ? "text-destructive font-semibold" : "text-muted-foreground")}>
                            {charCount.toLocaleString()}{cfg.maxChars ? `/${cfg.maxChars.toLocaleString()}` : ""} chars
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <Textarea
                        value={content}
                        onChange={(e) => setGenerated((prev) => ({ ...prev, [platform]: e.target.value }))}
                        className="min-h-96 font-mono text-xs resize-none leading-relaxed"
                      />

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs flex-1"
                          onClick={() => handleCopy(platform)}
                        >
                          {copiedPlatform === platform ? (
                            <><Check className="w-3.5 h-3.5 text-green-500" /> Copiado</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copiar</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs flex-1"
                          onClick={() => handleSave(platform)}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerar
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
