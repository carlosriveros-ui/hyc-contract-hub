import asyncio
import logging
import re
import hashlib
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

logger = logging.getLogger('upwork-scraper')

CONSTRUCTION_KEYWORDS = [
    'construction', 'project manager', 'site manager', 'superintendent',
    'contractor', 'civil', 'building', 'renovation', 'remodel',
    'infrastructure', 'facilities', 'maintenance', 'structural',
    'general contractor', 'PM', 'foreman', 'estimator',
]

SEARCH_QUERIES = [
    'construction project manager',
    'construction PM',
    'site manager construction',
    'construction superintendent',
]

def score_job(job: dict) -> int:
    score = 0
    text = (job.get('title', '') + ' ' + job.get('description', '')).lower()

    # Keywords de construccion (+4 cada una, max 20)
    kw_hits = sum(1 for kw in CONSTRUCTION_KEYWORDS if kw.lower() in text)
    score += min(kw_hits * 4, 20)

    # Rating del cliente
    rating = job.get('client_rating', 0)
    if rating >= 4.8:
        score += 10
    elif rating >= 4.4:
        score += 5

    # Numero de aplicantes (menos = mejor)
    apps = job.get('applicants', 99)
    if apps <= 5:
        score += 10
    elif apps <= 10:
        score += 7
    elif apps <= 15:
        score += 4

    # Verificacion de pago
    if job.get('payment_verified'):
        score += 5

    # Budget
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
        self._logged_in = False

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
            page = await context.new_page()

            try:
                await self._login(page)
                for query in SEARCH_QUERIES[:2]:  # Max 2 queries por ciclo
                    found = await self._search_jobs(page, query, seen_ids)
                    jobs.extend(found)
                    await asyncio.sleep(3)
            except Exception as e:
                logger.error(f'Error scraping: {e}')
            finally:
                await browser.close()

        # Deduplica por ID
        seen = set()
        unique = []
        for j in jobs:
            if j['id'] not in seen:
                seen.add(j['id'])
                unique.append(j)

        return unique

    async def _login(self, page):
        logger.info('Iniciando sesión en Upwork...')
        await page.goto('https://www.upwork.com/ab/account-security/login', wait_until='networkidle')
        await asyncio.sleep(2)

        await page.fill('#login_username', self.email)
        await page.click('#login_password_continue')
        await asyncio.sleep(1)
        await page.fill('#login_password', self.password)
        await page.click('#login_control_continue')

        try:
            await page.wait_for_url('**/find-work/**', timeout=20000)
            logger.info('Login exitoso')
            self._logged_in = True
        except PlaywrightTimeout:
            # Puede que haya 2FA o captcha
            logger.warning('Login timeout — puede requerir 2FA')

    async def _search_jobs(self, page, query: str, seen_ids: set) -> list[dict]:
        url = (
            f'https://www.upwork.com/nx/jobs/search/'
            f'?q={query.replace(" ", "+")}&sort=recency&per_page=20'
        )
        logger.info(f'Buscando: {query}')
        await page.goto(url, wait_until='domcontentloaded')
        await asyncio.sleep(3)

        jobs = []
        try:
            tiles = await page.query_selector_all('[data-test="job-tile-list"] section')
            logger.info(f'Encontrados {len(tiles)} jobs para "{query}"')

            for tile in tiles[:15]:
                try:
                    job = await self._extract_job(tile)
                    if not job or job['id'] in seen_ids:
                        continue

                    job['score'] = score_job(job)

                    # Aplica filtros
                    if (job.get('client_rating', 0) >= float(
                            __import__('os').environ.get('MIN_CLIENT_RATING', 4.0))
                        and job.get('applicants', 99) <= int(
                            __import__('os').environ.get('MAX_APPLICANTS', 15))
                        and job['score'] >= int(
                            __import__('os').environ.get('MIN_SCORE', 20))):
                        jobs.append(job)
                        logger.info(f'✅ Job válido (score={job["score"]}): {job["title"][:50]}')
                    else:
                        logger.debug(f'❌ Filtrado: {job.get("title","")[:40]} '
                                     f'(rating={job.get("client_rating",0)}, '
                                     f'apps={job.get("applicants",99)}, '
                                     f'score={job["score"]})')
                except Exception as e:
                    logger.debug(f'Error extrayendo job: {e}')

        except Exception as e:
            logger.error(f'Error buscando jobs: {e}')

        return jobs

    async def _extract_job(self, tile) -> dict | None:
        # Título y URL
        title_el = await tile.query_selector('h2 a, [data-test="job-title"] a')
        if not title_el:
            return None
        title = (await title_el.inner_text()).strip()
        href = await title_el.get_attribute('href')
        url = f'https://www.upwork.com{href}' if href and href.startswith('/') else href

        # ID único del job
        job_id_match = re.search(r'~([a-zA-Z0-9]+)', url or '')
        job_id = job_id_match.group(1) if job_id_match else hashlib.md5(url.encode()).hexdigest()[:12]

        # Descripción
        desc_el = await tile.query_selector('[data-test="job-description-text"], .job-description')
        description = (await desc_el.inner_text()).strip() if desc_el else ''

        # Budget / hourly
        budget_el = await tile.query_selector('[data-test="budget"], [data-test="hourly-rate"]')
        budget = (await budget_el.inner_text()).strip() if budget_el else 'No especificado'

        # Rating del cliente
        rating = 0.0
        rating_el = await tile.query_selector('[data-test="client-rating"] .sr-only, .client-feedback')
        if rating_el:
            rating_text = await rating_el.inner_text()
            nums = re.findall(r'[\d.]+', rating_text)
            rating = float(nums[0]) if nums else 0.0

        # Número de aplicantes
        applicants = 99
        apps_els = await tile.query_selector_all('[data-test="proposals-tier"] li, .proposals')
        for el in apps_els:
            text = await el.inner_text()
            if 'proposal' in text.lower() or 'applicant' in text.lower():
                nums = re.findall(r'\d+', text)
                if nums:
                    applicants = int(nums[0])
                    break

        # Payment verified
        pay_verified = False
        badges = await tile.query_selector_all('[data-test="payment-verified"], .payment-verified')
        pay_verified = len(badges) > 0

        return {
            'id': job_id,
            'title': title,
            'url': url,
            'description': description[:500],
            'budget': budget,
            'client_rating': rating,
            'applicants': applicants,
            'payment_verified': pay_verified,
        }
