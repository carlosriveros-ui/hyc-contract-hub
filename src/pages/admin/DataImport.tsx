import { AppShell } from "@/components/AppShell";
import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RefreshCw, ChevronDown,
} from "lucide-react";

// ─── Module definitions ───────────────────────────────────────────────────────

type FieldDef = {
  key: string;
  label: string;
  required: boolean;
  hints: string[];        // common column names in Spanish
  transform?: (v: unknown) => unknown;
};

type ModuleDef = {
  label: string;
  table: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  idPrefix: string;
};

const cleanNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$\s.]/g, "").replace(",", ".");
  return parseFloat(s) || 0;
};

const cleanDate = (v: unknown): string => {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  // "abril 2026", "abr 2026", "04/2026", "2026-04"
  const monthNames: Record<string, string> = {
    enero: "01", ene: "01", jan: "01",
    febrero: "02", feb: "02",
    marzo: "03", mar: "03",
    abril: "04", abr: "04", apr: "04",
    mayo: "05", may: "05",
    junio: "06", jun: "06",
    julio: "07", jul: "07",
    agosto: "08", ago: "08", aug: "08",
    septiembre: "09", sep: "09",
    octubre: "10", oct: "10",
    noviembre: "11", nov: "11",
    diciembre: "12", dic: "12", dec: "12",
  };
  const lc = s.toLowerCase();
  for (const [name, num] of Object.entries(monthNames)) {
    if (lc.includes(name)) {
      const yearMatch = s.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
      return `${year}-${num}-01`;
    }
  }
  if (/^\d{2}\/\d{4}$/.test(s)) return `${s.slice(3)}-${s.slice(0, 2)}-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
};

const MODULES: Record<string, ModuleDef> = {
  cost_entries: {
    label: "Costos & Gastos",
    table: "cost_entries",
    icon: "💰",
    color: "bg-primary/10 text-primary border-primary/30",
    idPrefix: "imp-ce",
    fields: [
      { key: "date", label: "Fecha", required: true, hints: ["fecha", "date", "dia", "fecha pago", "fecha factura"], transform: cleanDate },
      { key: "category", label: "Categoría", required: true, hints: ["categoria", "tipo", "rubro", "concepto tipo"] },
      { key: "provider", label: "Proveedor", required: true, hints: ["proveedor", "contratista", "empresa", "quien", "nombre"] },
      { key: "description", label: "Descripción", required: false, hints: ["descripcion", "concepto", "detalle", "observacion", "nota"] },
      { key: "value", label: "Valor (COP)", required: true, hints: ["valor", "monto", "total", "importe", "costo", "precio", "vr"], transform: cleanNumber },
      { key: "paymentType", label: "Tipo de pago", required: false, hints: ["tipo pago", "forma pago", "modalidad", "metodo"] },
      { key: "reference", label: "Referencia / Factura", required: false, hints: ["referencia", "factura", "ref", "numero", "no.", "comprobante"] },
    ],
    defaults: { contractId: "c1" },
  },
  materials: {
    label: "Materiales & Inventario",
    table: "materials",
    icon: "📦",
    color: "bg-info/10 text-info border-info/30",
    idPrefix: "imp-m",
    fields: [
      { key: "name", label: "Nombre del material", required: true, hints: ["material", "nombre", "descripcion", "articulo", "item", "producto"] },
      { key: "unit", label: "Unidad", required: true, hints: ["unidad", "um", "und", "u/m", "medida"] },
      { key: "category", label: "Categoría", required: false, hints: ["categoria", "tipo", "grupo", "familia"] },
      { key: "stock", label: "Stock actual", required: true, hints: ["stock", "cantidad", "existencia", "saldo", "inventario", "actual"], transform: cleanNumber },
      { key: "minStock", label: "Stock mínimo", required: false, hints: ["minimo", "stock min", "punto reorden", "minstock"], transform: cleanNumber },
    ],
    defaults: { minStock: 0 },
  },
  contractors: {
    label: "Contratistas",
    table: "contractors",
    icon: "👷",
    color: "bg-warning/10 text-warning border-warning/30",
    idPrefix: "imp-ct",
    fields: [
      { key: "name", label: "Nombre / Empresa", required: true, hints: ["nombre", "contratista", "empresa", "razon social"] },
      { key: "workType", label: "Tipo de trabajo", required: false, hints: ["tipo", "trabajo", "especialidad", "actividad", "labor"] },
      { key: "totalValue", label: "Valor del contrato", required: true, hints: ["valor", "total", "contrato", "vr contrato", "importe"], transform: cleanNumber },
      { key: "paid", label: "Valor pagado", required: false, hints: ["pagado", "pago", "abono", "cancelado", "vr pagado"], transform: cleanNumber },
      { key: "progress", label: "Avance (%)", required: false, hints: ["avance", "progreso", "%", "porcentaje", "completado"], transform: (v) => Math.min(100, Math.round(cleanNumber(v))) },
      { key: "nextMilestone", label: "Próximo hito", required: false, hints: ["hito", "siguiente", "proximo", "entrega", "milestone"] },
      { key: "status", label: "Estado", required: false, hints: ["estado", "status", "situacion"] },
    ],
    defaults: { contractId: "c1", status: "proceso", paid: 0, progress: 0 },
  },
  activities: {
    label: "Actividades / Cronograma",
    table: "activities",
    icon: "📋",
    color: "bg-success/10 text-success border-success/30",
    idPrefix: "imp-a",
    fields: [
      { key: "description", label: "Descripción / Actividad", required: true, hints: ["actividad", "descripcion", "trabajo", "tarea", "item", "labor"] },
      { key: "type", label: "Tipo de trabajo", required: false, hints: ["tipo", "especialidad", "categoria", "clase"] },
      { key: "scheduledDate", label: "Fecha / Mes programado", required: false, hints: ["fecha", "mes", "periodo", "programado", "cuando", "inicio"], transform: cleanDate },
      { key: "siteId", label: "Sede / Unidad (nombre o código)", required: false, hints: ["sede", "unidad", "apto", "apartamento", "zona", "lugar", "ubicacion"] },
      { key: "technicianId", label: "Técnico (nombre)", required: false, hints: ["tecnico", "responsable", "quien", "asignado", "ejecutor"] },
      { key: "status", label: "Estado", required: false, hints: ["estado", "status"] },
    ],
    defaults: { contractId: "c1", status: "programada", observations: "" },
  },
};

// ─── Auto-detect column mapping ────────────────────────────────────────────────

function autoDetect(headers: string[], fields: FieldDef[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of fields) {
    const match = headers.find((h) =>
      field.hints.some((hint) => h.toLowerCase().includes(hint))
    );
    if (match) map[field.key] = match;
  }
  return map;
}

// ─── Main component ────────────────────────────────────────────────────────────

type ImportRow = Record<string, unknown>;
type ImportResult = { ok: number; errors: string[] };

export default function DataImport() {
  const [moduleKey, setModuleKey] = useState<string>("cost_entries");
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [rawRows, setRawRows] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const module = MODULES[moduleKey];

  const readSheet = useCallback((wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
    if (rows.length === 0) { toast.error("La hoja está vacía"); return; }
    const hdrs = Object.keys(rows[0]);
    setHeaders(hdrs);
    setRawRows(rows);
    setMapping(autoDetect(hdrs, MODULES[moduleKey].fields));
    setStep("map");
  }, [moduleKey]);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Solo se aceptan archivos .xlsx, .xls o .csv");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        setWorkbook(wb);
        const names = wb.SheetNames;
        setSheets(names);
        setActiveSheet(names[0]);
        readSheet(wb, names[0]);
      } catch {
        toast.error("No se pudo leer el archivo");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [readSheet]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const transformRow = (row: ImportRow, mod: ModuleDef, map: Record<string, string>): Record<string, unknown> => {
    const result: Record<string, unknown> = {
      id: `${mod.idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...mod.defaults,
    };
    for (const field of mod.fields) {
      const col = map[field.key];
      if (col && row[col] !== undefined && row[col] !== "") {
        result[field.key] = field.transform ? field.transform(row[col]) : String(row[col]).trim();
      }
    }
    return result;
  };

  const handleImport = async () => {
    const requiredMissing = module.fields
      .filter((f) => f.required && !mapping[f.key])
      .map((f) => f.label);
    if (requiredMissing.length > 0) {
      toast.error(`Faltan columnas obligatorias: ${requiredMissing.join(", ")}`);
      return;
    }

    setStep("importing");
    setProgress(0);
    const errors: string[] = [];
    let ok = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const body = transformRow(rawRows[i], module, mapping);
      try {
        const res = await fetch(`/api/data?table=${module.table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error" }));
          errors.push(`Fila ${i + 2}: ${err.error ?? "Error desconocido"}`);
        } else {
          ok++;
        }
      } catch {
        errors.push(`Fila ${i + 2}: Error de red`);
      }
      setProgress(Math.round(((i + 1) / rawRows.length) * 100));
    }

    setResult({ ok, errors });
    setStep("done");
    if (ok > 0) toast.success(`${ok} registros importados correctamente`);
    if (errors.length > 0) toast.error(`${errors.length} filas con error`);
  };

  const reset = () => {
    setStep("upload");
    setRawRows([]); setHeaders([]); setMapping({});
    setResult(null); setProgress(0); setSheets([]); setWorkbook(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const previewRows = rawRows.slice(0, 8);
  const mappedFields = module.fields.filter((f) => mapping[f.key]);

  return (
    <AppShell title="Importar Datos" subtitle="Carga información desde archivos Excel (.xlsx, .xls, .csv)">
      <div className="max-w-4xl space-y-6">

        {/* Module selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(MODULES).map(([key, mod]) => (
            <button
              key={key}
              onClick={() => { setModuleKey(key); reset(); }}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                moduleKey === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-surface"
              )}
            >
              <span className="text-2xl">{mod.icon}</span>
              <p className={cn("text-xs font-semibold mt-1.5 leading-tight", moduleKey === key ? "text-primary" : "text-foreground")}>
                {mod.label}
              </p>
            </button>
          ))}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="font-semibold text-foreground mb-1">Arrastra tu Excel aquí</p>
            <p className="text-sm text-muted-foreground mb-4">o haz clic para buscar — .xlsx, .xls, .csv</p>
            <Button variant="outline" size="sm" type="button">
              <Upload className="w-4 h-4 mr-2" /> Seleccionar archivo
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Sheet selector (if multiple) */}
        {step !== "upload" && sheets.length > 1 && (
          <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border">
            <span className="text-sm font-medium text-muted-foreground shrink-0">Hoja:</span>
            <div className="flex gap-2 flex-wrap">
              {sheets.map((s) => (
                <button key={s}
                  onClick={() => { setActiveSheet(s); if (workbook) readSheet(workbook, s); }}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                    activeSheet === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Map columns */}
        {(step === "map" || step === "preview") && (
          <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">
                Mapear columnas <span className="text-muted-foreground font-normal text-sm">— {rawRows.length} filas detectadas</span>
              </h2>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Cambiar archivo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {module.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {mapping[field.key] && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                  </label>
                  <Select
                    value={mapping[field.key] ?? "__none__"}
                    onValueChange={(v) =>
                      setMapping((prev) => {
                        const next = { ...prev };
                        if (v === "__none__") delete next[field.key]; else next[field.key] = v;
                        return next;
                      })
                    }
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="— no mapear —" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— no mapear —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Ej: {field.hints.slice(0, 3).join(", ")}</p>
                </div>
              ))}
            </div>

            <Button
              variant="brand"
              className="w-full gap-2"
              onClick={() => setStep("preview")}
              disabled={module.fields.filter((f) => f.required && !mapping[f.key]).length > 0}
            >
              Vista previa <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold">Vista previa — primeras {previewRows.length} filas de {rawRows.length}</h2>
              <Badge className={module.color}>{module.label}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    {mappedFields.map((f) => (
                      <th key={f.key} className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const transformed = transformRow(row, module, mapping);
                    return (
                      <tr key={i} className="border-t border-border hover:bg-muted/20">
                        {mappedFields.map((f) => (
                          <td key={f.key} className="px-3 py-2 text-foreground max-w-[200px] truncate">
                            {String(transformed[f.key] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="outline" onClick={() => setStep("map")} className="gap-1.5">
                <ChevronDown className="w-4 h-4 rotate-90" /> Ajustar mapeo
              </Button>
              <Button variant="brand" onClick={handleImport} className="flex-1 gap-2">
                <Upload className="w-4 h-4" /> Importar {rawRows.length} registros a Supabase
              </Button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="bg-surface rounded-xl border border-border p-8 text-center space-y-4">
            <RefreshCw className="w-10 h-10 mx-auto text-primary animate-spin" />
            <p className="font-semibold text-foreground">Importando {rawRows.length} registros...</p>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{progress}% completado</p>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && result && (
          <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              {result.errors.length === 0
                ? <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                : result.ok > 0
                  ? <AlertTriangle className="w-8 h-8 text-warning shrink-0" />
                  : <XCircle className="w-8 h-8 text-destructive shrink-0" />
              }
              <div>
                <p className="font-bold text-foreground text-lg">
                  {result.ok > 0 ? `${result.ok} registros importados` : "Sin registros importados"}
                </p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-muted-foreground">{result.errors.length} filas con error</p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-destructive mb-2">Errores:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive font-mono">{e}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1 gap-1.5">
                <Upload className="w-4 h-4" /> Importar otro archivo
              </Button>
              <Button
                variant="brand"
                className="flex-1 gap-1.5"
                onClick={() => {
                  const paths: Record<string, string> = {
                    cost_entries: "/costos", materials: "/materiales",
                    contractors: "/contratistas", activities: "/actividades",
                  };
                  window.location.href = paths[moduleKey] ?? "/";
                }}
              >
                Ver en la app <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Field guide */}
        {step === "upload" && (
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-3 text-sm">Columnas esperadas para <span className="text-primary">{module.label}</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {module.fields.map((f) => (
                <div key={f.key} className="flex items-start gap-2 text-xs">
                  <span className={cn("shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
                    f.required ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  )}>
                    {f.required ? "REQ" : "OPC"}
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">{f.label}</span>
                    <span className="text-muted-foreground"> — Ej: {f.hints.slice(0, 2).join(", ")}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              * Las columnas se detectan automáticamente por nombre. Si no coinciden, puedes mapearlas manualmente en el siguiente paso.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
