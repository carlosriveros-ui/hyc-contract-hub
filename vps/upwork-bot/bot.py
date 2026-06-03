import asyncio
import logging
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, CallbackQueryHandler, ContextTypes
)
from database import init_db, job_exists, save_job, update_job_status, get_job, get_weekly_stats
from scraper import UpworkScraper
from proposals import generate_proposal

logger = logging.getLogger('upwork-bot')

class UpworkTelegramBot:
    def __init__(self):
        self.token = os.environ['TELEGRAM_BOT_TOKEN']
        self.chat_id = int(os.environ['TELEGRAM_CHAT_ID'])
        self.scraper = UpworkScraper(
            email=os.environ['UPWORK_EMAIL'],
            password=os.environ['UPWORK_PASSWORD'],
        )
        self.app = Application.builder().token(self.token).build()
        self._setup_handlers()

    def _setup_handlers(self):
        self.app.add_handler(CommandHandler('start', self._cmd_start))
        self.app.add_handler(CommandHandler('status', self._cmd_status))
        self.app.add_handler(CommandHandler('check', self._cmd_check_now))
        self.app.add_handler(CommandHandler('report', self._cmd_weekly_report))
        self.app.add_handler(CallbackQueryHandler(self._handle_callback))

    async def _cmd_start(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            '🤖 *Upwork Bot HYC — Carlos Riveros*\n\n'
            'Comandos disponibles:\n'
            '/check — verificar jobs ahora\n'
            '/report — reporte semanal\n'
            '/status — estado del bot',
            parse_mode='Markdown'
        )

    async def _cmd_status(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        stats = await get_weekly_stats()
        await update.message.reply_text(
            f'📊 *Estado Upwork Bot*\n\n'
            f'Última semana:\n'
            f'• Jobs encontrados: {stats["total"]}\n'
            f'• Aplicaciones enviadas: {stats["applied"]}\n'
            f'• Skipeados: {stats["skipped"]}\n'
            f'• Score promedio: {stats["avg_score"]}\n'
            f'• Mejor score: {stats["max_score"]}\n\n'
            f'⏰ Verifica cada 30 minutos automáticamente',
            parse_mode='Markdown'
        )

    async def _cmd_check_now(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text('🔍 Verificando Upwork ahora...')
        await self.check_new_jobs()

    async def _cmd_weekly_report(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await self.send_weekly_report()

    async def check_new_jobs(self):
        logger.info('Verificando nuevos jobs en Upwork...')
        try:
            # Obtener IDs ya vistos
            # (simplificado: en producción cargar desde DB)
            jobs = await self.scraper.get_new_jobs(seen_ids=set())

            new_count = 0
            for job in jobs:
                if await job_exists(job['id']):
                    continue
                await save_job(job)
                await self._send_job_alert(job)
                new_count += 1
                await asyncio.sleep(2)

            if new_count == 0:
                logger.info('No hay jobs nuevos que cumplan los filtros')
            else:
                logger.info(f'{new_count} jobs nuevos enviados a Telegram')

        except Exception as e:
            logger.error(f'Error en check_new_jobs: {e}')
            await self.app.bot.send_message(
                chat_id=self.chat_id,
                text=f'⚠️ Error verificando Upwork: {str(e)[:200]}'
            )

    async def _send_job_alert(self, job: dict):
        rating_stars = '⭐' * int(job.get('client_rating', 0))
        score = job.get('score', 0)
        score_emoji = '🔥' if score >= 40 else '✅' if score >= 25 else '📋'

        text = (
            f'{score_emoji} *Nuevo Job — Score {score}/60*\n\n'
            f'📌 *{job["title"]}*\n\n'
            f'💰 Budget: `{job["budget"]}`\n'
            f'👥 Applicants: `{job.get("applicants", "?")}`\n'
            f'⭐ Client rating: `{job.get("client_rating", "?")}` {rating_stars}\n'
            f'✅ Payment: `{"Verified" if job.get("payment_verified") else "Not verified"}`\n\n'
            f'📝 _{job.get("description", "")[:200]}..._\n\n'
            f'🔗 [Ver en Upwork]({job["url"]})'
        )

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton('🚀 Aplicar', callback_data=f'apply_{job["id"]}'),
                InlineKeyboardButton('⏭️ Skip', callback_data=f'skip_{job["id"]}'),
                InlineKeyboardButton('👁️ Ver', url=job['url']),
            ]
        ])

        await self.app.bot.send_message(
            chat_id=self.chat_id,
            text=text,
            parse_mode='Markdown',
            reply_markup=keyboard,
            disable_web_page_preview=True,
        )

    async def _handle_callback(self, update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        data = query.data
        action, job_id = data.split('_', 1)

        if action == 'apply':
            await query.edit_message_text(
                f'{query.message.text}\n\n⏳ _Generando propuesta con Claude..._',
                parse_mode='Markdown'
            )
            job = await get_job(job_id)
            if not job:
                await query.edit_message_text('❌ Job no encontrado en la base de datos.')
                return

            try:
                proposal = await generate_proposal(job)
                await update_job_status(job_id, 'applied', proposal)

                # Envía la propuesta en un mensaje separado
                await self.app.bot.send_message(
                    chat_id=self.chat_id,
                    text=(
                        f'✍️ *Propuesta generada para:*\n_{job["title"]}_\n\n'
                        f'```\n{proposal}\n```\n\n'
                        f'📋 Cópiala y pégala en Upwork: [Abrir job]({job["url"]})'
                    ),
                    parse_mode='Markdown',
                    disable_web_page_preview=True,
                )

                await query.edit_message_reply_markup(
                    InlineKeyboardMarkup([[
                        InlineKeyboardButton('✅ Aplicado', callback_data=f'done_{job_id}'),
                        InlineKeyboardButton('👁️ Ver', url=job['url']),
                    ]])
                )

            except Exception as e:
                logger.error(f'Error generando propuesta: {e}')
                await query.edit_message_text(f'❌ Error generando propuesta: {str(e)[:200]}')

        elif action == 'skip':
            await update_job_status(job_id, 'skipped')
            await query.edit_message_reply_markup(
                InlineKeyboardMarkup([[
                    InlineKeyboardButton('⏭️ Skipeado', callback_data='noop'),
                ]])
            )

    async def send_weekly_report(self):
        stats = await get_weekly_stats()
        text = (
            f'📊 *Reporte Semanal — Upwork Bot HYC*\n'
            f'_{self._week_range()}_\n\n'
            f'🔍 Jobs encontrados: *{stats["total"]}*\n'
            f'🚀 Propuestas enviadas: *{stats["applied"]}*\n'
            f'⏭️ Skipeados: *{stats["skipped"]}*\n'
            f'📈 Score promedio: *{stats["avg_score"]}*\n'
            f'🏆 Mejor score: *{stats["max_score"]}*\n\n'
            f'💡 Tasa de aplicación: '
            f'*{round(stats["applied"] / max(stats["total"], 1) * 100)}%*'
        )
        await self.app.bot.send_message(
            chat_id=self.chat_id,
            text=text,
            parse_mode='Markdown',
        )

    def _week_range(self) -> str:
        from datetime import datetime, timedelta
        today = datetime.now()
        start = today - timedelta(days=7)
        return f'{start.strftime("%d/%m")} – {today.strftime("%d/%m/%Y")}'

    async def run(self):
        await init_db()
        logger.info('Bot iniciado, esperando mensajes...')
        await self.app.initialize()
        await self.app.start()
        await self.app.updater.start_polling(drop_pending_updates=True)
        # Mantener vivo
        while True:
            await asyncio.sleep(3600)
