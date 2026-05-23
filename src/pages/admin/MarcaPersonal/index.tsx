import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingFeed } from "./TrendingFeed";
import { ContentGenerator } from "./ContentGenerator";
import { ContentCalendar } from "./ContentCalendar";
import { ContentLibrary } from "./ContentLibrary";
import type { TrendingSource } from "@/types/content";
import { trendingSources, generatedContents } from "@/data/mockContent";
import { TrendingUp, Sparkles, Calendar, Library, Flame, Zap } from "lucide-react";

export default function MarcaPersonalHub() {
  const [activeTab, setActiveTab] = useState("trending");
  const [selectedSource, setSelectedSource] = useState<TrendingSource | null>(null);

  const handleGenerateFromSource = (source: TrendingSource) => {
    setSelectedSource(source);
    setActiveTab("generar");
  };

  const topEngagement = Math.max(...trendingSources.map((s) => s.engagementScore));
  const published = generatedContents.filter((c) => c.status === "publicado").length;
  const scheduled = generatedContents.filter((c) => c.status === "programado").length;
  const drafts = generatedContents.filter((c) => c.status === "borrador").length;

  return (
    <AppShell
      title="Marca Personal"
      subtitle="Hub de creación de contenido · Construcción & IA"
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trendingSources.length}</p>
              <p className="text-xs text-muted-foreground">Fuentes trending</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">Score {topEngagement}/100</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{generatedContents.length}</p>
              <p className="text-xs text-muted-foreground">Contenidos creados</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">5 plataformas</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduled}</p>
              <p className="text-xs text-muted-foreground">Programados</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">{published} publicados · {drafts} borrador</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3 shadow-card">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Library className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-muted-foreground">Plataformas activas</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">LI · IG · FB · TT · Blog</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border">
            <TabsList className="h-auto bg-transparent p-0 gap-0">
              {[
                { value: "trending", label: "Fuentes Trending", icon: TrendingUp },
                { value: "generar", label: "Generar Contenido", icon: Sparkles, badge: selectedSource ? "1 fuente" : undefined },
                { value: "calendario", label: "Calendario", icon: Calendar },
                { value: "biblioteca", label: "Biblioteca", icon: Library },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 py-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                    {tab.badge && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">{tab.badge}</Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="pt-6">
            <TabsContent value="trending" className="m-0">
              <TrendingFeed onGenerate={handleGenerateFromSource} />
            </TabsContent>

            <TabsContent value="generar" className="m-0">
              {selectedSource && (
                <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800 flex-1">
                    Generando desde: <span className="font-semibold">{selectedSource.title}</span>
                  </p>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Limpiar
                  </button>
                </div>
              )}
              <ContentGenerator
                prefillSource={selectedSource}
                onSave={() => setActiveTab("biblioteca")}
              />
            </TabsContent>

            <TabsContent value="calendario" className="m-0">
              <ContentCalendar />
            </TabsContent>

            <TabsContent value="biblioteca" className="m-0">
              <ContentLibrary />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
