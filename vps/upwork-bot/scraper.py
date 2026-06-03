import asyncio
import logging
import re
import hashlib
import json
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
try:
    from playwright_stealth import stealth_async
    HAS_STEALTH = True
except ImportError:
    HAS_STEALTH = False

logger = logging.getLogger('upwork-scraper')

CONSTRUCTION_KEYWORDS = [
    'construction', 'project manager', 'site manager', 'superintendent',
    'contractor', 'civil', 'building', 'renovation', 'remodel',
    'infrastructure', 'facilities', 'maintenance', 'structural',
    'general contractor', 'foreman', 'estimator', 'project management',
]

SEARCH_QUERIES = [
    'construction project manager',
    'construction PM',
    'site manager construction',
    'construction superintendent',
]

COOKIES_PATH = os.environ.get('COOKIES_PATH', '/opt/upwork-bot/cookies.json')


def score_job(job: dict) -> int:
    score = 0
    text = (job.get('title', '') + ' ' + job.get('description', '')).lower()

    kw_hits = sum(1 for kw in CONSTRUCTION_KEYWORDS if kw.lower() in text)
    score += min(kw_hits * 4, 20)

    rating = job.get('client_rating', 0)
    if rating >= 4.8:
        score += 10
    elif rating >= 4.4:
        score += 5

    apps = job.get('applicants', 99)
    if apps <= 5:
        score += 10
    elif apps <= 10:
        score += 7
    elif apps <= 15:
        score += 4

    if job.get('payment_verified'):
        score += 5

    budget_str = job.get('budget', '')
    budget_nums = re.findall(r'\d+', budget_str.replace(',', ''))
    if budget_nums:
        budget = int(budget_nums[-1])
        if budget >= 5000:
            score += 10
        elif budget >= 1000:
            score += 5
        elif budget >= 500:
            score += 2

    return score


