# CONTEXT.md — HYC Contract Hub

> Este archivo es para iniciar una sesión nueva con Claude y tener contexto completo del proyecto sin leer el historial de chat.
> **Actualizado:** 2026-05-25

---

## ¿Qué es este proyecto?

**HYC Contract Hub** (también llamado internamente **MantHYC**) es un sistema web de gestión de contratos de mantenimiento para **HYC Proyectos**, empresa colombiana. Lo administra **Carlos Riveros**.

El sistema maneja: contratos con clientes, sedes (ubicaciones físicas), actividades de mantenimiento, inventario de materiales, contratistas, control de costos, asistencia de personal y caja menor.

Adicionalmente tiene un módulo **Marca Personal** que genera contenido LinkedIn usando Claude AI.

---

## Stack Técnico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing:** React Router v6
- **Data fetching:** TanStack Query (React Query) + fetch directo en `useEffect`
- **Backend:** Vercel Serverless Functions (`api/*.ts` → Node.js lambdas)
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** Context propio en `src/context/AuthContext.tsx` — no usa Supabase Auth, solo lee tabla `app_users`
- **AI:** Anthropic Claude SDK (`@anthropic-ai/sdk`) — solo en serverless
- **Excel:** `xlsx` npm package — importador de datos en el browser
- **Hosting:** Vercel
- **Cron:** Vercel Cron Jobs (`vercel.json`)

---

## URLs y Proyecto

| Recurso | URL |
|---|---|
| App en producción | `https://hyc-contract-hub.vercel.app` |
| Vercel team | `carlosriveros-1571s-projects` |
| Supabase project | `xlfnsmaoblhxkxpyhqrs.supabase.co` |
| GitHub repo | `carlosriveros-ui/hyc-contract-hub` |
| Rama principal | `main` |

---

## Variables de Entorno (Vercel Dashboard)

```
VITE_SUPABASE_URL         # URL pública de Supabase
VITE_SUPABASE_ANON_KEY    # Clave pública (safe en frontend)
SUPABASE_SERVICE_KEY      # service_role key — SOLO en serverless
ANTHROPIC_API_KEY         # Claude API — SOLO en serverless
```

> ⚠️ **SECURITY NOTE:** La `ANTHROPIC_API_KEY` fue compartida en el chat en una sesión anterior. Debe regenerarse en console.anthropic.com.

---

## Estructura de Archivos Clave

```
hyc-contract-hub/
├── api/
│   ├── data.ts                  # Endpoint CRUD genérico para todas las tablas
│   ├── generate-content.ts      # Genera contenido LinkedIn con Claude
│   ├── library.ts               # Librería de contenido guardado
│   ├── trending.ts              # RSS feed de tendencias
│   └── cron/
│       └── daily-content.ts     # Cron job diario (7am COT)
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Auth basado en tabla app_users
│   ├── components/
│   │   ├── AppShell.tsx         # Layout wrapper con sidebar
│   │   ├── AppSidebar.tsx       # Sidebar con nav por rol
│   │   ├── RequireAuth.tsx      # Protección de rutas por rol
│   │   ├── KpiCard.tsx          # Tarjeta de métrica
│   │   ├── BrandLogo.tsx        # Logo HYC
│   │   └── Avatar.tsx           # Avatar con iniciales
│   ├── lib/
│   │   ├── dataService.ts       # Capa de servicio tipada (API calls)
│   │   ├── format.ts            # formatCOP, formatDate, timeProgress
│   │   ├── contentAI.ts         # Helpers para módulo Marca Personal
│   │   └── libraryService.ts    # Servicio de librería de contenido
│   ├── pages/
│   │   ├── Index.tsx            # Router por rol → dashboard correcto
│   │   ├── Login.tsx            # Pantalla de login
│   │   ├── admin/
│   │   │   ├── DashboardAdmin.tsx      # Dashboard principal (KPIs reales)
│   │   │   ├── ContractsList.tsx       # Lista de contratos
│   │   │   ├── ContractDetail.tsx      # Detalle de contrato + sedes
│   │   │   ├── ActivitiesCoordinator.tsx # Gestión de actividades
│   │   │   ├── MaterialsWarehouse.tsx  # Inventario y movimientos
│   │   │   ├── Contractors.tsx         # Lista de contratistas
│   │   │   ├── CostsControl.tsx        # Control de costos
│   │   │   ├── Attendance.tsx          # Registro de asistencia
│   │   │   ├── PettyCash.tsx           # Caja menor
│   │   │   ├── DataImport.tsx          # Importador Excel → Supabase
│   │   │   └── MarcaPersonal/          # Módulo contenido LinkedIn
│   │   │       ├── index.tsx
│   │   │       ├── ContentGenerator.tsx
│   │   │       ├── ContentLibrary.tsx
│   │   │       ├── ContentCalendar.tsx
│   │   │       └── TrendingFeed.tsx
│   │   ├── technician/
│   │   │   └── TechnicianHome.tsx      # ⚠️ Aún usa datos mock
│   │   ├── driver/
│   │   │   └── DriverHome.tsx          # ⚠️ Aún usa datos mock
│   │   └── client/
│   │       └── ClientPortal.tsx        # ⚠️ Aún usa datos mock
│   ├── types/
│   │   └── index.ts             # Interfaces TypeScript (Contract, Site, etc.)
│   └── App.tsx                  # Routes + Providers
├── supabase-schema.sql          # Schema PostgreSQL completo con seed data
├── vercel.json                  # Cron config + rewrites
└── CONTEXT.md                   # Este archivo
```

