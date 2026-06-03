import aiosqlite
import json
from datetime import datetime

DB_PATH = '/opt/upwork-bot/jobs.db'

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT,
                url TEXT,
                budget TEXT,
                client_rating REAL,
                applicants INTEGER,
                score INTEGER,
                description TEXT,
                posted_at TEXT,
                seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                proposal TEXT
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS weekly_stats (
                week TEXT PRIMARY KEY,
                jobs_found INTEGER DEFAULT 0,
                applied INTEGER DEFAULT 0,
                skipped INTEGER DEFAULT 0
            )
        ''')
        await db.commit()

async def job_exists(job_id: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute('SELECT id FROM jobs WHERE id = ?', (job_id,)) as cur:
            return await cur.fetchone() is not None

async def save_job(job: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            INSERT OR IGNORE INTO jobs
            (id, title, url, budget, client_rating, applicants, score, description, posted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job['id'], job['title'], job['url'], job['budget'],
            job.get('client_rating', 0), job.get('applicants', 0),
            job.get('score', 0), job.get('description', ''),
            job.get('posted_at', datetime.now().isoformat())
        ))
        await db.commit()

async def update_job_status(job_id: str, status: str, proposal: str = None):
    async with aiosqlite.connect(DB_PATH) as db:
        if proposal:
            await db.execute(
                'UPDATE jobs SET status=?, proposal=? WHERE id=?',
                (status, proposal, job_id)
            )
        else:
            await db.execute('UPDATE jobs SET status=? WHERE id=?', (status, job_id))
        await db.commit()

async def get_job(job_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

async def get_weekly_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        # Stats de los últimos 7 días
        async with db.execute('''
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status='applied' THEN 1 ELSE 0 END) as applied,
                SUM(CASE WHEN status='skipped' THEN 1 ELSE 0 END) as skipped,
                AVG(score) as avg_score,
                MAX(score) as max_score
            FROM jobs
            WHERE seen_at >= datetime('now', '-7 days')
        ''') as cur:
            row = await cur.fetchone()
            return {
                'total': row[0] or 0,
                'applied': row[1] or 0,
                'skipped': row[2] or 0,
                'avg_score': round(row[3] or 0, 1),
                'max_score': row[4] or 0,
            }
