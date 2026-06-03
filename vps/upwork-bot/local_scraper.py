"""
Scraper local para Windows — usa IP de casa, sin bloqueo de Cloudflare.
El navegador corre visible: si la sesión expiró, el usuario puede loguearse.
"""
import asyncio
import logging
import re
import hashlib
import json
import os
from playwright.async_api import async_playwright

logger = logging.getLogger('upwork-scraper')

CONSTRUCTION_KEYWORDS = [
    'construction', 'project manager', 'site manager', 'superintendent',
    'contractor', 'civil', 'building', 'renovation', 'remodel',
    'infrastructure', 'facilities', 'maintenance', 'structural',
    'general contractor', 'foreman', 'estimator', 'project management',
    'architect', 'engineer', 'schedule', 'procurement', 'subcontractor',
]

FIND_WORK_URLS = [
    'https://www.upwork.com/nx/find-work/best-matches',
    'https://www.upwork.com/nx/find-work/most-recent',
]

COOKIES_PATH = os.environ.get('COOKIES_PATH', 'cookies.json')


def score_job(job: dict) -> int:
    score = 0
    text = (job.get('title', '') + ' ' + job.get('description', '')).lower()
    kw_hits = sum(1 for kw in CONSTRUCTION_KEYWORDS if kw.lower() in text)
    score += min(kw_hits * 3, 21)
    rating = job.get('client_rating', 0)
    if rating >= 4.8: score += 10
    elif rating >= 4.4: score += 5
    apps = job.get('applicants', 99)
    if apps <= 5: score += 10
    elif apps <= 10: score += 7
    elif apps <= 15: score += 4
    if job.get('payment_verified'): score += 5
    nums = re.findall(r'\d+', job.get('budget', '').replace(',', ''))
    if nums:
        b = int(nums[-1])
        if b >= 5000: score += 10
        elif b >= 1000: score += 5
        elif b >= 500: score += 2
    return score


