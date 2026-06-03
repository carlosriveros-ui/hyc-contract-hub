#!/usr/bin/env python3
"""
Upwork Bot — modo LOCAL (Windows)
Corre en tu PC de casa: IP real, sin bloqueo Cloudflare.
El navegador se abre visible — si la sesión expiró, puedes loguearte.
"""
import asyncio
import logging
import os
import sys

# Usar scraper local (navegador visible, IP de casa) en vez del scraper VPS
import local_scraper as _local_scraper_module
sys.modules['scraper'] = _local_scraper_module

from dotenv import load_dotenv

# Carga .env desde la carpeta donde está este script
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from bot import UpworkTelegramBot

logging.basicConfig(
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(os.path.dirname(__file__), 'upwork-bot.log'),
            encoding='utf-8',
        ),
    ],
)
logger = logging.getLogger('upwork-local')


async def main():
    logger.info('═══════════════════════════════════════')
    logger.info('  Upwork Bot LOCAL — HYC Proyectos  ')
    logger.info('═══════════════════════════════════════')

    bot = UpworkTelegramBot()

    scheduler = AsyncIOScheduler(timezone='America/Bogota')

    interval = int(os.environ.get('CHECK_INTERVAL_MINUTES', 30))
    scheduler.add_job(
        bot.check_new_jobs,
        'interval',
        minutes=interval,
        id='check_jobs',
        misfire_grace_time=120,
    )

    scheduler.add_job(
        bot.send_weekly_report,
        'cron',
        day_of_week='mon',
        hour=8,
        minute=0,
        id='weekly_report',
    )

    scheduler.start()
    logger.info(f'Scheduler: check cada {interval} min | reporte semanal lunes 8am COT')

    async def first_check():
        await asyncio.sleep(10)
        logger.info('Primera verificación de jobs...')
        await bot.check_new_jobs()

    asyncio.create_task(first_check())

    await bot.run()


if __name__ == '__main__':
    asyncio.run(main())
