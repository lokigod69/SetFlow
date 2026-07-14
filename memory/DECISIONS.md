# Decisions
Newest first. Never delete a decision — mark it `⚠️ superseded → [[#the newer one]]` instead.
Wrong turns are part of the memory.

## 2026-07-14 — Stack: React+Vite+TS client, Fastify+TS server, better-sqlite3, framer-motion, Python FastAPI analyzer
**Status:** active
**Decision:** npm-workspaces monorepo — `client/` (React 18, Vite, TypeScript, framer-motion, zustand), `server/` (Fastify, TypeScript, better-sqlite3 cache), `analyzer/` (Python, FastAPI + librosa; key detection via librosa chroma → Krumhansl-Schmuckler, essentia optional). One-command start via `npm run dev` (concurrently).
**Why:** Matches spec §10 recommendation; better-sqlite3 is synchronous and dead-simple for a local cache; zustand keeps state minimal without Redux ceremony; librosa installs cleanly cross-platform where essentia often fails on Windows — spec says pick whichever installs cleanest.
**Rejected:** Next.js (SSR pointless for local-first), Electron (browser tab is fine, spec says web app), essentia as primary key detector (Windows install pain).

## 2026-07-14 — Energy Arc ships on an ArcRenderer adapter with the SVG renderer as default
**Status:** active
**Decision:** The arc component consumes an `ArcRenderer` interface (data in: target curve, predicted curves, track nodes; events out: point-drag, node-tap). Default implementation is a custom SVG renderer with spring-animated morphs. The user's "ditter graph" widget was not attached at kickoff; it can be wrapped as a second adapter implementation later without touching the app.
**Why:** Spec §0/§4 mandates the adapter + fallback; widget absent at kickoff.

## 2026-07-14 — Mode 1 Autopilot, v1-done = spec §10 acceptance tests
**Status:** active
**Decision:** Build fully autonomously; no questions to the user. Anything unresolvable without the user (Spotify dev-app credentials, live CLI presence, listening tests) is built against mocks/fixtures, machine-verified as far as possible, and surfaced as mechanical FOR-YOU steps at handover.
**Why:** Spec §0: "The user will NOT be in the loop. Make every decision yourself."

## 2026-07-14 - CLI subprocess discipline: stdin must be ignored; Deezer needs 2-step plain-query lookup
**Status:** active
**Decision:** All brain CLI adapters spawn with execa stdin:'ignore'; Deezer enrichment uses plain-text search + own scoring + /track/{id} for BPM.
**Why:** codex exec with piped stdin prints its answer then blocks on "Reading additional input from stdin..." until timeout; Deezer's documented advanced search (artist:"X" track:"Y") now returns 0 results, and search hits omit bpm.
**Rejected:** --json event parsing alone (kept as first attempt with plain fallback); Deezer search-hit bpm field (absent in practice).