class UpworkScraper:
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password

    async def get_new_jobs(self, seen_ids: set) -> list[dict]:
        jobs = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                ],
            )
            context = await browser.new_context(
                viewport={'width': 1366, 'height': 768},
                user_agent=(
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                ),
            )

            try:
                cookies_loaded = await self._load_cookies(context)
                if not cookies_loaded:
                    logger.error('No se pudo cargar cookies.json — abortando')
                    await browser.close()
                    return []

                page = await context.new_page()
                if HAS_STEALTH:
                    await stealth_async(page)
                    logger.info('Stealth mode activado')

                # Verify session is valid
                session_ok = await self._verify_session(page)
                if not session_ok:
                    logger.error('Sesión de cookies expirada o inválida')
                    await browser.close()
                    return []

                for query in SEARCH_QUERIES[:2]:
                    found = await self._search_jobs(page, query, seen_ids)
                    jobs.extend(found)
                    await asyncio.sleep(3)

            except Exception as e:
                logger.error(f'Error en scraping: {e}')
            finally:
                await browser.close()

        seen = set()
        unique = []
        for j in jobs:
            if j['id'] not in seen:
                seen.add(j['id'])
                unique.append(j)

        logger.info(f'Total jobs válidos: {len(unique)}')
        return unique

    async def _load_cookies(self, context) -> bool:
        try:
            with open(COOKIES_PATH) as f:
                raw = json.load(f)

            # Cookie Editor exports as list; each cookie needs 'name', 'value', 'domain'
            same_site_map = {
                'no_restriction': 'None',
                'lax': 'Lax',
                'strict': 'Strict',
                'none': 'None',
                'unspecified': 'Lax',
            }

            cookies = []
            for c in raw:
                raw_ss = str(c.get('sameSite', 'Lax')).lower()
                same_site = same_site_map.get(raw_ss, 'Lax')
                cookie = {
                    'name': c['name'],
                    'value': c['value'],
                    'domain': c.get('domain', '.upwork.com'),
                    'path': c.get('path', '/'),
                    'httpOnly': c.get('httpOnly', False),
                    'secure': c.get('secure', True),
                    'sameSite': same_site,
                }
                if c.get('expirationDate'):
                    cookie['expires'] = int(c['expirationDate'])
                cookies.append(cookie)

            await context.add_cookies(cookies)
            logger.info(f'Cookies cargadas: {len(cookies)} cookies de {COOKIES_PATH}')
            return True

        except FileNotFoundError:
            logger.error(f'No se encontró {COOKIES_PATH} — exporta cookies de tu browser')
            return False
        except Exception as e:
            logger.error(f'Error cargando cookies: {e}')
            return False

    async def _verify_session(self, page) -> bool:
        logger.info('Verificando sesión con cookies...')
        try:
            await page.goto(
                'https://www.upwork.com/nx/find-work/best-matches',
                wait_until='domcontentloaded',
                timeout=30000,
            )
            await asyncio.sleep(3)

            current_url = page.url
            if 'login' in current_url or 'account-security' in current_url:
                logger.warning(f'Redirigido al login — URL: {current_url}')
                return False

            logger.info(f'Sesión válida — URL: {current_url[:80]}')
            return True

        except Exception as e:
            logger.error(f'Error verificando sesión: {e}')
            return False

    async def _search_jobs(self, page, query: str, seen_ids: set) -> list[dict]:
        url = (
            f'https://www.upwork.com/nx/jobs/search/'
            f'?q={query.replace(" ", "+")}&sort=recency&per_page=20'
        )
        logger.info(f'Buscando: {query}')
        await page.goto(url, wait_until='domcontentloaded')

        # Wait for Cloudflare challenge to resolve if present
        title = await page.title()
        if 'just a moment' in title.lower():
            logger.info('Cloudflare challenge detectado, esperando hasta 20s...')
            try:
                await page.wait_for_function(
                    "document.title.toLowerCase().indexOf('just a moment') === -1",
                    timeout=20000,
                )
                logger.info('Challenge resuelto')
            except Exception:
                logger.warning('Challenge no resuelto a tiempo')
        await asyncio.sleep(4)

        jobs = []
        try:
            # Try selectors in order, use first that returns results
            selector_candidates = [
                '[data-test="job-tile-list"] section',
                'article[data-test="job-tile"]',
                '[data-test="job-tile"]',
                'section[data-test="job-tile"]',
                '.job-tile',
                '[data-job-uid]',
                'article',
            ]
            tiles = []
            for sel in selector_candidates:
                found = await page.query_selector_all(sel)
                if found:
                    logger.info(f'Selector "{sel}" → {len(found)} tiles')
                    tiles = found
                    break

            if not tiles:
                screenshot_path = f'/opt/upwork-bot/debug_search.png'
                await page.screenshot(path=screenshot_path, full_page=False)
                html_snippet = (await page.content())[:800]
                logger.warning(f'0 tiles. Screenshot: {screenshot_path}')
                logger.warning(f'HTML: {html_snippet}')

            logger.info(f'{len(tiles)} tiles para "{query}"')

            for tile in tiles[:15]:
                try:
                    job = await self._extract_job(tile)
                    if not job or job['id'] in seen_ids:
                        continue

                    job['score'] = score_job(job)

                    min_score = int(os.environ.get('MIN_SCORE', 20))
                    min_rating = float(os.environ.get('MIN_CLIENT_RATING', 4.0))
                    max_apps = int(os.environ.get('MAX_APPLICANTS', 15))

                    rating_ok = (
                        job.get('client_rating', 0) >= min_rating
                        or job.get('client_rating', 0) == 0.0
                    )
                    apps_ok = job.get('applicants', 5) <= max_apps
                    score_ok = job['score'] >= min_score

                    if rating_ok and apps_ok and score_ok:
                        jobs.append(job)
                        logger.info(
                            f'✅ Job válido (score={job["score"]}): {job["title"][:50]}'
                        )
                    else:
                        logger.debug(
                            f'❌ Filtrado: {job.get("title","")[:40]} '
                            f'(r={job.get("client_rating",0)}, '
                            f'a={job.get("applicants",0)}, '
                            f's={job["score"]})'
                        )
                except Exception as e:
                    logger.debug(f'Error extrayendo tile: {e}')

        except Exception as e:
            logger.error(f'Error en búsqueda: {e}')

        return jobs

    async def _extract_job(self, tile) -> dict | None:
        title_el = await tile.query_selector(
            'h2 a, [data-test="job-title"] a, h3 a, a[href*="/jobs/"]'
        )
        if not title_el:
            return None
        title = (await title_el.inner_text()).strip()
        href = await title_el.get_attribute('href')
        url = f'https://www.upwork.com{href}' if href and href.startswith('/') else href

        id_match = re.search(r'~([a-zA-Z0-9]+)', url or '')
        job_id = (
            id_match.group(1) if id_match
            else hashlib.md5((url or title).encode()).hexdigest()[:12]
        )

        desc_el = await tile.query_selector(
            '[data-test="job-description-text"], .job-description, [data-test="description"]'
        )
        description = (await desc_el.inner_text()).strip() if desc_el else ''

        budget_el = await tile.query_selector(
            '[data-test="budget"], [data-test="hourly-rate"], [data-test="job-type-label"]'
        )
        budget = (await budget_el.inner_text()).strip() if budget_el else 'No especificado'

        rating = 0.0
        rating_el = await tile.query_selector(
            '[data-test="client-rating"] .sr-only, .client-feedback'
        )
        if rating_el:
            nums = re.findall(r'[\d.]+', await rating_el.inner_text())
            rating = float(nums[0]) if nums else 0.0

        applicants = 5
        apps_els = await tile.query_selector_all(
            '[data-test="proposals-tier"] li, [data-test="proposals"]'
        )
        for el in apps_els:
            text = await el.inner_text()
            if 'proposal' in text.lower() or 'applicant' in text.lower():
                nums = re.findall(r'\d+', text)
                if nums:
                    applicants = int(nums[0])
                    break

        pay_badges = await tile.query_selector_all(
            '[data-test="payment-verified"], .payment-verified'
        )

        return {
            'id': job_id,
            'title': title,
            'url': url,
            'description': description[:500],
            'budget': budget,
            'client_rating': rating,
            'applicants': applicants,
            'payment_verified': len(pay_badges) > 0,
        }
