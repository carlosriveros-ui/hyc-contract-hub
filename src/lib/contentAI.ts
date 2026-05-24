import type { Platform, ContentFormat, ContentTone } from "@/types/content";
import { PLATFORM_LABELS } from "@/types/content";

export interface GenerationParams {
  topic: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  platforms: Platform[];
  format: ContentFormat;
  tone: ContentTone;
}

export async function generatePlatformContent(
  params: GenerationParams
): Promise<Record<Platform, string>> {
  const response = await fetch("/api/generate-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error ?? "Error al llamar al servidor");
  }

  const data = await response.json() as { platforms: Record<Platform, string> };

  const result: Partial<Record<Platform, string>> = {};
  for (const platform of params.platforms) {
    result[platform] =
      data.platforms[platform] ??
      `[Error: no se generó contenido para ${PLATFORM_LABELS[platform]}]`;
  }

  return result as Record<Platform, string>;
}
