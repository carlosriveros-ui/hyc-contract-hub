import type {
  User, Contract, Site, Activity, Material, Movement,
  Contractor, CostEntry, AttendanceEntry, PettyCashEntry
} from "@/types";

export const users: User[] = [
  { id: "u1", name: "Carlos Riveros", email: "carlos@hyc.co", role: "admin" },
  { id: "u2", name: "Andrea Méndez", email: "andrea@hyc.co", role: "coordinador", contractIds: ["c1"] },
  { id: "u3", name: "Alexander Espinosa", email: "alex@hyc.co", role: "tecnico", siteIds: ["s1","s2","s3","s4","s5","s6"] },
  { id: "u4", name: "Miguel Tejedor", email: "miguel@hyc.co", role: "tecnico", siteIds: ["s7","s8","s9","s10","s11","s12"] },
  { id: "u5", name: "Harold Castro", email: "harold@hyc.co", role: "tecnico", siteIds: ["s13","s14","s15","s16","s17"] },
  { id: "u6", name: "Ismael Manjarrés", email: "ismael@hyc.co", role: "tecnico", siteIds: ["s18","s19","s20","s21"] },
  { id: "u7", name: "Nicolás Rodríguez", email: "nicolas@hyc.co", role: "tecnico", siteIds: ["s22","s23"] },
  { id: "u8", name: "Jorge Ramírez", email: "jorge@hyc.co", role: "conductor" },
  { id: "u9", name: "Conjunto Virrey Solís", email: "admin@virreysolis.co", role: "cliente", contractIds: ["c1"] },
];

export const contracts: Contract[] = [
  {
    id: "c1",
    clientName: "Conjunto Residencial Virrey Solís",
    nit: "900.123.456-7",
    contactName: "María López",
    contactPhone: "+57 310 555 0123",
    totalValue: 1_480_000_000,
    monthlyBudget: 55_000_000,
    startDate: "2025-02-04",
    endDate: "2027-02-04",
    coordinatorId: "u2",
    status: "activo",
    sitesCount: 40,
  },
];

const generateSites = (): Site[] => {
  const out: Site[] = [];
  // Torre A pisos 1-12 — 12 unidades (simplificado)
  for (let i = 1; i <= 12; i++) {
    const tech = i <= 6 ? "u3" : "u4";
    out.push({
      id: `s${i}`,
      contractId: "c1",
      name: `Torre A — Apto ${i}01`,
      address: `Cra 50 #122-${i}5, Bogotá`,
      technicianId: tech,
      status: "activa",
    });
  }
  // Torre B pisos 1-9 — 9 unidades
  for (let i = 1; i <= 9; i++) {
    const tech = i <= 5 ? "u5" : "u6";
    out.push({
      id: `s${12 + i}`,
      contractId: "c1",
      name: `Torre B — Apto ${i}01`,
      address: `Cra 50 #122-${i}5, Bogotá`,
      technicianId: tech,
      status: i === 3 ? "mantenimiento" : "activa",
    });
  }
  // Zonas comunes
  out.push({ id: "s22", contractId: "c1", name: "Zonas Comunes — Lobby", address: "Cra 50 #122-50", technicianId: "u7", status: "activa" });
  out.push({ id: "s23", contractId: "c1", name: "Zonas Comunes — Salón Social", address: "Cra 50 #122-50", technicianId: "u7", status: "activa" });
  return out;
};

export const sites: Site[] = generateSites();

const today = new Date().toISOString().slice(0, 10);

