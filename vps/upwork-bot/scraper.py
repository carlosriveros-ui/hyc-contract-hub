import asyncio
import logging
import re
import html
import hashlib
import os
import urllib.request
import xml.etree.ElementTree as ET

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

    # Keywords (+4 cada una, max 20)
    kw_hits = sum(1 for kw in CONSTRUCTION_KEYWORDS if kw.lower() in text)
    score += min(kw_hits * 4, 20)

    # Budget
    budget_str = job.get('budget', '')
    budget_nums = re.findall(r'\d+', budget_str.replace(',', ''))
    if budget_nums:
        budget = int(budget_nums[-1])
        if budget >= 5000:
            score += 15
        elif budget >= 1000:
            score += 8
        elif budget >= 500:
            score += 4

    return score


class UpworkScraper:
    def __init__(self, email: str = '', password: str = ''):
        self.email = email
        self.password = password

    async def get_new_jobs(self, seen_ids: set) -> list[dict]:
        all_jobs = []
        loop = asyncio.get_event_loop()
        min_score = int(os.environ.get('MIN_SCORE', 10))

        for query in SEARCH_QUERIES[:3]:
            try:
                found = await loop.run_in_executor(None, self._fetch_rss, query)
                for job in found:
                    if job['id'] in seen_ids:
                        continue
                    job['score'] = score_job(job)
                    if job['score'] >= min_score:
                        all_jobs.append(job)
                        logger.info(f'✅ Job válido (score={job["score"]}): {job["title"][:50]}')
                    else:
                        logger.debug(f'❌ Score bajo ({job["score"]}): {job["title"][:40]}')
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f'Error RSS ({query}): {e}')

        # Deduplica por ID
        seen = set()
        unique = []
        for j in all_jobs:
            if j['id'] not in seen:
                seen.add(j['id'])
                unique.append(j)

        logger.info(f'Total jobs válidos: {len(unique)}')
        return unique

    def _fetch_rss(self, query: str) -> list[dict]:
        url = (
            f'https://www.upwork.com/ab/feed/jobs/rss'
            f'?q={urllib.parse.quote(query)}&sort=recency&per_page=20'
        )
        req = urllib.request.Request(url, headers={
            'User-Agent': (
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            )
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()

        root = ET.fromstring(data)
        jobs = []

        for item in root.findall('.//item'):
            title = item.findtext('title', '').strip()
            link = item.findtext('link', '').strip()
            desc_raw = item.findtext('description', '')

            # Limpiar HTML
            desc_clean = re.sub(r'<[^>]+>', ' ', desc_raw)
            desc_clean = html.unescape(desc_clean)
            desc_clean = re.sub(r'\s+', ' ', desc_clean).strip()

            # Extraer budget de la descripción del RSS
            budget = 'No especificado'
            b_match = re.search(r'Budget[:\s]+\$?([\d,]+)', desc_clean, re.IGNORECASE)
            if b_match:
                budget = f'${b_match.group(1)}'
            else:
                h_match = re.search(
                    r'Hourly Range[:\s]+\$?([\d.]+)\s*[-–]\s*\$?([\d.]+)',
                    desc_clean, re.IGNORECASE
                )
                if h_match:
                    budget = f'${h_match.group(1)}-${h_match.group(2)}/hr'

            # ID único del job
            id_match = re.search(r'~([a-zA-Z0-9]+)', link or '')
            job_id = (
                id_match.group(1) if id_match
                else hashlib.md5((link or title).encode()).hexdigest()[:12]
            )

            if not title or not link:
                continue

            jobs.append({
                'id': job_id,
                'title': title,
                'url': link,
                'description': desc_clean[:500],
                'budget': budget,
                'client_rating': 0.0,
                'applicants': 0,
                'payment_verified': False,
            })

        logger.info(f'RSS "{query}": {len(jobs)} jobs')
        return jobs


import urllib.parse
