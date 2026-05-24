export interface LibraryItem {
  id: string;
  topic: string;
  platform: string;
  format: string;
  tone: string;
  body: string;
  source_title?: string;
  source_author?: string;
  character_count: number;
  status: "borrador" | "programado" | "publicado";
  saved_at: string;
  scheduled_for?: string | null;
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  const res = await fetch("/api/library");
  if (!res.ok) throw new Error("Error al cargar biblioteca");
  const data = await res.json() as { items: LibraryItem[] };
  return data.items;
}

export async function saveToLibrary(item: Omit<LibraryItem, "id" | "saved_at" | "character_count" | "status">): Promise<LibraryItem> {
  const res = await fetch("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Error al guardar");
  return res.json() as Promise<LibraryItem>;
}

export async function scheduleLibraryItem(id: string, scheduled_for: string): Promise<void> {
  const res = await fetch(`/api/library?id=${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduled_for, status: "programado" }),
  });
  if (!res.ok) throw new Error("Error al programar");
}

export async function deleteFromLibrary(id: string): Promise<void> {
  const res = await fetch(`/api/library?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar");
}
