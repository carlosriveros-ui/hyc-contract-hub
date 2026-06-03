import asyncio
import logging
import re
import hashlib
import os
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

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
            page = await context.new_page()

            try:
                logged_in = await self._login(page)
                if not logged_in:
                    logger.warning('Login fallido — buscando sin autenticación')

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

    async def _login(self, page) -> bool:
        logger.info('Iniciando sesión en Upwork...')
        try:
            await page.goto(
                'https://www.upwork.com/ab/account-security/login',
                wait_until='domcontentloaded',
                timeout=30000,
            )
            await asyncio.sleep(4)

            # Cerrar diálogos de cookies o modales
            for sel in [
                '[data-qa="uc-accept-all-button"]',
                '#onetrust-accept-btn-handler',
                'button:has-text("Accept All")',
            ]:
                try:
                    btn = page.locator(sel)
                    if await btn.count() > 0 and await btn.is_visible():
                        await btn.click()
                        await asyncio.sleep(1)
                        break
                except Exception:
                    pass

            await page.keyboard.press('Escape')
            await asyncio.sleep(0.5)

            # Email
            username_input = page.locator('#login_username')
            await username_input.wait_for(state='visible', timeout=15000)
            await username_input.click()
            await asyncio.sleep(0.3)
            await username_input.fill(self.email)
            await asyncio.sleep(0.5)

            # Click continue via JS (más confiable que Playwright click en Vue.js)
            await page.evaluate("document.querySelector('#login_password_continue').click()")
            await asyncio.sleep(5)

            # Password — usar JS para disparar eventos Vue.js correctamente
            await page.evaluate(
                """(pwd) => {
                    const input = document.querySelector('#login_password');
                    if (!input) return;
                    const setter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value'
                    ).set;
                    setter.call(input, pwd);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                }""",
                self.password
            )
            await asyncio.sleep(1)

            # Submit via JS
            await page.evaluate("document.querySelector('#login_control_continue').click()")

            try:
                await page.wait_for_url('**/find-work/**', timeout=25000)
                logger.info('Login exitoso')
                return True
            except PlaywrightTimeout:
                current_url = page.url
                logger.warning(f'Login timeout — URL actual: {current_url[:80]}')
                return False

        except Exception as e:
            logger.error(f'Error en login: {e}')
            return False

    async def _search_jobs(self, page, query: str, seen_ids: set) -> list[dict]:
        url = (
            f'https://www.upwork.com/nx/jobs/search/'
            f'?q={query.replace(" ", "+")}&sort=recency&per_page=20'
        )
        logger.info(f'Buscando: {query}')
        await page.goto(url, wait_until='domcontentloaded')
        await asyncio.sleep(4)

        jobs = []
        try:
            tiles = await page.query_selector_all(
                '[data-test="job-tile-list"] section, '
                'article[data-test="job-tile"], '
                '[data-test="job-tile"]'
            )
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

        # Default bajo para pasar el filtro cuando no está disponible
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
