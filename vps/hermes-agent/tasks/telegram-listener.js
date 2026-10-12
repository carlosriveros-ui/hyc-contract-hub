const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = parseInt(process.env.TELEGRAM_CHAT_ID);

export function startTelegramListener(runAgent) {
  if (!TOKEN || !CHAT_ID) {
    console.log('[telegram] Sin token/chatId, listener desactivado');
    return;
  }

  let offset = 0;

  async function poll() {
    try {
      const resp = await fetch(
        `https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${offset}&timeout=30&allowed_updates=${encodeURIComponent('["message"]')}`,
        { signal: AbortSignal.timeout(35000) }
      );
      const data = await resp.json();

      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const msg = update.message;
          if (!msg?.text || msg.chat.id !== CHAT_ID) continue;
          if (msg.text.startsWith('/')) continue;

          console.log(`[telegram] Carlos: ${msg.text.slice(0, 80)}`);
          runAgent(
            `${msg.text}\n\nEnvía tu respuesta por Telegram al usuario.`,
            { source: 'telegram-direct' }
          ).catch((err) => console.error('[telegram] Error agente:', err.message));
        }
      }
    } catch (err) {
      if (!err.message?.includes('abort') && !err.message?.includes('timeout')) {
        console.error('[telegram] Error polling:', err.message);
      }
    }

    setTimeout(poll, 1000);
  }

  poll();
  console.log('[telegram] ✅ Escuchando mensajes entrantes de Carlos...');
}
