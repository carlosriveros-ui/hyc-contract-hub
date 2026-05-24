import type {
  User, Contract, Site, Activity, Material, Movement,
  Contractor, CostEntry, AttendanceEntry, PettyCashEntry,
} from "@/types";

const BASE = "/api/data";

async function apiFetch<T>(table: string, params: Record<string, string> = {}): Promise<T[]> {
  const qs = new URLSearchParams({ table, ...params });
  const res = await fetch(`${BASE}?${qs}`);
  if (!res.ok) throw new Error(`[${table}] Error ${res.status}`);
  return res.json();
}

async function apiPost<T>(table: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}?table=${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[${table}] Error ${res.status}`);
  return res.json();
}

async function apiPatch<T>(table: string, id: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`[${table}] Error ${res.status}`);
  return res.json();
}

export async function apiDelete(table: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`[${table}] Error ${res.status}`);
}

export const usersApi = {
  list: () => apiFetch<User>("app_users"),
};

export const contractsApi = {
  list: () => apiFetch<Contract>("contracts"),
  get: (id: string) => apiFetch<Contract>("contracts", { id }).then((d) => d[0] ?? null),
  create: (data: Omit<Contract, "id">) =>
    apiPost<Contract>("contracts", { id: `c${Date.now()}`, ...data }),
  update: (id: string, data: Partial<Contract>) => apiPatch<Contract>("contracts", id, data),
};

export const sitesApi = {
  list: (params?: Record<string, string>) => apiFetch<Site>("sites", params),
  update: (id: string, data: Partial<Site>) => apiPatch<Site>("sites", id, data),
};

export const activitiesApi = {
  list: (params?: Record<string, string>) => apiFetch<Activity>("activities", params),
  create: (data: Omit<Activity, "id">) =>
    apiPost<Activity>("activities", { id: `a${Date.now()}`, ...data }),
  update: (id: string, data: Partial<Activity>) => apiPatch<Activity>("activities", id, data),
};

export const materialsApi = {
  list: () => apiFetch<Material>("materials"),
  update: (id: string, data: Partial<Material>) => apiPatch<Material>("materials", id, data),
};

export const movementsApi = {
  list: () => apiFetch<Movement>("movements"),
  create: (data: Omit<Movement, "id">) =>
    apiPost<Movement>("movements", { id: `mv${Date.now()}`, ...data }),
};

export const contractorsApi = {
  list: (params?: Record<string, string>) => apiFetch<Contractor>("contractors", params),
  create: (data: Omit<Contractor, "id">) =>
    apiPost<Contractor>("contractors", { id: `ct${Date.now()}`, ...data }),
  update: (id: string, data: Partial<Contractor>) => apiPatch<Contractor>("contractors", id, data),
};

export const costsApi = {
  list: (params?: Record<string, string>) => apiFetch<CostEntry>("cost_entries", params),
  create: (data: Omit<CostEntry, "id">) =>
    apiPost<CostEntry>("cost_entries", { id: `ce${Date.now()}`, ...data }),
};

export const attendanceApi = {
  list: (params?: Record<string, string>) => apiFetch<AttendanceEntry>("attendance", params),
  create: (data: Omit<AttendanceEntry, "id">) =>
    apiPost<AttendanceEntry>("attendance", { id: `at${Date.now()}`, ...data }),
  update: (id: string, data: Partial<AttendanceEntry>) =>
    apiPatch<AttendanceEntry>("attendance", id, data),
};

export const pettyCashApi = {
  list: () => apiFetch<PettyCashEntry>("petty_cash"),
  create: (data: Omit<PettyCashEntry, "id">) =>
    apiPost<PettyCashEntry>("petty_cash", { id: `pc${Date.now()}`, ...data }),
  update: (id: string, data: Partial<PettyCashEntry>) =>
    apiPatch<PettyCashEntry>("petty_cash", id, data),
};
