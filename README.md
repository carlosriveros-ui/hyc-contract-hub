# HYC Contract Hub — MantHYC

Sistema de gestión de contratos de mantenimiento para **HYC Proyectos** (Colombia).
Permite administrar contratos, sedes, actividades, materiales, contratistas, costos, asistencia y caja menor — con integración real a Supabase y despliegue en Vercel.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Routing | React Router v6 |
| Data fetching | TanStack Query (React Query) |
| Backend / API | Vercel Serverless Functions (`api/*.ts`) |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Context propio (`AuthContext`) — roles por tabla `app_users` |
| AI | Anthropic Claude (generación de contenido LinkedIn) |
| Excel | xlsx (npm) — importador de datos |
| Hosting | Vercel — `hyc-contract-hub.vercel.app` |
| Cron | Vercel Cron Jobs — contenido automático 7am Colombia |

---

## Módulos del Sistema

### Módulos Admin (Supabase real)
| Ruta | Página | Tabla Supabase |
|---|---|---|
| `/` | Dashboard | contracts, sites, activities, cost_entries, attendance, materials |
| `/contratos` | Contratos & Sedes | contracts, app_users |
| `/contratos/:id` | Detalle Contrato | contracts, sites, app_users |
| `/actividades` | Actividades | activities, sites, app_users, materials |
| `/materiales` | Materiales & Bodega | materials, movements, app_users |
| `/contratistas` | Contratistas | contractors |
| `/costos` | Control de Costos | cost_entries |
| `/asistencia` | Asistencia | attendance, app_users, sites |
| `/caja-menor` | Caja Menor | petty_cash, app_users |
| `/importar` | Importar Datos | Excel → cualquier tabla |
| `/reportes` | Reportes | (próximamente) |
| `/marca-personal` | Marca Personal | Anthropic + RSS |
| `/configuracion` | Configuración | (próximamente) |

### Otros roles
- **Coordinador**: contratos, actividades, materiales, costos, asistencia, caja menor
- **Técnico**: "Mi día" + "Mis gastos"
- **Conductor**: despachos + bodega
- **Cliente**: sedes + solicitudes

---

## Variables de Entorno (Vercel)

```
VITE_SUPABASE_URL=https://xlfnsmaoblhxkxpyhqrs.supabase.co
VITE_SUPABASE_ANON_KEY=...           # clave pública (frontend)
SUPABASE_SERVICE_KEY=...             # service_role (solo serverless)
ANTHROPIC_API_KEY=...                # Claude AI (solo serverless)
```

> **Nunca** exponer `SUPABASE_SERVICE_KEY` ni `ANTHROPIC_API_KEY` en el frontend.

---

## Setup Local

```bash
# Instalar dependencias
npm install

# Variables de entorno
cp .env.example .env.local
# Editar con tus claves de Supabase y Anthropic

# Desarrollo local
npm run dev

# Build
npm run build
```

---

## Base de Datos (Supabase)

El schema completo está en `supabase-schema.sql`. Ejecutar en el SQL Editor de Supabase para crear las 10 tablas con datos de ejemplo.

**Tablas:**
- `app_users` — usuarios del sistema con roles
- `contracts` — contratos con cliente, valor, fechas
- `sites` — sedes por contrato
- `activities` — actividades/solicitudes por sede
- `materials` — inventario de materiales
- `movements` — entradas/despachos/devoluciones
- `contractors` — empresas contratistas
- `cost_entries` — gastos y costos por contrato
- `attendance` — registro de asistencia diaria
- `petty_cash` — caja menor (gastos menores)

Todas las columnas camelCase usan comillas dobles en PostgreSQL (ej: `"contractId"`, `"clientName"`).

---

## API Serverless

### `GET/POST/PATCH/DELETE /api/data`
Endpoint genérico CRUD para todas las tablas. Parámetros de query se convierten en filtros `.eq()`.

### `POST /api/generate-content`
Genera contenido LinkedIn usando Claude AI.

### `GET /api/trending`
RSS feed de tendencias del sector construcción.

### `GET /api/library`
Librería de contenido generado.

### `POST /api/cron/daily-content`
Generación automática diaria (Vercel Cron, 7am COT).

---

## Importador de Datos Excel

Ruta `/importar` — sube archivos `.xlsx`, `.xls`, `.csv` y mapea columnas automáticamente a las tablas de Supabase. Módulos disponibles:

- **Costos/Gastos** → `cost_entries`
- **Materiales/Inventario** → `materials`
- **Contratistas** → `contractors`
- **Actividades/Nómina** → `activities`

---

## Despliegue

Rama `main` → auto-deploy en Vercel.

```bash
git push origin main
```

Vercel URL: `https://hyc-contract-hub.vercel.app`
