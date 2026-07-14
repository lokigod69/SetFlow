# SETFLOW — AI DJ Set Architect

Translate a *feeling* into a *tracklist*. SETFLOW is a local-first web app for a bedroom DJ learning to mix: express an intent — a seed track, a start→end pair, a vibe sentence, a set of artists, or a drawn energy curve — and the AI brain architects an ordered set with a deliberate energy arc, harmonic (Camelot) compatibility, and manageable BPM transitions. Every AI claim is verified against real data. The AI is the taste engine; the data layer keeps it honest.

> **Hard boundary:** SETFLOW never downloads, rips, or acquires audio. It outputs setlists, Spotify playlists, YouTube links, and export files. The local analyzer only reads files you already own.

## Quick start

```powershell
npm install
npm run dev          # server on :8321 + client on :5173
```

Optional ground-truth analyzer (measures real BPM/key of your own files):

```powershell
cd analyzer
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe run.py     # analyzer on :8322
```

First run: open Settings →
1. **Brain** — pick your adapter: Claude Code CLI (default), Codex CLI, or Anthropic API. The CLIs use your existing subscription quota; no API key needed.
2. **Spotify** — create a free dev app at developer.spotify.com/dashboard, set redirect URI `http://127.0.0.1:8321/auth/spotify/callback`, paste the Client ID, connect. This powers track verification and one-tap playlist export.
3. **Sources** — optionally add a free GetSongBPM key for better key/BPM coverage.

## How it works

```
intent ──▶ brain proposes 20–30 candidates + Option A/B journeys
                │
                ▼
        resolve on Spotify        ← hallucination filter; unresolved → auto-replaced
                │
                ▼
        enrich BPM/key            ← Deezer → GetSongBPM → brain estimate (badged ≈)
                │
                ▼
        validate transitions      ← Camelot wheel, BPM policy, energy curve fit
                │
                ▼
   energy arc + curation → star ~10 → build final set → export
                │
                ▼
   Spotify playlist · m3u8 · csv · txt · YouTube links · Rekordbox XML · set sheet
                │
                ▼
   (optional) local analyzer measures your actual files → ✓ measured overrides
```

Every BPM/key/energy value carries provenance: `≈ estimated` (brain) → `verified` (Deezer/GetSongBPM/Spotify) → `✓ measured` (your files, via librosa).

## Workspaces

| Path | What |
|---|---|
| `client/` | React + Vite + framer-motion UI — five live-switchable themes |
| `server/` | Fastify API: brain adapters, Spotify OAuth (PKCE), enrichment, SQLite cache, exports |
| `packages/shared/` | Domain types + music-theory engine (Camelot math, BPM reads, curve interpolation) |
| `analyzer/` | Python FastAPI sidecar: librosa BPM + Krumhansl-Schmuckler key detection |
| `memory/`, `protocol/` | Project brain + working protocol (agent-maintained) |

## Themes

Console (warm hardware) · Atelier (gallery editorial) · Meridian (deep glass) · Crate (cardboard & stamps) · Horizon (golden hour). One layout skeleton, token-swapped personalities; all honor `prefers-reduced-motion`.

## Attribution

Track metadata: Spotify. BPM/key enrichment: [Deezer](https://developers.deezer.com/) and [GetSongBPM.com](https://getsongbpm.com/) (attribution required — shown in-app). Key detection in the analyzer uses Krumhansl-Schmuckler profiles over librosa chroma features.