---

## Base de Datos — Tablas Supabase

> Todas las columnas camelCase van con comillas dobles en SQL: `"contractId"`, `"clientName"`, etc.

### `app_users`
```sql
id, name, email, role, "contractIds"[], "siteIds"[]
```
Roles: `admin | coordinador | tecnico | conductor | cliente`

### `contracts`
```sql
id, "clientName", nit, "totalValue", "monthlyBudget",
"startDate", "endDate", status, "coordinatorId",
"sitesCount", "paymentType", "nextMilestone"
```

### `sites`
```sql
id, "contractId", name, address, status, "technicianId"
```

### `activities`
```sql
id, "siteId", type, description, status, priority,
"scheduledDate", "technicianId", "materialsUsed"[]
```
Status: `pendiente | en_proceso | completada | observacion | recibida`

### `materials`
```sql
id, name, category, stock, "minStock", unit, location
```

### `movements`
```sql
id, "materialId", type, qty, origin, destination, "userId", date
```
Type: `entrada | despacho | entrega | devolucion`

### `contractors`
```sql
id, name, nit, contact, phone, email, "workType", status, rating
```

### `cost_entries`
```sql
id, "contractId", category, description, amount, date, "userId"
```

### `attendance`
```sql
id, "userId", "siteId", date, "checkIn", "checkOut", status, notes
```

### `petty_cash`
```sql
id, "userId", description, amount, category, date,
receipt, status, "approvedBy"
```
Status: `pendiente | aprobado | rechazado`

---

## Endpoint API Principal

### `/api/data` — CRUD genérico

```
GET    /api/data?table=contracts
GET    /api/data?table=sites&contractId=abc123
GET    /api/data?table=attendance&date=2026-05-25
POST   /api/data        body: { table, ...fields }
PATCH  /api/data        body: { table, id, ...fields }
DELETE /api/data?table=contracts&id=abc123
```

- Todos los parámetros de query (excepto `table` e `id`) se convierten en filtros `.eq()`
- Tablas permitidas (whitelist): `app_users, contracts, sites, activities, materials, movements, contractors, cost_entries, attendance, petty_cash`
- Usa `SUPABASE_SERVICE_KEY` para acceso completo

---

## Capa de Servicio — `src/lib/dataService.ts`

```typescript
contractsApi.list()           → GET /api/data?table=contracts
contractsApi.get(id)          → GET /api/data?table=contracts&id=...
contractsApi.create(data)     → POST /api/data { table: "contracts", ...data }
contractsApi.update(id, data) → PATCH /api/data { table: "contracts", id, ...data }

sitesApi.list({ contractId })
activitiesApi.list({ siteId?, technicianId? }), .create(), .update()
materialsApi.list(), .update()
movementsApi.list(), .create()
contractorsApi.list(), .create(), .update()
costsApi.list({ contractId? }), .create()
attendanceApi.list({ date?, userId? }), .create(), .update()
pettyCashApi.list({ userId? }), .create(), .update()
usersApi.list()
```

---

## Sistema de Auth

`AuthContext` lee credenciales del `localStorage` (o hardcoded en dev).
El login busca en la tabla `app_users` por email+password.
No usa JWT ni Supabase Auth — solo compara campos en la tabla.

