import asyncio
import logging
import re
import hashlib
import os
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

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
    'construction PM remote',
]

RSS_BASE = 'https://www.upwork.com/ab/feed/jobs/rss'
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ),
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
}


def score_job(job: dict) -> int:
    score = 0
    text = (job.get('title', '') + ' ' + job.get('description', '')).lower()

    kw_hits = sum(1 for kw in CONSTRUCTION_KEYWORDS if kw.lower() in text)
    score += min(kw_hits * 3, 21)

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
        all_jobs = []
        seen = set(seen_ids)

        for query in SEARCH_QUERIES:
            jobs = await self._fetch_rss(query, seen)
            for j in jobs:
                if j['id'] not in seen:
                    seen.add(j['id'])
                    all_jobs.append(j)
            await asyncio.sleep(3)

        logger.info(f'Total jobs válidos: {len(all_jobs)}')
        return all_jobs

    async def _fetch_rss(self, query: str, seen_ids: set) -> list[dict]:
        params = urllib.parse.urlencode({
            'q': query,
            'sort': 'recency',
            'paging': '0;20',
        })
        url = f'{RSS_BASE}?{params}'
        logger.info(f'RSS fetch: {query}')

        try:
            req = urllib.request.Request(url, headers=HEADERS)
            loop = asyncio.get_event_loop()
            xml_bytes = await loop.run_in_executor(
                None,
                lambda: urllib.request.urlopen(req, timeout=20).read()
            )
            return self._parse_rss(xml_bytes.decode('utf-8', errors='replace'), seen_ids)
        except Exception as e:
            logger.error(f'Error RSS "{query}": {e}')
            return []

    def _parse_rss(self, xml_text: str, seen_ids: set) -> list[dict]:
        min_score = int(os.environ.get('MIN_SCORE', 12))

        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            logger.error(f'XML parse error: {e}')
            return []

        channel = root.find('channel')
        if channel is None:
            logger.warning('No <channel> en RSS')
            return []

        jobs = []
        for item in channel.findall('item')[:20]:
            try:
                title = (item.findtext('title') or '').strip()
                link = (item.findtext('link') or '').strip()
                raw_desc = (item.findtext('description') or '').strip()
                pub_date = (item.findtext('pubDate') or '').strip()
                guid = (item.findtext('guid') or link).strip()

                id_match = re.search(r'~([a-zA-Z0-9]+)', link or guid)
                job_id = id_match.group(1) if id_match else hashlib.md5(guid.encode()).hexdigest()[:12]

                if not job_id or job_id in seen_ids:
                    continue

                description = re.sub(r'<[^>]+>', ' ', raw_desc)
                description = re.sub(r'\s+', ' ', description).strip()[:500]

                j = {
                    'id': job_id,
                    'title': title,
                    'url': link,
                    'description': description,
                    'budget': self._extract_budget(description),
                    'client_rating': 0.0,
                    'applicants': 5,
                    'payment_verified': False,
                    'posted_at': pub_date,
                }
                j['score'] = score_job(j)

                if j['score'] >= min_score:
                    jobs.append(j)
                    logger.info(f'✅ score={j["score"]}: {title[:60]}')
                else:
                    logger.debug(f'❌ score={j["score"]}: {title[:40]}')

            except Exception as e:
                logger.debug(f'Error item RSS: {e}')

        logger.info(f'RSS "{xml_text[:30]}..." → {len(jobs)} jobs pasaron filtro')
        return jobs

    def _extract_budget(self, text: str) -> str:
        hourly = re.search(r'\$[\d.]+\s*[-–]\s*\$[\d.]+\s*/hr', text, re.I)
        if hourly:
            return hourly.group()
        fixed = re.search(r'\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?', text)
        if fixed:
            return fixed.group()
        return 'Fixed price'
