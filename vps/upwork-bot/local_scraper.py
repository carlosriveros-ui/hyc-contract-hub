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

GRAPHQL_QUERIES = [
    ('freelancerBestMatches', '''
        query { freelancerBestMatches(pagination: {number: 0, count: 20}) {
            results {
                id title snippet type jobType
                hourlyBudgetMin hourlyBudgetMax
                amount { amount }
                client { totalFeedback feedbackScore paymentVerificationStatus }
                proposalsTier jobUrl
            }
        }}
    '''),
    ('jobSearch_construction', '''
        query { jobSearch(query: {q: "construction project manager"}, pagination: {number: 0, count: 20}) {
            results {
                id title snippet type jobType
                hourlyBudgetMin hourlyBudgetMax
                amount { amount }
                client { totalFeedback feedbackScore paymentVerificationStatus }
                proposalsTier jobUrl
            }
        }}
    '''),
    ('jobSearch_superintendent', '''
        query { jobSearch(query: {q: "construction superintendent"}, pagination: {number: 0, count: 20}) {
            results {
                id title snippet type jobType
                hourlyBudgetMin hourlyBudgetMax
                amount { amount }
                client { totalFeedback feedbackScore paymentVerificationStatus }
                proposalsTier jobUrl
            }
        }}
    '''),
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

            await self._load_cookies(context)
            page = await context.new_page()

            # Verificar / establecer sesion
            await page.goto(
                'https://www.upwork.com/nx/find-work/best-matches',
                wait_until='domcontentloaded', timeout=30000,
            )
            await asyncio.sleep(3)

            if 'login' in page.url or 'sign-in' in page.url:
                logger.info('Sesion expirada — esperando autenticacion manual...')
                await page.goto('https://www.upwork.com/login', wait_until='domcontentloaded')
                try:
                    await page.wait_for_url('**/find-work/**', timeout=300000)
                    logger.info('Autenticado!')
                    await self._save_cookies(context)
                except Exception:
                    logger.error('Timeout esperando autenticacion (5 min)')
                    await browser.close()
                    return []

            # Estrategia 1: interceptar API mientras navega find-work
            for url in FIND_WORK_URLS:
                jobs = await self._scrape_with_interception(page, url, seen_ids)
                for j in jobs:
                    if j['id'] not in {x['id'] for x in all_jobs}:
                        all_jobs.append(j)
                if all_jobs:
                    break
                await asyncio.sleep(2)

            # Estrategia 2: llamar GraphQL directamente desde el contexto del browser
            if not all_jobs:
                logger.info('Intentando GraphQL desde sesion del browser...')
                jobs = await self._graphql_from_browser(page, seen_ids)
                for j in jobs:
                    if j['id'] not in {x['id'] for x in all_jobs}:
                        all_jobs.append(j)

            # Estrategia 3: leer job cards del DOM
            if not all_jobs:
                logger.info('Intentando lectura de DOM...')
                jobs = await self._dom_scrape(page, seen_ids)
                for j in jobs:
                    if j['id'] not in {x['id'] for x in all_jobs}:
                        all_jobs.append(j)

            await browser.close()

        logger.info(f'Total jobs validos: {len(all_jobs)}')
        return all_jobs

    async def _scrape_with_interception(self, page, url: str, seen_ids: set) -> list[dict]:
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
                    captured.append(data)
                    logger.info(f'API capturada: {response.url[:80]}')
            except Exception:
                pass

        page.on('response', on_response)
        try:
            await page.goto(url, wait_until='domcontentloaded', timeout=30000)
        except Exception as e:
            logger.error(f'Error: {e}')
            page.remove_listener('response', on_response)
            return []

        title = await page.title()
        if 'challenge' in title.lower():
            page.remove_listener('response', on_response)
            return []

        try:
            await page.wait_for_load_state('networkidle', timeout=15000)
        except Exception:
            pass
        await asyncio.sleep(3)
        for _ in range(4):
            await page.mouse.wheel(0, 400)
            await asyncio.sleep(0.8)
        await asyncio.sleep(4)

        page.remove_listener('response', on_response)
        logger.info(f'APIs interceptadas en {label}: {len(captured)}')

        for data in captured:
            jobs = self._parse(data, seen_ids)
            if jobs:
                return jobs
        return []

    async def _graphql_from_browser(self, page, seen_ids: set) -> list[dict]:
        """Llama la API de Upwork desde el contexto real del browser (cookies incluidas)."""
        for name, query in GRAPHQL_QUERIES:
            try:
                data = await page.evaluate(f'''async () => {{
                    const r = await fetch('/api/graphql/v1', {{
                        method: 'POST',
                        credentials: 'include',
                        headers: {{
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json, text/plain, */*',
                        }},
                        body: JSON.stringify({{ query: {json.dumps(query)} }})
                    }});
                    if (!r.ok) return {{ error: r.status }};
                    return r.json();
                }}''')

                if not isinstance(data, dict) or data.get('error'):
                    logger.debug(f'GraphQL {name}: error {data}')
                    continue

                d = data.get('data', {}) or {}
                results = (
                    (d.get('freelancerBestMatches') or {}).get('results') or
                    (d.get('jobSearch') or {}).get('results') or
                    []
                )
                if results:
                    logger.info(f'GraphQL {name}: {len(results)} jobs')
                    return self._build(results, seen_ids)
                else:
                    logger.info(f'GraphQL {name}: 0 results. keys={list(d.keys())}')

            except Exception as e:
                logger.debug(f'GraphQL {name} exception: {e}')
        return []

    async def _dom_scrape(self, page, seen_ids: set) -> list[dict]:
        """Lee job cards directamente del HTML renderizado."""
        selectors = [
            '[data-test="job-tile"]',
            '[data-test="UpCJobTile"]',
            'article.job-tile',
            '[class*="JobTile"]',
            'section[data-id]',
        ]
        for sel in selectors:
            try:
                count = await page.locator(sel).count()
                if count == 0:
                    continue
                logger.info(f'DOM: {count} elementos "{sel}"')
                raw = await page.evaluate(f'''() => {{
                    const tiles = document.querySelectorAll('{sel}');
                    return Array.from(tiles).slice(0, 20).map(tile => {{
                        const link = tile.querySelector('h2 a, [class*="title"] a, a[href*="/jobs/"], a[href*="~"]');
                        const desc = tile.querySelector('[data-test="description"], [class*="description"], [class*="snippet"], p');
                        const budget = tile.querySelector('[data-test="budget"], [class*="budget"], [class*="price"]');
                        return {{
                            title: link?.textContent?.trim() || tile.querySelector('h2,h3')?.textContent?.trim() || '',
                            url: link ? (link.href || '') : '',
                            description: (desc?.textContent?.trim() || '').slice(0, 500),
                            budget: budget?.textContent?.trim() || '',
                        }};
                    }}).filter(j => j.title);
                }}''')
                if raw:
                    return self._build_from_dom(raw, seen_ids)
            except Exception as e:
                logger.debug(f'DOM {sel}: {e}')
        logger.warning('DOM: no se encontraron job tiles')
        return []

    def _build_from_dom(self, raw_list: list, seen_ids: set) -> list[dict]:
        min_score = int(os.environ.get('MIN_SCORE', 12))
        result = []
        for item in raw_list:
            try:
                url = item.get('url', '')
                cipher = ''
                if '~' in url:
                    cipher = url.split('~')[-1].split('?')[0].split('/')[0]
                job_id = cipher or hashlib.md5(item.get('title', '').encode()).hexdigest()[:12]
                if not job_id or job_id in seen_ids:
                    continue
                j = {
                    'id': job_id,
                    'title': item.get('title', ''),
                    'url': url if url.startswith('http') else f'https://www.upwork.com{url}',
                    'description': item.get('description', ''),
                    'budget': item.get('budget', ''),
                    'client_rating': 0,
                    'applicants': 5,
                    'payment_verified': False,
                }
                j['score'] = score_job(j)
                if j['score'] >= min_score:
                    result.append(j)
                    logger.info(f'score={j["score"]}: {j["title"][:60]}')
            except Exception as e:
                logger.debug(f'DOM build error: {e}')
        return result

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
                    logger.info(f'score={j["score"]}: {j["title"][:60]}')
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
            logger.info('Sin cookies previas — se pedira login manual')
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
