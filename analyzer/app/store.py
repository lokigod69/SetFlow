"""
SQLite persistence for analyzed tracks.

Local-only store at analyzer/data/library.db. No network access here.
"""

from __future__ import annotations

import dataclasses
import datetime
import os
import sqlite3
import threading

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
DB_PATH = os.path.join(DB_DIR, "library.db")

_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS tracks (
    path TEXT PRIMARY KEY,
    artist TEXT,
    title TEXT,
    bpm REAL,
    key TEXT,
    key_confidence REAL,
    duration_ms INTEGER,
    mtime REAL,
    size INTEGER,
    analyzed_at TEXT
);
"""


@dataclasses.dataclass
class TrackRow:
    path: str
    artist: str | None
    title: str | None
    bpm: float
    key: str
    key_confidence: float
    duration_ms: int
    mtime: float
    size: int
    analyzed_at: str

    def to_dict(self) -> dict:
        return dataclasses.asdict(self)


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    path = db_path or DB_PATH
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute(SCHEMA)
    conn.commit()
    return conn


class Store:
    """Thin wrapper around the sqlite tracks table."""

    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or DB_PATH
        self._conn = get_connection(self.db_path)

    def get_by_path(self, path: str) -> TrackRow | None:
        with _lock:
            cur = self._conn.execute("SELECT * FROM tracks WHERE path = ?", (path,))
            row = cur.fetchone()
        if row is None:
            return None
        return TrackRow(**dict(row))

    def needs_analysis(self, path: str, mtime: float, size: int) -> bool:
        """True if this path is new, or its mtime/size changed since last scan."""
        existing = self.get_by_path(path)
        if existing is None:
            return True
        return existing.mtime != mtime or existing.size != size

    def upsert(self, row: TrackRow) -> None:
        with _lock:
            self._conn.execute(
                """
                INSERT INTO tracks (path, artist, title, bpm, key, key_confidence,
                                     duration_ms, mtime, size, analyzed_at)
                VALUES (:path, :artist, :title, :bpm, :key, :key_confidence,
                        :duration_ms, :mtime, :size, :analyzed_at)
                ON CONFLICT(path) DO UPDATE SET
                    artist=excluded.artist,
                    title=excluded.title,
                    bpm=excluded.bpm,
                    key=excluded.key,
                    key_confidence=excluded.key_confidence,
                    duration_ms=excluded.duration_ms,
                    mtime=excluded.mtime,
                    size=excluded.size,
                    analyzed_at=excluded.analyzed_at
                """,
                row.to_dict(),
            )
            self._conn.commit()

    def all_tracks(self) -> list[TrackRow]:
        with _lock:
            cur = self._conn.execute("SELECT * FROM tracks ORDER BY analyzed_at DESC")
            rows = cur.fetchall()
        return [TrackRow(**dict(r)) for r in rows]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
