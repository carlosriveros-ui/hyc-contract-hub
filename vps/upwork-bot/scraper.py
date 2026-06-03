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
            use_tor = os.environ.get('USE_TOR', '').lower() in ('1', 'true', 'yes')
            proxy = {'server': 'socks5://127.0.0.1:9050'} if use_tor else None
            if use_tor:
                logger.info('Usando Tor como proxy')

            browser = await p.chromium.launch(
                headless=True,
                proxy=proxy,
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

                # Scrape from authenticated find-work pages (no CF challenge, no Tor block)
                # These pages already show relevant construction jobs based on user's profile
                feed_pages = [
                    'https://www.upwork.com/nx/find-work/best-matches',
                    'https://www.upwork.com/nx/find-work/most-recent',
                ]

                for feed_url in feed_pages:
                    found = await self._scrape_feed_page(page, feed_url, seen_ids)
                    jobs.extend(found)
                    await asyncio.sleep(2)

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
            logger.info(f'Cookies cargadas: {len(cookies)}')
            return True

        except FileNotFoundError:
            logger.error(f'No se encontró {COOKIES_PATH}')
            return False
        except Exception as e:
            logger.error(f'Error cargando cookies: {e}')
            return False

    async def _verify_session(self, page) -> bool:
        logger.info('Verificando sesión...')
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

    async def _scrape_feed_page(self, page, url: str, seen_ids: set) -> list[dict]:
        """Scrape jobs from authenticated find-work pages — no CF challenge, no Tor block."""
        logger.info(f'Cargando feed: {url}')
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
        except Exception as e:
            logger.error(f'Error navegando a {url}: {e}')
            return []

        current_url = page.url
        if 'login' in current_url or 'blocked' in (await page.title()).lower():
            logger.warning(f'Página bloqueada o sesión expirada: {current_url}')
            return []

        await asyncio.sleep(4)

        # Try __NEXT_DATA__ first
        try:
            next_data_str = await page.evaluate("""
                () => {
                    const el = document.getElementById('__NEXT_DATA__');
                    return el ? el.textContent : null;
                }
            """)
            if next_data_str:
                data = json.loads(next_data_str)
                jobs = self._parse_next_data(data, seen_ids)
                if jobs:
                    logger.info(f'{len(jobs)} jobs via __NEXT_DATA__ en {url}')
                    return self._filter_jobs(jobs)
        except Exception as e:
            logger.debug(f'Error parseando __NEXT_DATA__: {e}')

        # Fallback: DOM tile extraction
        jobs = []
        for sel in ['article[data-test="job-tile"]', '[data-test="job-tile"]', '[data-job-uid]']:
            tiles = await page.query_selector_all(sel)
            if tiles:
                logger.info(f'{len(tiles)} tiles con selector "{sel}" en {url}')
                for tile in tiles[:20]:
                    try:
                        job = await self._extract_tile(tile)
                        if job and job['id'] not in seen_ids:
                            job['score'] = score_job(job)
                            jobs.append(job)
                    except Exception as e:
                        logger.debug(f'Error tile: {e}')
                break

        if not jobs:
            title = await page.title()
            html_preview = (await page.content())[:300]
            logger.warning(f'0 jobs en {url}. Title: "{title}". HTML: {html_preview}')

        return self._filter_jobs(jobs)

    async def _search_jobs(self, page, query: str, seen_ids: set) -> list[dict]:
        url = (
            f'https://www.upwork.com/nx/jobs/search/'
            f'?q={query.replace(" ", "+")}&sort=recency&per_page=20'
        )
        logger.info(f'Buscando: {query}')
        await page.goto(url, wait_until='domcontentloaded')

        title = await page.title()
        if 'just a moment' in title.lower():
            logger.warning(f'CF challenge en búsqueda — title: {title}')
            try:
                await page.wait_for_function(
                    "document.title.toLowerCase().indexOf('just a moment') === -1",
                    timeout=20000,
                )
            except Exception:
                logger.warning('CF no resuelto')
        await asyncio.sleep(4)

        jobs = []
        try:
            # Extract __NEXT_DATA__ JSON (all job data is embedded here)
            next_data_str = await page.evaluate("""
                () => {
                    const el = document.getElementById('__NEXT_DATA__');
                    return el ? el.textContent : null;
                }
            """)

            if next_data_str:
                data = json.loads(next_data_str)
                jobs = self._parse_next_data(data, seen_ids)
                logger.info(f'{len(jobs)} jobs via __NEXT_DATA__ para "{query}"')
                return jobs

            # Fallback: query selector tiles
            selector_candidates = [
                'article[data-test="job-tile"]',
                '[data-test="job-tile"]',
                'section[data-test="job-tile"]',
                '[data-job-uid]',
            ]
            for sel in selector_candidates:
                tiles = await page.query_selector_all(sel)
                if tiles:
                    logger.info(f'Selector "{sel}" → {len(tiles)} tiles')
                    for tile in tiles[:15]:
                        try:
                            job = await self._extract_tile(tile)
                            if job and job['id'] not in seen_ids:
                                job['score'] = score_job(job)
                                jobs.append(job)
                        except Exception as e:
                            logger.debug(f'Error tile: {e}')
                    break

            if not jobs:
                html_preview = (await page.content())[:400]
                logger.warning(f'0 jobs. HTML: {html_preview}')

        except Exception as e:
            logger.error(f'Error en búsqueda: {e}')

        return self._filter_jobs(jobs)

    async def _extract_tile(self, tile) -> dict | None:
        title_el = await tile.query_selector('h2 a, [data-test="job-title"] a, h3 a, a[href*="/jobs/"]')
        if not title_el:
            return None
        title = (await title_el.inner_text()).strip()
        href = await title_el.get_attribute('href')
        url = f'https://www.upwork.com{href}' if href and href.startswith('/') else href
        id_match = re.search(r'~([a-zA-Z0-9]+)', url or '')
        job_id = id_match.group(1) if id_match else hashlib.md5((url or title).encode()).hexdigest()[:12]

        desc_el = await tile.query_selector('[data-test="job-description-text"], .job-description')
        description = (await desc_el.inner_text()).strip() if desc_el else ''
        budget_el = await tile.query_selector('[data-test="budget"], [data-test="hourly-rate"]')
        budget = (await budget_el.inner_text()).strip() if budget_el else 'No especificado'
        rating_el = await tile.query_selector('[data-test="client-rating"] .sr-only')
        rating = 0.0
        if rating_el:
            nums = re.findall(r'[\d.]+', await rating_el.inner_text())
            rating = float(nums[0]) if nums else 0.0
        applicants = 5
        for el in await tile.query_selector_all('[data-test="proposals-tier"] li, [data-test="proposals"]'):
            text = await el.inner_text()
            if 'proposal' in text.lower():
                nums = re.findall(r'\d+', text)
                if nums:
                    applicants = int(nums[0])
                    break
        pay_badges = await tile.query_selector_all('[data-test="payment-verified"]')
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

    def _filter_jobs(self, jobs: list) -> list[dict]:
        min_score = int(os.environ.get('MIN_SCORE', 20))
        min_rating = float(os.environ.get('MIN_CLIENT_RATING', 4.0))
        max_apps = int(os.environ.get('MAX_APPLICANTS', 15))
        result = []
        for job in jobs:
            rating_ok = job.get('client_rating', 0) >= min_rating or job.get('client_rating', 0) == 0.0
            apps_ok = job.get('applicants', 5) <= max_apps
            score_ok = job.get('score', 0) >= min_score
            if rating_ok and apps_ok and score_ok:
                result.append(job)
                logger.info(f'✅ Job válido (score={job["score"]}): {job["title"][:50]}')
            else:
                logger.debug(f'❌ Filtrado: score={job.get("score",0)}, r={job.get("client_rating",0)}, a={job.get("applicants",0)}')
        return result

    async def _search_via_fetch(self, page, query: str, seen_ids: set) -> list[dict]:
        """
        Fetch search results from within the already-loaded upwork.com page.
        This avoids Cloudflare's JS challenge because the request is an AJAX call
        from an authenticated session, not a fresh page navigation.
        """
        q = query.replace(' ', '+')
        logger.info(f'Buscando via fetch interno: {query}')

        # Try endpoints in order
        endpoints = [
            f'/ab/jobs/search/?q={q}&sort=recency&paging=0;20',
            f'/ab/jobs/search/?q={q}&sort=recency',
            f'/nx/jobs/search/?q={q}&sort=recency&per_page=20',
        ]

        for endpoint in endpoints:
            try:
                result = await page.evaluate(f"""
                    async () => {{
                        try {{
                            const resp = await fetch('{endpoint}', {{
                                headers: {{
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Accept': 'application/json, text/plain, */*',
                                }},
                                credentials: 'include'
                            }});
                            const ct = resp.headers.get('content-type') || '';
                            const text = await resp.text();
                            return {{
                                status: resp.status,
                                contentType: ct,
                                body: text.substring(0, 8000)
                            }};
                        }} catch(e) {{
                            return {{error: e.message}};
                        }}
                    }}
                """)

                if result.get('error'):
                    logger.warning(f'Fetch error en {endpoint}: {result["error"]}')
                    continue

                status = result.get('status', 0)
                body = result.get('body', '')
                ct = result.get('contentType', '')

                logger.info(f'Endpoint {endpoint}: status={status}, ct={ct[:40]}')

                if status != 200 or not body:
                    continue

                if 'just a moment' in body.lower():
                    logger.warning('CF challenge en fetch también — IP bloqueada')
                    continue

                # Parse JSON response
                if 'json' in ct:
                    try:
                        data = json.loads(body)
                        jobs = self._parse_api_response(data, seen_ids)
                        logger.info(f'{len(jobs)} jobs via JSON [{endpoint}]')
                        return jobs
                    except json.JSONDecodeError:
                        pass

                # Parse __NEXT_DATA__ from HTML
                nd_match = re.search(
                    r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                    body, re.DOTALL
                )
                if nd_match:
                    try:
                        data = json.loads(nd_match.group(1))
                        jobs = self._parse_next_data(data, seen_ids)
                        logger.info(f'{len(jobs)} jobs via __NEXT_DATA__ [{endpoint}]')
                        return jobs
                    except Exception as e:
                        logger.warning(f'Error parseando __NEXT_DATA__: {e}')

                logger.warning(f'Respuesta no parseable. Body[:300]: {body[:300]}')

            except Exception as e:
                logger.error(f'Error evaluando fetch: {e}')

        return []

    def _parse_api_response(self, data: dict, seen_ids: set) -> list[dict]:
        # Try various response structures
        jobs_list = (
            data.get('jobs', [])
            or data.get('results', [])
            or data.get('data', {}).get('jobs', [])
            or []
        )

        if not jobs_list and isinstance(data, list):
            jobs_list = data

        if not jobs_list:
            logger.warning(f'No jobs en JSON. Keys top-level: {list(data.keys())[:10]}')
            return []

        return self._build_jobs(jobs_list, seen_ids)

    def _parse_next_data(self, data: dict, seen_ids: set) -> list[dict]:
        props = data.get('props', {}).get('pageProps', {})
        jobs_list = (
            props.get('jobs', {}).get('jobs', [])
            or props.get('searchResults', {}).get('jobs', {}).get('jobs', [])
            or props.get('initialData', {}).get('jobs', [])
            or []
        )
        if not jobs_list:
            logger.warning(f'No jobs en __NEXT_DATA__. pageProps keys: {list(props.keys())[:10]}')
        return self._build_jobs(jobs_list, seen_ids)

    def _build_jobs(self, jobs_list: list, seen_ids: set) -> list[dict]:
        min_score = int(os.environ.get('MIN_SCORE', 20))
        min_rating = float(os.environ.get('MIN_CLIENT_RATING', 4.0))
        max_apps = int(os.environ.get('MAX_APPLICANTS', 15))

        result = []
        for item in jobs_list[:20]:
            try:
                cipher = item.get('ciphertext', '') or ''
                job_id = cipher.lstrip('~') or hashlib.md5(
                    item.get('title', '').encode()
                ).hexdigest()[:12]

                if not job_id or job_id in seen_ids:
                    continue

                client = item.get('client', {}) or {}
                rating = float(client.get('feedbackScore', 0) or 0)

                proposals = item.get('proposalsTier', '') or ''
                applicants = 5
                if isinstance(proposals, str):
                    nums = re.findall(r'\d+', proposals)
                    if nums:
                        applicants = int(nums[-1])
                elif isinstance(proposals, int):
                    applicants = proposals

                j = {
                    'id': job_id,
                    'title': item.get('title', ''),
                    'url': f'https://www.upwork.com/jobs/{cipher or "~" + job_id}',
                    'description': item.get('snippet', item.get('description', ''))[:500],
                    'budget': self._fmt_budget(item),
                    'client_rating': rating,
                    'applicants': applicants,
                    'payment_verified': client.get('paymentVerificationStatus') == 1,
                }
                j['score'] = score_job(j)

                rating_ok = j['client_rating'] >= min_rating or j['client_rating'] == 0.0
                apps_ok = j['applicants'] <= max_apps
                score_ok = j['score'] >= min_score

                if rating_ok and apps_ok and score_ok:
                    result.append(j)
                    logger.info(f'✅ (score={j["score"]}): {j["title"][:50]}')
                else:
                    logger.debug(
                        f'❌ Filtrado: score={j["score"]}, '
                        f'rating={j["client_rating"]}, apps={j["applicants"]}'
                    )
            except Exception as e:
                logger.debug(f'Error construyendo job: {e}')

        return result

    def _fmt_budget(self, item: dict) -> str:
        job_type = str(item.get('jobType', item.get('type', ''))).lower()
        if 'hourly' in job_type:
            lo = item.get('hourlyBudgetMin', 0) or 0
            hi = item.get('hourlyBudgetMax', 0) or 0
            if lo and hi:
                return f'${lo}-${hi}/hr'
            return 'Hourly'
        amount = 0
        if isinstance(item.get('budget'), dict):
            amount = item['budget'].get('amount') or item['budget'].get('min') or 0
        elif isinstance(item.get('amount'), dict):
            amount = item['amount'].get('amount') or 0
        elif isinstance(item.get('fixedPriceAmount'), dict):
            amount = item['fixedPriceAmount'].get('amount') or 0
        return f'${int(amount):,}' if amount else 'Fixed price'
