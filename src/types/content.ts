export type Platform = "linkedin" | "instagram" | "facebook" | "tiktok" | "blog";
export type ContentTone = "profesional" | "educativo" | "inspiracional" | "controversial" | "practico";
export type ContentStatus = "borrador" | "programado" | "publicado";
export type ContentFormat = "post" | "carrusel" | "script_video" | "copy_corto" | "articulo_blog" | "story";
export type SourceCategory = "ia_tecnologia" | "construccion" | "gestion_proyectos" | "materiales" | "tendencias" | "liderazgo";

export interface TrendingSource {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  author: string;
  category: SourceCategory;
  engagementScore: number; // 0-100
  publishedAt: string;
  tags: string[];
  platform: "linkedin" | "medium" | "youtube" | "blog" | "twitter";
  readTime?: number; // minutes
  views?: number;
  likes?: number;
}

export interface GeneratedContent {
  id: string;
  sourceId?: string;
  topic: string;
  platform: Platform;
  format: ContentFormat;
  tone: ContentTone;
  body: string;
  hashtags: string[];
  callToAction?: string;
  suggestedVisual?: string;
  characterCount: number;
  createdAt: string;
  status: ContentStatus;
  scheduledFor?: string;
  publishedAt?: string;
}

export interface ContentPlan {
  id: string;
  weekOf: string;
  platform: Platform;
  content: GeneratedContent;
  slot: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
  hour: number;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  blog: "Blog",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: "bg-blue-600",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  facebook: "bg-blue-500",
  tiktok: "bg-black",
  blog: "bg-emerald-600",
};

export const PLATFORM_TEXT_COLORS: Record<Platform, string> = {
  linkedin: "text-blue-600",
  instagram: "text-pink-600",
  facebook: "text-blue-500",
  tiktok: "text-slate-900",
  blog: "text-emerald-600",
};

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  post: "Post",
  carrusel: "Carrusel",
  script_video: "Script de Video",
  copy_corto: "Copy Corto",
  articulo_blog: "Artículo Blog",
  story: "Story / Reel",
};

export const CATEGORY_LABELS: Record<SourceCategory, string> = {
  ia_tecnologia: "IA & Tecnología",
  construccion: "Construcción",
  gestion_proyectos: "Gestión de Proyectos",
  materiales: "Materiales",
  tendencias: "Tendencias",
  liderazgo: "Liderazgo",
};
