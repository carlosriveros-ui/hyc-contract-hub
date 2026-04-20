export type Role = "admin" | "coordinador" | "tecnico" | "conductor" | "cliente";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  contractIds?: string[]; // for coordinador / cliente
  siteIds?: string[];     // for tecnico
}

export interface Contract {
  id: string;
  clientName: string;
  nit: string;
  contactName: string;
  contactPhone: string;
  totalValue: number;
  monthlyBudget: number;
  startDate: string; // ISO
  endDate: string;
  coordinatorId: string;
  status: "activo" | "negociacion" | "vencido";
  sitesCount: number;
}

export interface Site {
  id: string;
  contractId: string;
  name: string;
  address: string;
  technicianId?: string;
  status: "activa" | "mantenimiento" | "cerrada";
}

export type ActivityStatus =
  | "solicitada"
  | "programada"
  | "ejecucion"
  | "completada"
  | "recibida"
  | "observacion";

export interface Activity {
  id: string;
  contractId: string;
  siteId: string;
  description: string;
  type: string;
  technicianId?: string;
  scheduledDate: string;
  status: ActivityStatus;
  photos?: string[];
  observations?: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  category: "Pinturas" | "Eléctrico" | "Plomería" | "Herramientas" | "Otros";
  stock: number;
  minStock: number;
}

export interface Movement {
  id: string;
  type: "entrada" | "despacho" | "entrega" | "devolucion";
  materialId: string;
  qty: number;
  origin: string;
  destination: string;
  userId: string;
  date: string;
}

export interface Contractor {
  id: string;
  name: string;
  workType: "Pintura" | "Fachada" | "Fumigación" | "Tanques" | "Extintores" | "Canales" | "Avisos";
  contractId: string;
  totalValue: number;
  paid: number;
  progress: number;
  nextMilestone: string;
  status: "proceso" | "completado" | "observacion" | "esperando_recibo";
}

export interface CostEntry {
  id: string;
  date: string;
  contractId: string;
  category: string;
  provider: string;
  description: string;
  value: number;
  paymentType: "DP" | "PSE" | "CA" | "Efectivo" | "Nómina";
  reference: string;
}

export interface AttendanceEntry {
  id: string;
  technicianId: string;
  date: string;
  siteId: string;
  checkIn?: string;
  checkOut?: string;
}

export interface PettyCashEntry {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: string;
  status: "pendiente" | "aprobado" | "rechazado";
}
