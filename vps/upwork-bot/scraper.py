import asyncio
import logging
import re
import hashlib
import json
import os
import urllib.request
import urllib.parse
from playwright.async_api import async_playwright

logger = logging.getLogger('upwork-scraper')

CONSTRUCTION_KEYWORDS = [
    'construction', 'project manager', 'site manager', 'superintendent',
    'contractor', 'civil', 'building', 'renovation', 'remodel',
    'infrastructure', 'facilities', 'maintenance', 'structural',
    'general contractor', 'foreman', 'estimator', 'project management',
    'architect', 'engineer', 'schedule', 'procurement', 'subcontractor',
]

SEARCH_QUERIES = [
    'construction project manager',
    'construction superintendent',
    'site manager construction',
]

COOKIES_PATH = os.environ.get('COOKIES_PATH', '/opt/upwork-bot/cookies.json')


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
    budget_str = job.get('budget', '')
    nums = re.findall(r'\d+', budget_str.replace(',', ''))
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

    # ── public entry point ──────────────────────────────────────────────────

    async def get_new_jobs(self, seen_ids: set) -> list[dict]:
        # Strategy 1: direct HTTP with cookie auth (no browser)
        jobs = await self._direct_api_search(seen_ids)
        if jobs:
            logger.info(f'Total jobs válidos (direct API): {len(jobs)}')
            return jobs

        # Strategy 2: Playwright — execute fetch() from inside authenticated page
        jobs = await self._playwright_eval_search(seen_ids)
        logger.info(f'Total jobs válidos (playwright eval): {len(jobs)}')
        return jobs

    # ── Strategy 1: direct HTTP with cookies ────────────────────────────────

    def _read_cookies(self):
        try:
            with open(COOKIES_PATH) as f:
                raw = json.load(f)
            cookie_str = '; '.join(
                f'{c["name"]}={c["value"]}'
                for c in raw
                if 'upwork.com' in c.get('domain', '')
            )
            xsrf = next(
                (c['value'] for c in raw if c['name'].upper() in ('XSRF-TOKEN', '_XSRF', 'OAUTH_TOKEN')),
                ''
            )
            return cookie_str, xsrf
        except Exception as e:
            logger.error(f'Error leyendo cookies: {e}')
            return '', ''

    async def _direct_api_search(self, seen_ids: set) -> list[dict]:
        cookie_str, xsrf = self._read_cookies()
        if not cookie_str:
            return []

        base_headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.upwork.com/nx/find-work/best-matches',
            'Origin': 'https://www.upwork.com',
            'Cookie': cookie_str,
            'X-Requested-With': 'XMLHttpRequest',
        }
        if xsrf:
            base_headers['X-XSRF-TOKEN'] = xsrf

        all_jobs = []
        for query in SEARCH_QUERIES:
            q = urllib.parse.quote(query)
            endpoints = [
                f'https://www.upwork.com/ab/jobs/search/?q={q}&sort=recency&paging=0;20',
                f'https://www.upwork.com/api/profiles/v2/jobs/search.json?q={q}&paging=0%3B20&sort=recency',
            ]
            for url in endpoints:
                try:
                    req = urllib.request.Request(url, headers=base_headers)
                    loop = asyncio.get_event_loop()
                    raw = await loop.run_in_executor(
                        None, lambda u=url: urllib.request.urlopen(
                            urllib.request.Request(u, headers=base_headers), timeout=20
                        ).read()
                    )
                    data = json.loads(raw)
                    logger.info(f'Direct API {url[:60]} → keys={list(data.keys())[:6]}')
                    jobs = self._parse_api_response(data, seen_ids)
                    if jobs:
                        all_jobs.extend(jobs)
                        break
                except urllib.error.HTTPError as e:
                    logger.warning(f'Direct API HTTP {e.code}: {url[:60]}')
                except Exception as e:
                    logger.warning(f'Direct API error: {e}')
            await asyncio.sleep(2)

        return self._dedup(all_jobs)

    # ── Strategy 2: Playwright page.evaluate() ──────────────────────────────

    async def _playwright_eval_search(self, seen_ids: set) -> list[dict]:
        all_jobs = []
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
                      '--disable-blink-features=AutomationControlled'],
            )
            context = await browser.new_context(
                viewport={'width': 1366, 'height': 768},
                user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            )
            try:
                if not await self._load_cookies(context):
                    return []

                page = await context.new_page()

                # Load authenticated page (no CF challenge here)
                await page.goto(
                    'https://www.upwork.com/nx/find-work/best-matches',
                    wait_until='domcontentloaded', timeout=30000
                )
                title = await page.title()
                cur = page.url
                if 'login' in cur or 'blocked' in title.lower() or 'just a moment' in title.lower():
                    logger.warning(f'Sesión inválida/bloqueada: {title}')
                    return []

                # Wait for initial config calls
                try:
                    await page.wait_for_load_state('networkidle', timeout=20000)
                except Exception:
                    pass
                await asyncio.sleep(2)

                logger.info('Página autenticada cargada, ejecutando eval GraphQL...')
                jobs = await self._eval_job_feed(page, seen_ids)
                all_jobs.extend(jobs)

            except Exception as e:
                logger.error(f'Playwright eval error: {e}')
            finally:
                await browser.close()

        return self._dedup(all_jobs)

    async def _eval_job_feed(self, page, seen_ids: set) -> list[dict]:
        """Try multiple API calls from within the authenticated browser context."""

        # Build JS that tries several endpoints and returns first successful result
        js = r"""
        async () => {
            const get = async (url, opts) => {
                try {
                    const r = await fetch(url, {credentials: 'include', ...opts});
                    const ct = r.headers.get('content-type') || '';
                    const body = await r.text();
                    return {status: r.status, ct, body: body.substring(0, 8000)};
                } catch(e) { return {status: 0, error: e.message}; }
            };

            const post = (url, payload) => get(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
                body: JSON.stringify(payload),
            });

            // 1. REST search
            const r1 = await get('/ab/jobs/search/?q=construction+project+manager&sort=recency&paging=0;20', {
                headers: {'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json'}
            });
            if (r1.status === 200 && r1.ct.includes('json')) return {src: 'rest', ...r1};

            // 2. GraphQL best-matches (field name discovery — returns error with hints)
            const r2 = await post('/api/graphql/v1?alias=bestMatches', {
                query: `query { freelancerBestMatches(pagination:{offset:0,count:10}) {
                    results { ciphertext title snippet jobType hourlyBudgetMin hourlyBudgetMax
                              client { feedbackScore paymentVerificationStatus }
                              proposalsTier } } }`
            });
            if (r2.status === 200) return {src: 'gql_bestMatches', ...r2};

            // 3. GraphQL with alternate field name
            const r3 = await post('/api/graphql/v1?alias=jobSearch', {
                query: `query JSearch($q:String!) { jobSearch(q:$q, pagination:{offset:0,count:10}) {
                    results { ciphertext title snippet } } }`,
                variables: {q: 'construction project manager'}
            });
            if (r3.status === 200) return {src: 'gql_jobSearch', ...r3};

            // 4. v3 REST
            const r4 = await get('/api/v3/talent/jobs/recommended?limit=20', {
                headers: {'Accept': 'application/json'}
            });
            if (r4.status === 200) return {src: 'v3_recommended', ...r4};

            // Return whatever we got for diagnostics
            return {src: 'none', r1_status: r1.status, r2_status: r2.status,
                    r2_body: r2.body ? r2.body.substring(0,500) : '',
                    r3_status: r3.status, r4_status: r4.status};
        }
        """

        try:
            result = await page.evaluate(js)
            src = result.get('src', 'none')
            logger.info(f'eval result src={src} status={result.get("status")} r1={result.get("r1_status")} r2={result.get("r2_status")} r3={result.get("r3_status")} r4={result.get("r4_status")}')

            if src == 'none':
                r2_body = result.get('r2_body', '')
                if r2_body:
                    logger.info(f'GraphQL error hint: {r2_body[:400]}')
                return []

            body = result.get('body', '')
            if not body:
                return []

            try:
                data = json.loads(body)
            except Exception:
                logger.warning(f'No es JSON. Body[:200]: {body[:200]}')
                return []

            logger.info(f'eval data src={src} keys={list(data.keys())[:8]}')
            return self._parse_api_response(data, seen_ids)

        except Exception as e:
            logger.error(f'eval_job_feed error: {e}')
            return []

    # ── Cookie loading for Playwright context ───────────────────────────────

    async def _load_cookies(self, context) -> bool:
        try:
            with open(COOKIES_PATH) as f:
                raw = json.load(f)
            ss_map = {'no_restriction': 'None', 'lax': 'Lax', 'strict': 'Strict',
                      'none': 'None', 'unspecified': 'Lax'}
            cookies = []
            for c in raw:
                ss = ss_map.get(str(c.get('sameSite', 'Lax')).lower(), 'Lax')
                ck = {'name': c['name'], 'value': c['value'],
                      'domain': c.get('domain', '.upwork.com'),
                      'path': c.get('path', '/'),
                      'httpOnly': c.get('httpOnly', False),
                      'secure': c.get('secure', True),
                      'sameSite': ss}
                if c.get('expirationDate'):
                    ck['expires'] = int(c['expirationDate'])
                cookies.append(ck)
            await context.add_cookies(cookies)
            logger.info(f'Cookies cargadas: {len(cookies)}')
            return True
        except FileNotFoundError:
            logger.error(f'No se encontró {COOKIES_PATH}')
            return False
        except Exception as e:
            logger.error(f'Error cargando cookies: {e}')
            return False

    # ── Parsing ─────────────────────────────────────────────────────────────

    def _parse_api_response(self, data: dict, seen_ids: set) -> list[dict]:
        d = data if isinstance(data, dict) else {}
        nested = d.get('data', {}) or {}

        def edges(obj):
            return [e.get('node', e) for e in (obj.get('edges', []) if isinstance(obj, dict) else []) if isinstance(e, dict)]

        jobs_list = (
            d.get('jobs') or d.get('results') or
            nested.get('jobs') or nested.get('results') or
            nested.get('bestMatches') or
            edges(nested.get('search', {}).get('jobs', {})) or
            edges(nested.get('searchResults', {}).get('jobs', {})) or
            (nested.get('jobSearch', {}) or {}).get('results') or
            (nested.get('freelancerBestMatches', {}) or {}).get('results') or
            []
        )
        if not jobs_list and isinstance(data, list):
            jobs_list = data

        if not jobs_list:
            top = list(d.keys())[:10]
            nested_k = list(nested.keys())[:10]
            logger.warning(f'No jobs. keys={top} data.keys={nested_k}')
            return []

        return self._build_jobs(jobs_list, seen_ids)

    def _build_jobs(self, jobs_list: list, seen_ids: set) -> list[dict]:
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
                proposals = item.get('proposalsTier', '') or item.get('proposals', '') or ''
                applicants = 5
                if isinstance(proposals, str):
                    nums = re.findall(r'\d+', proposals)
                    if nums: applicants = int(nums[-1])
                elif isinstance(proposals, int):
                    applicants = proposals
                raw_url = item.get('jobUrl') or item.get('url') or ''
                if raw_url and not raw_url.startswith('http'):
                    raw_url = f'https://www.upwork.com{raw_url}'
                if not raw_url:
                    raw_url = f'https://www.upwork.com/jobs/{"~" + cipher if cipher else job_id}'
                j = {
                    'id': job_id,
                    'title': item.get('title', '') or item.get('name', ''),
                    'url': raw_url,
                    'description': item.get('snippet', item.get('description', item.get('body', '')))[:500],
                    'budget': self._fmt_budget(item),
                    'client_rating': rating,
                    'applicants': applicants,
                    'payment_verified': (
                        client.get('paymentVerificationStatus') == 1
                        or client.get('paymentVerified') is True
                    ),
                }
                j['score'] = score_job(j)
                if j['score'] >= min_score:
                    result.append(j)
                    logger.info(f'✅ score={j["score"]}: {j["title"][:60]}')
                else:
                    logger.debug(f'❌ score={j["score"]}: {j["title"][:40]}')
            except Exception as e:
                logger.debug(f'Error construyendo job: {e}')
        return result

    def _fmt_budget(self, item: dict) -> str:
        jt = str(item.get('jobType', item.get('type', ''))).lower()
        if 'hourly' in jt:
            lo = item.get('hourlyBudgetMin', 0) or 0
            hi = item.get('hourlyBudgetMax', 0) or 0
            return f'${lo}-${hi}/hr' if lo and hi else 'Hourly'
        amount = 0
        if isinstance(item.get('budget'), dict):
            amount = item['budget'].get('amount') or item['budget'].get('min') or 0
        elif isinstance(item.get('amount'), dict):
            amount = item['amount'].get('amount') or 0
        elif isinstance(item.get('fixedPriceAmount'), dict):
            amount = item['fixedPriceAmount'].get('amount') or 0
        return f'${int(amount):,}' if amount else 'Fixed price'

    def _dedup(self, jobs: list) -> list[dict]:
        seen, unique = set(), []
        for j in jobs:
            if j['id'] not in seen:
                seen.add(j['id'])
                unique.append(j)
        return unique