export const activities: Activity[] = [
  { id: "a1", contractId: "c1", siteId: "s1", description: "Pintura de muros sala", type: "Pintura", technicianId: "u3", scheduledDate: today, status: "ejecucion" },
  { id: "a2", contractId: "c1", siteId: "s2", description: "Resane de fisuras techo", type: "Resane", technicianId: "u3", scheduledDate: today, status: "completada" },
  { id: "a3", contractId: "c1", siteId: "s7", description: "Cambio luminaria pasillo", type: "Eléctrico", technicianId: "u4", scheduledDate: today, status: "programada" },
  { id: "a4", contractId: "c1", siteId: "s13", description: "Limpieza tanques de agua", type: "Tanques", technicianId: "u5", scheduledDate: today, status: "completada" },
  { id: "a5", contractId: "c1", siteId: "s18", description: "Mantenimiento canales aguas lluvias", type: "Canales", technicianId: "u6", scheduledDate: today, status: "ejecucion" },
  { id: "a6", contractId: "c1", siteId: "s22", description: "Pintura lobby principal", type: "Pintura", technicianId: "u7", scheduledDate: today, status: "recibida" },
  { id: "a7", contractId: "c1", siteId: "s3", description: "Reparación grifería baño", type: "Plomería", technicianId: "u3", scheduledDate: today, status: "solicitada" },
  { id: "a8", contractId: "c1", siteId: "s8", description: "Revisión extintores piso 7", type: "Extintores", technicianId: "u4", scheduledDate: today, status: "observacion" },
  { id: "a9", contractId: "c1", siteId: "s5", description: "Aplicación segunda mano pintura", type: "Pintura", technicianId: "u3", scheduledDate: today, status: "completada" },
  { id: "a10", contractId: "c1", siteId: "s10", description: "Cambio sifón cocina", type: "Plomería", technicianId: "u4", scheduledDate: today, status: "programada" },
];

// Generate counts to reach the spec's numbers
export const monthlyActivityCounts = {
  completadas: 32,
  enProceso: 8,
  pendientes: 5,
  recibidas: 28,
};

export const materials: Material[] = [
  { id: "m1", name: "Pintura Vinilo Tipo 1 Blanco", unit: "Galón", category: "Pinturas", stock: 28, minStock: 15 },
  { id: "m2", name: "Pintura Vinilo Tipo 1 Beige", unit: "Galón", category: "Pinturas", stock: 12, minStock: 15 },
  { id: "m3", name: "Estuco listo", unit: "Kilo", category: "Pinturas", stock: 80, minStock: 30 },
  { id: "m4", name: "Bombillo LED 9W", unit: "Unidad", category: "Eléctrico", stock: 45, minStock: 20 },
  { id: "m5", name: "Cinta aislante", unit: "Rollo", category: "Eléctrico", stock: 8, minStock: 10 },
  { id: "m6", name: "Tubo PVC 1/2\"", unit: "Metro", category: "Plomería", stock: 0, minStock: 10 },
  { id: "m7", name: "Sifón cocina", unit: "Unidad", category: "Plomería", stock: 6, minStock: 5 },
  { id: "m8", name: "Brocha 4\"", unit: "Unidad", category: "Herramientas", stock: 14, minStock: 8 },
  { id: "m9", name: "Rodillo felpa", unit: "Unidad", category: "Herramientas", stock: 22, minStock: 10 },
  { id: "m10", name: "Lija agua #320", unit: "Pliego", category: "Otros", stock: 60, minStock: 25 },
];

export const movements: Movement[] = [
  { id: "mv1", type: "entrada", materialId: "m1", qty: 20, origin: "Proveedor Pinturas SA", destination: "Bodega central", userId: "u8", date: new Date().toISOString() },
  { id: "mv2", type: "despacho", materialId: "m1", qty: 5, origin: "Bodega central", destination: "Torre A — Apto 101", userId: "u8", date: new Date(Date.now()-3600_000).toISOString() },
  { id: "mv3", type: "entrega", materialId: "m1", qty: 5, origin: "Bodega central", destination: "Alexander Espinosa", userId: "u8", date: new Date(Date.now()-1800_000).toISOString() },
  { id: "mv4", type: "devolucion", materialId: "m8", qty: 2, origin: "Torre B — Apto 301", destination: "Bodega central", userId: "u5", date: new Date(Date.now()-7200_000).toISOString() },
  { id: "mv5", type: "despacho", materialId: "m4", qty: 12, origin: "Bodega central", destination: "Torre A — Apto 701", userId: "u8", date: new Date(Date.now()-5400_000).toISOString() },
];

