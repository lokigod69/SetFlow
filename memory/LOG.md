# Session Log
Newest first. Append-only — entries are never rewritten.
When this file exceeds ~300 lines, move the oldest half to `archive/log-2026.md`.

## 2026-07-14 — Go-live prep: desktop launcher, favicon, GetSongBPM adapter rewrite (live API research), backlink page
- **Changed:** Desktop launcher (`SetFlow.cmd` + `tools/launch.ps1` + Desktop shortcut `SETFLOW.lnk` with custom .ico): starts analyzer (if venv) + server + client, opens browser when :5173 answers. Root `npm run start` script (server without watch + vite). Favicon promoted to real files `client/public/favicon.svg` + multi-size `setflow.ico` (Pillow-rendered). GetSongBPM adapter rewritten from live research (subagent, ~50 real integrations surveyed): base URL → `api.getsong.co` (old host is Cloudflare-403), title-only search (documented `type=both` returns "Bad query."), client-side artist matching exact→substring, `key_of` field (musical notation) not `key`, tempo arrives as string, no-result shape is `{search:{error}}`. `docs/index.html` = GitHub-Pages-ready backlink page (registration requires a live public backlink). Settings UI credit is now a real link.
- **Files:** SetFlow.cmd, tools/launch.ps1, package.json, client/{index.html,vite.config.ts,public/*}, server/src/enrich/{getsongbpm.ts,index.ts}, client/src/components/SettingsDrawer.tsx, docs/index.html.
- **Fixed:** latent crash in enrich/index.ts — getsongbpm key path did `formatCamelot(parseMusicalKey("11A")!)` → TypeError on any successful key lookup (path needed an API key, so never hit; now `parseCamelot`). Launcher wedge: `tsx watch` spawned without a console never binds and prints nothing → launcher uses plain `tsx` via `npm run start`. Stale dev processes from session 1 (tsx watch + vite holding :8321/:5173) killed; vite now `strictPort`.
- **Verified:** `npm run verify` 8 PASS + 2 PARTIAL (unchanged); server+shared+client tsc clean; server tests 5/5; real double-click launch → client/server/analyzer all 200 incl. favicon assets; `api.getsong.co` live-probed (clean 401 on bad key, graceful nulls). Analyzer venv was already installed (librosa 0.11).
- **Open:** user-side: create Spotify app (exact values in NEXT_STEP), GitHub repo + Pages for GetSongBPM registration, paste keys in Settings. GetSongBPM happy path needs a real key to verify.

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
