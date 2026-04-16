"""
SQLite database for session history.
Stores completed sessions with transcripts, grading context, and assessments.
"""

import json
import aiosqlite
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "sessions.db"


async def init_db():
    """Create tables if they don't exist."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                difficulty TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                turn_count INTEGER NOT NULL,
                transcript TEXT NOT NULL,
                grading_context TEXT NOT NULL,
                assessment TEXT,
                overall_grade TEXT,
                overall_score INTEGER,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()


async def save_session(
    session_id: str,
    difficulty: str,
    customer_name: str,
    turn_count: int,
    transcript: list[dict],
    grading_context: dict,
    assessment: dict | None = None,
) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR REPLACE INTO sessions
               (id, difficulty, customer_name, turn_count, transcript,
                grading_context, assessment, overall_grade, overall_score, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                session_id,
                difficulty,
                customer_name,
                turn_count,
                json.dumps(transcript),
                json.dumps(grading_context),
                json.dumps(assessment) if assessment else None,
                assessment.get("overall_grade") if assessment else None,
                assessment.get("overall_score") if assessment else None,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        await db.commit()


async def update_assessment(session_id: str, assessment: dict) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """UPDATE sessions SET assessment = ?, overall_grade = ?, overall_score = ?
               WHERE id = ?""",
            (
                json.dumps(assessment),
                assessment.get("overall_grade"),
                assessment.get("overall_score"),
                session_id,
            ),
        )
        await db.commit()


async def get_sessions(limit: int = 50, offset: int = 0) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """SELECT id, difficulty, customer_name, turn_count,
                      overall_grade, overall_score, created_at
               FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            (limit, offset),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def get_session(session_id: str) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        )
        row = await cursor.fetchone()
        if not row:
            return None
        result = dict(row)
        result["transcript"] = json.loads(result["transcript"])
        result["grading_context"] = json.loads(result["grading_context"])
        if result["assessment"]:
            result["assessment"] = json.loads(result["assessment"])
        return result


async def get_stats() -> dict:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT COUNT(*) FROM sessions")
        total = (await cursor.fetchone())[0]

        cursor = await db.execute(
            "SELECT AVG(overall_score) FROM sessions WHERE overall_score IS NOT NULL"
        )
        avg_score = (await cursor.fetchone())[0]

        cursor = await db.execute(
            """SELECT overall_grade, COUNT(*) as cnt FROM sessions
               WHERE overall_grade IS NOT NULL GROUP BY overall_grade"""
        )
        grade_dist = {row[0]: row[1] for row in await cursor.fetchall()}

        return {
            "total_sessions": total,
            "avg_score": round(avg_score, 1) if avg_score else None,
            "grade_distribution": grade_dist,
        }