class UpworkScraper:
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
        self._browser = None
        self._context = None

    async def get_new_jobs(self, seen_ids: set) -> list[dict]:
        all_jobs = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--start-maximized',
                ],
            )
            context = await browser.new_context(
                viewport={'width': 1280, 'height': 720},
                user_agent=(
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) '
                    'Chrome/124.0.0.0 Safari/537.36'
                ),
            )

            # Load saved cookies
            await self._load_cookies(context)

            page = await context.new_page()

            # Check session
            await page.goto(
                'https://www.upwork.com/nx/find-work/best-matches',
                wait_until='domcontentloaded', timeout=30000,
            )
            await asyncio.sleep(3)

            # If redirected to login, wait for user to authenticate
            if 'login' in page.url or 'sign-in' in page.url:
                logger.info('Sesión expirada — esperando autenticación manual...')
                await page.goto('https://www.upwork.com/login', wait_until='domcontentloaded')
                try:
                    await page.wait_for_url('**/find-work/**', timeout=300000)
                    logger.info('✅ Autenticado!')
                    await self._save_cookies(context)
                except Exception:
                    logger.error('Timeout esperando autenticación (5 min)')
                    await browser.close()
                    return []

            # Scrape find-work pages — CF no bloquea estas en IP de casa
            for url in FIND_WORK_URLS:
                jobs = await self._scrape_feed(page, url, seen_ids)
                for j in jobs:
                    if j['id'] not in {x['id'] for x in all_jobs}:
                        all_jobs.append(j)
                await asyncio.sleep(3)

            # Minimize instead of close so user can see it
            try:
                await page.evaluate('window.blur()')
            except Exception:
                pass
            await browser.close()

        logger.info(f'Total jobs válidos: {len(all_jobs)}')
        return all_jobs

    async def _scrape_feed(self, page, url: str, seen_ids: set) -> list[dict]:
        label = url.split('/')[-1]
        logger.info(f'Cargando find-work/{label}...')

        captured = []

        async def on_response(response):
            ct = response.headers.get('content-type', '')
            if 'application/json' not in ct or 'upwork.com' not in response.url:
                return
            try:
                data = await response.json()
                if not isinstance(data, dict):
                    return
                d = data.get('data', {}) or {}
                has_jobs = any([
                    isinstance(data.get('results'), list),
                    isinstance(data.get('jobs'), list),
                    isinstance(d.get('results'), list),
                    isinstance(d.get('jobs'), list),
                    isinstance((d.get('jobSearch') or {}).get('results'), list),
                    isinstance((d.get('freelancerBestMatches') or {}).get('results'), list),
                    isinstance((d.get('recommendedJobs') or {}).get('results'), list),
                ])
                if has_jobs:
                    captured.append({'url': response.url, 'data': data})
                    alias = response.url.split('alias=')[-1].split('&')[0] if 'alias=' in response.url else label
                    logger.info(f'Job API capturada: [{alias}]')
            except Exception:
                pass

        page.on('response', on_response)

        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
        except Exception as e:
            logger.error(f'Error navegando: {e}')
            page.remove_listener('response', on_response)
            return []

        title = await page.title()
        logger.info(f'Pagina: "{title}"')

        if 'challenge' in title.lower() or 'just a moment' in title.lower():
            logger.warning(f'CF challenge — {title}')
            page.remove_listener('response', on_response)
            return []

        # Esperar que React monte y dispare el job feed
        try:
            await page.wait_for_load_state('networkidle', timeout=15000)
        except Exception:
            pass
        await asyncio.sleep(3)

        # Scroll para activar lazy load
        for _ in range(3):
            await page.mouse.wheel(0, 400)
            await asyncio.sleep(1)

        await asyncio.sleep(4)

        page.remove_listener('response', on_response)
        logger.info(f'APIs capturadas en {label}: {len(captured)}')

        for item in captured:
            jobs = self._parse(item['data'], seen_ids)
            if jobs:
                return jobs
        return []

    def _parse(self, data: dict, seen_ids: set) -> list[dict]:
        d = data if isinstance(data, dict) else {}
        nested = d.get('data', {}) or {}

        def edges(obj):
            return [e.get('node', e) for e in (obj.get('edges', []) if isinstance(obj, dict) else [])]

        jobs_list = (
            d.get('jobs') or d.get('results') or
            nested.get('jobs') or nested.get('results') or
            edges(nested.get('jobSearch', {}).get('jobs', {})) or
            (nested.get('jobSearch', {}) or {}).get('results') or
            (nested.get('freelancerBestMatches', {}) or {}).get('results') or
            []
        )
        if not jobs_list and isinstance(data, list):
            jobs_list = data
        if not jobs_list:
            logger.warning(f'No jobs. keys={list(d.keys())[:8]}')
            return []
        return self._build(jobs_list, seen_ids)

    def _build(self, jobs_list: list, seen_ids: set) -> list[dict]:
        min_score = int(os.environ.get('MIN_SCORE', 12))
        result = []
        for item in jobs_list[:20]:
            try:
                cipher = str(item.get('ciphertext') or item.get('id') or item.get('uid') or '')
                job_id = cipher.lstrip('~') or hashlib.md5(item.get('title', '').encode()).hexdigest()[:12]
                if not job_id or job_id in seen_ids:
                    continue
                client = item.get('client', {}) or {}
                rating = float(client.get('feedbackScore') or client.get('totalFeedback') or 0)
                proposals = item.get('proposalsTier', '') or ''
                applicants = 5
                if isinstance(proposals, str):
                    nums = re.findall(r'\d+', proposals)
                    if nums: applicants = int(nums[-1])
                raw_url = item.get('jobUrl') or item.get('url') or ''
                if raw_url and not raw_url.startswith('http'):
                    raw_url = f'https://www.upwork.com{raw_url}'
                if not raw_url:
                    raw_url = f'https://www.upwork.com/jobs/~{cipher}' if cipher else f'https://www.upwork.com/jobs/{job_id}'
                j = {
                    'id': job_id,
                    'title': item.get('title', '') or item.get('name', ''),
                    'url': raw_url,
                    'description': item.get('snippet', item.get('description', ''))[:500],
                    'budget': self._budget(item),
                    'client_rating': rating,
                    'applicants': applicants,
                    'payment_verified': client.get('paymentVerificationStatus') == 1,
                }
                j['score'] = score_job(j)
                if j['score'] >= min_score:
                    result.append(j)
                    logger.info(f'✅ score={j["score"]}: {j["title"][:60]}')
            except Exception as e:
                logger.debug(f'Error: {e}')
        return result

    def _budget(self, item: dict) -> str:
        jt = str(item.get('jobType', item.get('type', ''))).lower()
        if 'hourly' in jt:
            lo = item.get('hourlyBudgetMin', 0) or 0
            hi = item.get('hourlyBudgetMax', 0) or 0
            return f'${lo}-${hi}/hr' if lo and hi else 'Hourly'
        amount = 0
        for key in ('budget', 'amount', 'fixedPriceAmount'):
            val = item.get(key)
            if isinstance(val, dict):
                amount = val.get('amount') or val.get('min') or 0
                if amount: break
        return f'${int(amount):,}' if amount else 'Fixed price'

    async def _load_cookies(self, context):
        try:
            with open(COOKIES_PATH) as f:
                raw = json.load(f)
            ss_map = {'no_restriction': 'None', 'lax': 'Lax', 'strict': 'Strict', 'none': 'None', 'unspecified': 'Lax'}
            cookies = []
            for c in raw:
                ss = ss_map.get(str(c.get('sameSite', 'Lax')).lower(), 'Lax')
                ck = {
                    'name': c['name'], 'value': c['value'],
                    'domain': c.get('domain', '.upwork.com'),
                    'path': c.get('path', '/'),
                    'httpOnly': c.get('httpOnly', False),
                    'secure': c.get('secure', True),
                    'sameSite': ss,
                }
                if c.get('expirationDate'):
                    ck['expires'] = int(c['expirationDate'])
                cookies.append(ck)
            await context.add_cookies(cookies)
            logger.info(f'Cookies cargadas: {len(cookies)}')
        except FileNotFoundError:
            logger.info('Sin cookies previas — se pedirá login manual')
        except Exception as e:
            logger.warning(f'Error cargando cookies: {e}')

    async def _save_cookies(self, context):
        try:
            cookies = await context.cookies()
            with open(COOKIES_PATH, 'w') as f:
                json.dump(cookies, f, indent=2)
            logger.info(f'Cookies guardadas: {len(cookies)}')
        except Exception as e:
            logger.warning(f'Error guardando cookies: {e}')
