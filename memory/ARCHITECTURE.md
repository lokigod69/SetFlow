# Architecture
Last verified: 2026-07-14 (design-time — updated as build lands)

## Overview
Local-first web app in three processes: a React/Vite client, a Fastify server (API, OAuth, brain subprocess management, enrichment, cache, exports), and an optional Python FastAPI analyzer sidecar for ground-truth BPM/key measurement of local files. The AI "brain" is a pluggable adapter that shells out to Claude Code CLI or Codex CLI (or calls the Anthropic API) and returns a strict-JSON candidate pool. Every brain proposal flows through a verification pipeline: resolve on Spotify → enrich BPM/key (Deezer, GetSongBPM) → validate transitions (Camelot + BPM policy + energy curve) → optionally override with locally measured values.

## Key components
| Area | Where | Notes |
|---|---|---|
| Client | client/ | React 18 + Vite + TS, zustand store, framer-motion, token-based 5-theme system |
| Energy Arc | client/src/arc/ | ArcRenderer adapter interface; default SVG renderer; draw + predict modes |
| Server | server/ | Fastify + TS; routes: intent, brain, spotify, enrich, validate, export, sets, settings |
| Brain adapters | server/src/brain/ | BrainAdapter: claude-cli, codex-cli, anthropic-api; strict JSON, one repair retry |
| Verification | server/src/pipeline/ | resolve → replace (brain swaps unresolvable; up to 2 rounds, round 2 blacklists failed candidates) → enrich → validate; status per field: estimated / verified / measured; transition blend/note carried over by (from→to) pair on revalidation |
| Cache | server/src/cache/ | better-sqlite3, keyed by Spotify track ID; never re-fetch cached |
| Exports | server/src/export/ + spotify/playlists.ts | Spotify playlist (create/update, name+description synced on re-export; description = vibe + energy glyphs), m3u8, csv, txt, YouTube links, Rekordbox XML, set sheet |
| Analyzer | analyzer/ | Python FastAPI; librosa BPM + chroma/K-S key; folder scan; match by tags/filename |
| Music theory | server/src/theory/ (shared types in packages/shared) | Camelot wheel math, BPM delta incl. half/double-time, energy-curve fit |

## Data flow
Intent (client) → POST /api/sets/propose → BrainAdapter subprocess → CandidatePoolJSON → resolve each on Spotify (unresolved → brain replacement call) → enrich via Deezer/GetSongBPM with cache → validate transitions → SetDocument (pool, optionA/B, arcs, per-transition notes, per-field verification status) → client renders arc + options → curation (star ~10, "build final set" brain call) → exports. Analyzer results POST back and override estimates, triggering re-validation.

## External services & dependencies that matter
- Spotify Web API — OAuth PKCE with the user's own free dev app (guided first-run setup); search/resolve, metadata, playlist create/update. Audio-features endpoint assumed unavailable (tried once, used only if it works).
- Deezer API — public, no auth: BPM for many tracks.
- GetSongBPM API — free key, attribution required (footer/about).
- Claude Code CLI / Codex CLI — brain subprocesses (quota-based, no API cost); Anthropic API optional fallback.
- YouTube — search-URL construction by default; Data API only if user supplies a key.

## Conventions
- TypeScript strict everywhere; shared types in packages/shared (SetDocument, Track, VerificationStatus, CamelotKey…).
- Every fact field carries provenance: `{ value, source: 'brain-estimate' | 'deezer' | 'getsongbpm' | 'spotify' | 'measured', status: 'estimated' | 'verified' | 'measured' }`.
- Hard boundary: no audio download/rip/acquisition code anywhere (spec §0).
- Themes are pure token swaps (CSS custom properties + motion personality config); layout skeleton never changes per theme; respect `prefers-reduced-motion`.
