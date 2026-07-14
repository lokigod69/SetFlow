# SETFLOW Local Library Analyzer

A standalone Python sidecar service for SETFLOW. It scans a folder of audio
files **the user already owns**, measures their **real BPM and musical key**,
and stores the results locally so the main SETFLOW app can override its AI
estimates with ground truth.

This service does not download, rip, or acquire audio in any way. It only
reads local files you point it at.

## What it does

- `POST /scan {folder}` — recursively scans a folder for `.mp3 .wav .flac
  .m4a .ogg .aiff` files, skips any file already analyzed with an unchanged
  mtime+size, and measures BPM/key/duration for the rest in a background job.
- `GET /jobs/{id}` — poll scan progress.
- `GET /tracks` — list everything analyzed so far.
- `GET /health` — liveness check.
- Results persist locally in `analyzer/data/library.db` (sqlite), and after
  each scan completes, newly analyzed/updated tracks are also POSTed to the
  main SETFLOW server at `http://127.0.0.1:8321/api/analyzer/results`. If
  the main server isn't running, this is skipped (logged, not fatal) —
  results are still safely persisted locally and nothing is lost.

BPM is normalized into the plausible DJ range (70-180 — octave-doubled or
halved as needed). Key is detected via chroma analysis + Krumhansl-Schmuckler
key-profile correlation, and reported in Camelot wheel notation (e.g. `8A`)
so it matches SETFLOW's key badges directly.

## Install

From `analyzer/`:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

(A virtualenv is recommended — `librosa` pulls in `numba`/`llvmlite`, numpy,
scipy, etc., and you don't want that in your system Python.)

## Run

```powershell
.venv\Scripts\python.exe run.py
```

This starts the service on `127.0.0.1:8322` (localhost only). Then, e.g.:

```powershell
curl -X POST http://127.0.0.1:8322/scan -H "Content-Type: application/json" -d "{\"folder\": \"D:\\Music\"}"
curl http://127.0.0.1:8322/jobs/<jobId>
curl http://127.0.0.1:8322/tracks
```

## How it talks to the main server

SETFLOW's main server is expected at `http://127.0.0.1:8321`. After a scan
job finishes, this service POSTs newly analyzed/updated rows to
`/api/analyzer/results` as:

```json
{"tracks": [{"path": "...", "artist": "...", "title": "...", "bpm": 128.0, "key": "8A", "durationMs": 245000}]}
```

The main server is expected to match these back to library tracks by file
path (or artist/title), and flip their BPM/key badges to "measured".

## Tests

```powershell
.venv\Scripts\python.exe -m pytest
```

Tests synthesize their own audio with numpy (a click track for BPM, summed
sine tones for key) — no sample audio files needed.

## Codec notes

`soundfile`/`audioread` (via librosa) handle `wav`/`flac`/`ogg`/`aiff`
natively. MP3 and some M4A files may additionally require **ffmpeg** on your
PATH for decoding, depending on your platform's available backends — if a
file fails to decode with an error mentioning `NoBackendError` or similar,
installing ffmpeg (and making sure `ffmpeg.exe` is on PATH) resolves it.
