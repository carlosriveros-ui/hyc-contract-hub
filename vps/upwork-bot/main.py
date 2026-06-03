#!/usr/bin/env python3
"""
Upwork Bot — HYC Proyectos de Ingeniería SAS
Busca jobs de Construction PM en Upwork cada 30 min y genera propuestas con Claude AI.
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from bot import UpworkTelegramBot

load_dotenv('/opt/upwork-bot/.env')

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    level=logging.INFO,
)
logger = logging.getLogger('upwork-main')


async def main():
    logger.info('═══════════════════════════════════════')
    logger.info('  Upwork Bot — HYC Proyectos  ')
    logger.info('═══════════════════════════════════════')

    bot = UpworkTelegramBot()

    scheduler = AsyncIOScheduler(timezone='America/Bogota')

    # Cada 30 minutos — verificar nuevos jobs
    interval = int(os.environ.get('CHECK_INTERVAL_MINUTES', 30))
    scheduler.add_job(
        bot.check_new_jobs,
        'interval',
        minutes=interval,
        id='check_jobs',
        misfire_grace_time=120,
    )

    # Lunes a las 8am COT — reporte semanal
    scheduler.add_job(
        bot.send_weekly_report,
        'cron',
        day_of_week='mon',
        hour=8,
        minute=0,
        id='weekly_report',
    )

    scheduler.start()
    logger.info(f'Scheduler activo: check cada {interval} min | reporte semanal lunes 8am COT')

    # Primera verificación al arrancar (después de 10s para que el bot esté listo)
    async def first_check():
        await asyncio.sleep(10)
        logger.info('Primera verificación de jobs...')
        await bot.check_new_jobs()

    asyncio.create_task(first_check())

    await bot.run()


if __name__ == '__main__':
    asyncio.run(main())
