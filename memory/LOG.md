# Session Log
Newest first. Append-only — entries are never rewritten.
When this file exceeds ~300 lines, move the oldest half to `archive/log-2026.md`.

## 2026-07-14 — Full v1 build: pipeline, UI, themes, analyzer, all machine-verifiable acceptance tests green
- **Changed:** Entire app built and verified. Shared theory engine (Camelot/BPM/curves, 14 tests). Server (Fastify :8321): brain adapters (claude-cli/codex-cli/anthropic-api/mock), Spotify PKCE + resolve, Deezer/GetSongBPM enrichment, SQLite cache, validation pipeline, jobs, all exports, analyzer bridge. Client (Vite :5173): five themes + designed switcher, spring-field SVG Energy Arc, intent bar, option columns w/ transition cheat notes, track card w/ Camelot wheel, curation tray, settings drawer, history, set sheet, DitherBackdrop. Analyzer (FastAPI :8322, 58 tests). Acceptance runner + EVIDENCE.md.
- **Files:** everything under packages/shared, server/src, client/src, analyzer/, verify/.
- **Commits:** 08c44aa (foundation), 168c5ff (cores + acceptance green), f56bc11 (polish + live verification).
- **Fixed:** codex exec stdin hang (`stdin:'ignore'`), Deezer advanced-search death (2-step plain query), settings drawer flat/nested mismatch, finalize mock indices, mock intent-honoring, probe forceReal, AT12 regex false positive, INDEX.md mojibake (PowerShell round-trip — use Write tool for UTF-8).
- **Decided:** see [[DECISIONS]] (executor delegation, dither accents scope).
- **Open:** user-side steps: Spotify Client ID, optional GetSongBPM key, analyzer venv. Server test suite thin (runner compensates).

## 2026-07-14 — Project bootstrap: brain + protocol installed
- **Changed:** Installed Second Brain memory layer and Protocol OS coordination layer for the greenfield SETFLOW build; read and internalized `setflow-spec.md` v1.0.
- **Files:** memory/* (INDEX, STATE, DECISIONS, ARCHITECTURE, LOG), protocol/* (PROTOCOL, NEXT_STEP, BOARD, LOG), CLAUDE.md, AGENTS.md, ROADMAP.md.
- **Decided:** Stack (React+Vite / Fastify / better-sqlite3 / librosa analyzer), ArcRenderer adapter with SVG default (ditter widget not attached), Mode 1 Autopilot — see [[DECISIONS]].
- **Open:** Spotify dev-app credentials + live CLI verification deferred to handover FOR-YOU list.