Usuarios de prueba (creados con el schema SQL):
```
admin@hyc.co          / admin123     → admin
coord@hyc.co          / coord123     → coordinador
tecnico@hyc.co        / tec123       → tecnico
conductor@hyc.co      / cond123      → conductor
cliente@bancolombia.co / cliente123  → cliente
```

---

## Módulo Marca Personal (LinkedIn AI)

- **ContentGenerator** → `POST /api/generate-content` → Claude `claude-opus-4-5`
- **TrendingFeed** → `GET /api/trending` → parsea RSS de Feedly/Google News
- **ContentLibrary** → `GET /api/library` → lee KV store de Vercel o archivos JSON
- **ContentCalendar** → vista de calendario con contenido programado
- **Cron** → `POST /api/cron/daily-content` → se ejecuta diario a las 12:00 UTC (7am COT)

---

## Importador de Datos Excel (`/importar`)

Flujo de 4 pasos:
1. **Upload** — arrastra o selecciona `.xlsx/.xls/.csv`
2. **Mapeo** — auto-detección de columnas por nombres en español/inglés; ajuste manual con `<Select>`
3. **Preview** — tabla con primeras 8 filas transformadas
4. **Import** — barra de progreso, fila por fila via `POST /api/data`

Módulos:
- `cost_entries` — fecha, descripción, monto, categoría, contrato
- `materials` — nombre, categoría, stock, mínimo, unidad
- `contractors` — nombre, NIT, contacto, teléfono, email
- `activities` — sede, tipo, descripción, fecha programada, técnico

Parseo de fechas: fechas Excel (seriales), "Abril 2026", "04/2026", "2026-04-01", "DD/MM/YYYY"
Parseo de números: remueve `$`, `.` (miles), `,` → `.` decimal

---

## Estado Actual (2026-05-25)

### ✅ Funcionando en producción
- Dashboard admin con KPIs reales de Supabase
- Contratos: lista + detalle con sedes + crear nuevo contrato
- Actividades: lista + filtros + crear + cambiar estado (recibida/observacion)
- Materiales: inventario + timeline de movimientos
- Contratistas: lista (solo lectura)
- Costos: lista + gráfico mensual
- Asistencia: lista filtrada por fecha
- Caja menor: lista + aprobar/rechazar gastos
- Importador Excel → Supabase (4 módulos)
- Marca Personal: generador LinkedIn + librería + tendencias + cron diario

### ⚠️ Pendiente / En construcción
- **Form "Registrar Costo"** — botón existe pero sin dialog real
- **Form "Nuevo Contratista"** — botón existe pero sin dialog real
- **Módulo Nómina** — mencionado por usuario pero sin tabla dedicada (va a `cost_entries`)
- **Vista Gantt** — usuario quiere ver actividades programadas en Gantt por mes
- **Páginas de otros roles** — `TechnicianHome`, `DriverHome`, `ClientPortal` aún usan datos mock
- **Reportes** — ruta existe pero muestra "Próximamente"
- **Configuración** — ruta existe pero muestra "Próximamente"

---

## Comandos Git

```bash
git status
git add src/...
git commit -m "descripción del cambio"
git push origin main
# → Vercel hace auto-deploy en ~30 segundos
```

---

## Convenciones de Código

- **Páginas de admin**: patrón `useState + useEffect + Promise.all` para cargar datos
- **Skeletons**: mostrar mientras `loading === true`
- **Toast**: usar `toast.error()` / `toast.success()` de `sonner`
- **Optimistic updates**: actualizar estado local inmediatamente después del PATCH exitoso
- **Helpers locales**: `getUser(id)`, `getSite(id)`, `getMaterial(id)` como `.find()` sobre arrays cargados
- **camelCase** en TypeScript y en columnas Supabase (con comillas dobles en SQL)
- **Formato moneda**: `formatCOP(value)` de `src/lib/format.ts`
- **Formato fecha**: `formatDate(dateStr)` de `src/lib/format.ts`

---

## Cómo Continuar una Sesión

1. Lee este archivo (`CONTEXT.md`) para entender el proyecto
2. Lee `src/lib/dataService.ts` para entender las APIs disponibles
3. Lee la página específica que vas a modificar
4. Si vas a crear un nuevo módulo, sigue el patrón de `PettyCash.tsx` (el más completo y reciente)
5. Haz deploy con `git push origin main`

---

*Este documento fue generado automáticamente al cierre de la sesión de migración a Supabase.*
