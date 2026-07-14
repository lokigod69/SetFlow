"""
SETFLOW Local Library Analyzer — FastAPI sidecar service.

Reads audio files the user already owns from a local folder, measures real
BPM and musical key, and persists results to a local sqlite database. This
service performs NO downloading, ripping, or acquisition of audio: it only
reads files that already exist on disk.

Optionally reports newly analyzed/updated rows to the main SETFLOW server
at http://127.0.0.1:8321/api/analyzer/results, but works fully standalone
if that server is unreachable.
"""

from __future__ import annotations

import logging
import os
import threading
import uuid
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from . import store as store_module
from .analysis import analyze_file
from .tags import read_tags

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("setflow-analyzer")

SERVICE_VERSION = "0.1.0"
SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aiff"}
MAIN_SERVER_RESULTS_URL = "http://127.0.0.1:8321/api/analyzer/results"

app = FastAPI(title="SETFLOW Local Library Analyzer", version=SERVICE_VERSION)

_db = store_module.Store()

# In-memory job registry. Jobs are ephemeral (process lifetime only); the
# durable output is the sqlite tracks table.
_jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()


class ScanRequest(BaseModel):
    folder: str


class ScanResponse(BaseModel):
    jobId: str


def _set_job(job_id: str, **fields) -> None:
    with _jobs_lock:
        _jobs[job_id].update(fields)


def _get_job(job_id: str) -> Optional[dict]:
    with _jobs_lock:
        job = _jobs.get(job_id)
        return dict(job) if job is not None else None


def find_audio_files(folder: str) -> list[str]:
    """Recursively find supported audio files under a folder."""
    found = []
    for root, _dirs, files in os.walk(folder):
        for name in files:
            ext = os.path.splitext(name)[1].lower()
            if ext in SUPPORTED_EXTENSIONS:
                found.append(os.path.join(root, name))
    return found


def _report_to_main_server(tracks: list[dict]) -> None:
    """
    POST newly analyzed/updated rows to the main SETFLOW server.

    Tolerates the main server being unreachable: results are already
    persisted locally in sqlite, so this is best-effort only.
    """
    if not tracks:
        return
    try:
        import requests

        resp = requests.post(
            MAIN_SERVER_RESULTS_URL,
            json={"tracks": tracks},
            timeout=5,
        )
        if resp.status_code >= 400:
            logger.warning(
                "Main server responded with %s when posting %d track(s); results remain persisted locally.",
                resp.status_code,
                len(tracks),
            )
        else:
            logger.info("Reported %d track(s) to main server.", len(tracks))
    except Exception as exc:  # noqa: BLE001 - main server being down is expected/ok
        logger.info(
            "Main server unreachable (%s); %d track(s) remain persisted locally and will not be re-sent until next scan.",
            exc,
            len(tracks),
        )


def _run_scan_job(job_id: str, folder: str) -> None:
    try:
        files = find_audio_files(folder)
        total = len(files)
        _set_job(job_id, status="running", total=total, done=0, progress=0.0, current=None)

        reported_tracks = []

        for i, path in enumerate(files):
            _set_job(job_id, current=os.path.basename(path))
            try:
                stat = os.stat(path)
                mtime = stat.st_mtime
                size = stat.st_size

                if not _db.needs_analysis(path, mtime, size):
                    continue

                result = analyze_file(path)
                tags = read_tags(path)

                row = store_module.TrackRow(
                    path=path,
                    artist=tags.artist,
                    title=tags.title,
                    bpm=result.bpm,
                    key=result.key.camelot,
                    key_confidence=result.key.confidence,
                    duration_ms=result.duration_ms,
                    mtime=mtime,
                    size=size,
                    analyzed_at=store_module.now_iso(),
                )
                _db.upsert(row)

                reported_tracks.append(
                    {
                        "path": row.path,
                        "artist": row.artist,
                        "title": row.title,
                        "bpm": row.bpm,
                        "key": row.key,
                        "durationMs": row.duration_ms,
                    }
                )
            except Exception as exc:  # noqa: BLE001 - keep scanning on per-file failure
                logger.warning("Failed to analyze %s: %s", path, exc)
            finally:
                done = i + 1
                _set_job(job_id, done=done, progress=(done / total) if total else 1.0)

        _report_to_main_server(reported_tracks)
        _set_job(job_id, status="done", progress=1.0, current=None)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Scan job %s failed", job_id)
        _set_job(job_id, status="error", error=str(exc))


@app.get("/health")
def health():
    return {"ok": True, "service": "setflow-analyzer", "version": SERVICE_VERSION}


@app.post("/scan", response_model=ScanResponse)
def start_scan(req: ScanRequest):
    folder = req.folder
    if not folder or not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail=f"Folder does not exist: {folder!r}")

    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            "status": "running",
            "progress": 0.0,
            "current": None,
            "done": 0,
            "total": 0,
            "error": None,
        }

    thread = threading.Thread(target=_run_scan_job, args=(job_id, folder), daemon=True)
    thread.start()

    return ScanResponse(jobId=job_id)


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = _get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Unknown job id")
    return job


@app.get("/tracks")
def get_tracks():
    return [row.to_dict() for row in _db.all_tracks()]
