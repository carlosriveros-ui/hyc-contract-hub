export const notifyTools = [
  {
    name: 'send_telegram',
    description: 'Envía un mensaje de notificación por Telegram al administrador del sistema.',
    input_schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Mensaje a enviar. Soporta Markdown de Telegram.',
        },
        level: {
          type: 'string',
          enum: ['info', 'warning', 'error', 'success'],
          description: 'Nivel del mensaje — añade un emoji al inicio',
        },
      },
      required: ['message'],
    },
  },
];

const LEVEL_EMOJI = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '🚨',
  success: '✅',
};

export const notifyHandlers = {
  async send_telegram({ message, level = 'info' }) {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('[notify] Telegram no configurado, saltando notificación');
      return { sent: false, reason: 'TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados' };
    }

    const emoji = LEVEL_EMOJI[level] || 'ℹ️';
    const text = `${emoji} *Hermes Agent — HYC*\n\n${message}\n\n_${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} COT_`;

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
    return { sent: true, messageId: data.result.message_id };
  },
};
