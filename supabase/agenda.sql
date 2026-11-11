-- Agenda de reuniones (tipo Calendly) — ejecutar una vez en Supabase › SQL Editor.
-- Las tablas solo se leen/escriben desde las funciones de Vercel con SUPABASE_SERVICE_KEY.
-- RLS activo y sin políticas: la clave pública (anon) no puede leer datos de invitados.

create table if not exists agenda_settings (
  id text primary key default 'default',
  "ownerName" text not null default 'Carlos Riveros',
  "ownerTitle" text not null default 'Ingeniero · Gerencia de proyectos',
  headline text not null default 'Agenda una reunión',
  welcome text not null default '',
  brand text not null default 'carlos-riveros' check (brand in ('carlos-riveros', 'hyc')),
  timezone text not null default 'America/Bogota',
  "weeklyHours" jsonb not null default '{}'::jsonb,
  "bufferMinutes" int not null default 15,
  "minNoticeMinutes" int not null default 1440,
  "maxDaysAhead" int not null default 30,
  "dailyLimit" int not null default 4,
  "slotStepMinutes" int not null default 30,
  "blockedDates" text[] not null default '{}',
  "ownerWhatsapp" text not null default '',
  "ownerEmail" text not null default '',
  "updatedAt" timestamptz not null default now()
);

create table if not exists agenda_event_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  "durationMinutes" int not null check ("durationMinutes" between 5 and 480),
  "locationType" text not null default 'meet' check ("locationType" in ('meet', 'telefono', 'whatsapp', 'presencial')),
  "locationDetail" text not null default '',
  active boolean not null default true,
  "sortOrder" int not null default 0
);

create table if not exists agenda_bookings (
  id uuid primary key default gen_random_uuid(),
  "eventTypeId" uuid not null references agenda_event_types(id),
  "startAt" timestamptz not null,
  "endAt" timestamptz not null,
  "guestName" text not null,
  "guestEmail" text not null,
  "guestPhone" text not null default '',
  "guestCompany" text not null default '',
  "guestNotes" text not null default '',
  "guestTimezone" text not null default 'America/Bogota',
  "whatsappOptIn" boolean not null default true,
  status text not null default 'confirmada' check (status in ('confirmada', 'cancelada', 'reprogramada', 'asistio', 'no_asistio')),
  token text not null unique,
  "googleEventId" text,
  "meetUrl" text,
  "reminder24hAt" timestamptz,
  "reminder1hAt" timestamptz,
  "notifyLog" jsonb not null default '[]'::jsonb,
  "cancelReason" text,
  "createdAt" timestamptz not null default now(),
  check ("endAt" > "startAt"),
  -- Imposible guardar dos reservas confirmadas que se crucen, aunque lleguen al mismo tiempo.
  constraint agenda_no_overlap exclude using gist (tstzrange("startAt", "endAt") with &&) where (status = 'confirmada')
);

create index if not exists agenda_bookings_start_idx on agenda_bookings ("startAt");

-- Tokens de integraciones (refresh token de Google). Nunca se expone al navegador.
create table if not exists agenda_secrets (
  key text primary key,
  value text not null,
  "updatedAt" timestamptz not null default now()
);

alter table agenda_settings enable row level security;
alter table agenda_event_types enable row level security;
alter table agenda_bookings enable row level security;
alter table agenda_secrets enable row level security;

-- Datos iniciales (se pueden cambiar desde /agenda en la app).
insert into agenda_settings (id, welcome, "weeklyHours")
values (
  'default',
  'Elige el tipo de reunión, el día y la hora que mejor te funcionen. Recibirás la confirmación por correo y WhatsApp.',
  '{"1":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"17:00"}],
    "2":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"17:00"}],
    "3":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"17:00"}],
    "4":[{"start":"09:00","end":"12:00"},{"start":"14:00","end":"17:00"}],
    "5":[{"start":"09:00","end":"12:00"}]}'::jsonb
)
on conflict (id) do nothing;

insert into agenda_event_types (slug, title, description, "durationMinutes", "locationType", "sortOrder") values
  ('cafe-virtual', 'Café virtual', 'Conversación corta para conocernos y ver si puedo ayudarte.', 15, 'meet', 1),
  ('reunion', 'Reunión de trabajo', 'Revisamos tu proyecto, contrato o propuesta con calma.', 30, 'meet', 2),
  ('asesoria', 'Asesoría de proyecto', 'Sesión a fondo sobre planeación, costos o gerencia de tu proyecto.', 60, 'meet', 3)
on conflict (slug) do nothing;

-- ── Recordatorios cada 10 minutos (opcional, recomendado) ─────────────────────
-- El cron de Vercel corre una vez al día. Para recordatorios "1 hora antes" exactos,
-- activa pg_cron y pg_net en Supabase › Database › Extensions y ejecuta:
--
-- select cron.schedule('agenda-recordatorios', '*/10 * * * *', $$
--   select net.http_get(
--     url := 'https://hyc-contract-hub.vercel.app/api/cron/agenda-reminders',
--     headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET')
--   );
-- $$);