export const contractors: Contractor[] = [
  {
    id: "ct1", name: "Viviana González", workType: "Pintura", contractId: "c1",
    totalValue: 6_200_000, paid: 4_000_000, progress: 65,
    nextMilestone: "Entrega pisos 5-8 Torre B — 28 abr", status: "proceso",
  },
  {
    id: "ct2", name: "Alexander Espinosa", workType: "Fachada", contractId: "c1",
    totalValue: 18_500_000, paid: 1_000_000, progress: 40,
    nextMilestone: "Resane fachada frontal — 5 may", status: "proceso",
  },
  {
    id: "ct3", name: "Sanitec Ltda", workType: "Tanques", contractId: "c1",
    totalValue: 3_800_000, paid: 3_800_000, progress: 100,
    nextMilestone: "Próxima inspección: ago 2026", status: "esperando_recibo",
  },
  {
    id: "ct4", name: "Extincol", workType: "Extintores", contractId: "c1",
    totalValue: 2_400_000, paid: 0, progress: 25,
    nextMilestone: "Recarga 8 extintores — 30 abr", status: "observacion",
  },
];

export const costEntries: CostEntry[] = [
  { id: "ce1", date: "2026-04-02", contractId: "c1", category: "Nómina", provider: "Nómina abril Q1", description: "Nómina técnicos Q1", value: 14_250_000, paymentType: "Nómina", reference: "NOM-2026-04-01" },
  { id: "ce2", date: "2026-04-15", contractId: "c1", category: "Nómina", provider: "Nómina abril Q2", description: "Nómina técnicos Q2", value: 14_250_000, paymentType: "Nómina", reference: "NOM-2026-04-02" },
  { id: "ce3", date: "2026-04-05", contractId: "c1", category: "Pintura", provider: "Pinturas Cóndor", description: "Pintura blanco x 30 galones", value: 5_400_000, paymentType: "PSE", reference: "FAC-001234" },
  { id: "ce4", date: "2026-04-18", contractId: "c1", category: "Pintura", provider: "Viviana González", description: "Pago parcial pintura Torre B", value: 2_800_000, paymentType: "DP", reference: "DP-9821" },
  { id: "ce5", date: "2026-04-08", contractId: "c1", category: "Fachada", provider: "Alexander Espinosa", description: "Anticipo fachada frontal", value: 6_000_000, paymentType: "DP", reference: "DP-9810" },
  { id: "ce6", date: "2026-04-12", contractId: "c1", category: "Transportes", provider: "Coopebombas", description: "Combustible volqueta abril", value: 2_100_000, paymentType: "Efectivo", reference: "REC-447" },
  { id: "ce7", date: "2026-04-20", contractId: "c1", category: "Materiales", provider: "Ferretería La 80", description: "Material plomería y eléctrico", value: 1_800_000, paymentType: "PSE", reference: "FAC-7782" },
  { id: "ce8", date: "2026-04-22", contractId: "c1", category: "Caja Menor", provider: "Varios", description: "Reembolso caja menor abril", value: 950_000, paymentType: "CA", reference: "CM-2026-04" },
  { id: "ce9", date: "2026-04-25", contractId: "c1", category: "Otros", provider: "Servientrega", description: "Envío documentos cliente", value: 650_000, paymentType: "Efectivo", reference: "GUI-9981" },
];

export const attendance: AttendanceEntry[] = [
  { id: "at1", technicianId: "u3", date: today, siteId: "s1", checkIn: "08:14" },
  { id: "at2", technicianId: "u4", date: today, siteId: "s7", checkIn: "07:58" },
  { id: "at3", technicianId: "u5", date: today, siteId: "s13", checkIn: "08:32" },
  { id: "at4", technicianId: "u6", date: today, siteId: "s18", checkIn: "08:05" },
];

export const pettyCash: PettyCashEntry[] = [
  { id: "pc1", userId: "u3", amount: 45_000, description: "Taxi materiales urgentes", date: "2026-04-22", status: "aprobado" },
  { id: "pc2", userId: "u4", amount: 28_000, description: "Almuerzo equipo Torre A", date: "2026-04-23", status: "pendiente" },
  { id: "pc3", userId: "u5", amount: 65_000, description: "Compra cinta aislante x 5", date: "2026-04-23", status: "pendiente" },
  { id: "pc4", userId: "u7", amount: 18_000, description: "Bolsas industriales", date: "2026-04-21", status: "aprobado" },
  { id: "pc5", userId: "u6", amount: 32_000, description: "Limpieza extra zonas comunes", date: "2026-04-19", status: "rechazado" },
];

// Helpers
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getSite = (id: string) => sites.find((s) => s.id === id);
export const getContract = (id: string) => contracts.find((c) => c.id === id);
export const getMaterial = (id: string) => materials.find((m) => m.id === id);
