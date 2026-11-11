# Agenda de reuniones (tipo Calendly)

Página pública: **`/agendar`** (o `/agendar/<tipo>`, p. ej. `/agendar/reunion`).
Panel: **`/agenda`** (solo admin).

## Qué hace

- Página con tu marca (paleta de `videos/marcas.json`; Carlos Riveros por defecto, HYC opcional).
- Flujo de 4 pasos: tipo de reunión → día y hora → datos → confirmación.
- La hora se muestra en la zona horaria del invitado (la detecta y se puede cambiar).
- **Sin cruces**: antes de ofrecer y otra vez al confirmar revisa Google Calendar,
  otros calendarios ICS (Samsung/Outlook/iCloud) y tus reservas. La base de datos
  además impide guardar dos reservas que se crucen.
- Crea el evento en tu Google Calendar con enlace de Google Meet e invita al cliente.
- Avisos: confirmación, recordatorio 24 h antes, recordatorio 1 h antes, reprogramación
  y cancelación, por **correo** (con archivo .ics) y **WhatsApp**. A ti te llega aviso de cada reserva.
- El cliente puede reprogramar o cancelar con su enlace personal.
- Reglas: franjas por día, descanso entre reuniones, anticipación mínima, días hacia adelante,
  máximo por día, días bloqueados (vacaciones, festivos).

## Configuración (una vez)

### 1. Base de datos
Supabase › SQL Editor › ejecutar `supabase/agenda.sql`.

### 2. Clave del panel
En Vercel › Settings › Environment Variables:

| Variable | Valor |
|---|---|
| `AGENDA_ADMIN_KEY` | una clave larga inventada por ti (se pide al abrir `/agenda`) |
| `AGENDA_PUBLIC_URL` | `https://hyc-contract-hub.vercel.app` (o tu dominio) |
| `CRON_SECRET` | otra clave larga (protege los recordatorios) |

### 3. Google Calendar
1. [console.cloud.google.com](https://console.cloud.google.com) › nuevo proyecto › habilitar **Google Calendar API**.
2. Pantalla de consentimiento OAuth: tipo "Externo", agrégate como usuario de prueba
   (o publícala para que el permiso no venza a los 7 días).
3. Credenciales › ID de cliente OAuth › "Aplicación web".
   URI de redirección: `https://hyc-contract-hub.vercel.app/api/agenda?action=google-callback`
4. En Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5. En `/agenda` › Conexiones › **Conectar Google Calendar**.

Opcionales: `GOOGLE_CALENDAR_ID` (dónde se crean los eventos, por defecto `primary`) y
`GOOGLE_BUSY_CALENDARS` (lista separada por comas de calendarios a revisar, p. ej. `primary,obra@group.calendar.google.com`).

### 4. Samsung Calendar
Samsung Calendar no publica un enlace propio. Opciones:
- **Recomendado:** en el teléfono, Calendario Samsung › Ajustes › Calendarios: deja como
  predeterminado tu calendario de **Google**. Lo que agendes ahí ya lo ve la agenda.
- Si usas Outlook/Exchange o iCloud en el Samsung: copia el enlace ICS privado de ese calendario
  y ponlo en `AGENDA_ICS_URLS` (varios separados por coma). Los eventos marcados como "libre"
  y los de todo el día no bloquean.
- Eventos guardados solo "en el teléfono" o en la cuenta Samsung no son accesibles desde internet:
  muévelos a Google.

### 5. Correos (Resend)
1. [resend.com](https://resend.com) › verifica tu dominio.
2. En Vercel: `RESEND_API_KEY`, `AGENDA_EMAIL_FROM` (p. ej. `Carlos Riveros <agenda@tudominio.com>`),
   opcional `AGENDA_EMAIL_REPLY_TO`.
3. En `/agenda` › Marca y textos: escribe tu correo para los avisos.

### 6. WhatsApp (Meta Cloud API)
WhatsApp solo permite mensajes automáticos con **plantillas aprobadas**.
1. [developers.facebook.com](https://developers.facebook.com) › app tipo Business › WhatsApp.
   Registra un número (no puede ser el que usas en la app de WhatsApp normal).
2. En Vercel: `WHATSAPP_TOKEN` (token permanente de usuario del sistema) y `WHATSAPP_PHONE_ID`.
3. Crea estas plantillas (categoría *Utilidad*, idioma *Español*), con las variables en este orden:

**`agenda_confirmacion`**
> Hola {{1}}, tu reunión "{{2}}" quedó confirmada para el {{3}}.
> Dónde: {{4}}
> Si necesitas reprogramar o cancelar: {{5}}

**`agenda_recordatorio`**
> Hola {{1}}, te recordamos tu reunión "{{2}}" {{3}}: {{4}}.
> Dónde: {{5}}

**`agenda_aviso_dueno`**
> Nueva reserva: {{1}} agendó "{{2}}" para el {{3}}. Contacto: {{4}}

**`agenda_cancelacion`**
> Hola {{1}}, tu reunión "{{2}}" del {{3}} fue cancelada. Puedes elegir otra fecha aquí: {{4}}

Si WhatsApp no está configurado, todo sigue funcionando por correo y el cliente ve un botón para escribirte por wa.me.

### 7. Recordatorios puntuales
Vercel corre `/api/cron/agenda-reminders` una vez al día (8 a. m.). Para que el de **1 hora antes**
salga a tiempo, prográmalo cada 10 minutos con Supabase (al final de `supabase/agenda.sql`
está el comando de `pg_cron`) o con [cron-job.org](https://cron-job.org) usando el encabezado
`Authorization: Bearer <CRON_SECRET>`. Es seguro llamarlo muchas veces: no repite mensajes.

## Archivos

| Archivo | Qué es |
|---|---|
| `src/lib/agenda/` | Lógica compartida: horarios, zonas horarias, ICS, textos, tema de marca (con pruebas) |
| `src/pages/agendar/` | Página pública y gestión de reserva |
| `src/pages/admin/Agenda.tsx` | Panel |
| `api/agenda.ts` | API (pública y admin, por `?action=`) |
| `api/_lib/agenda-server.ts` | Supabase, Google, Resend, WhatsApp |
| `api/cron/agenda-reminders.ts` | Recordatorios |
| `supabase/agenda.sql` | Tablas |

Prueba local de la API: `npx vercel dev` (el `dev-server.js` no incluye la agenda).
