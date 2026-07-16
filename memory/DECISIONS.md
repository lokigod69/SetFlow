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

## 2026-07-14 — GetSongBPM: title-only search, own artist matching, no-match = no data
**Status:** active
**Decision:** Adapter hits `https://api.getsong.co/search/?type=song&lookup=<cleaned title>` with `X-API-KEY` header, matches artist client-side (normalized exact → substring), and returns nulls when no artist matches — never "first result".
**Why:** Live research (2026-07): old host api.getsongbpm.com is Cloudflare-403 for scripts; documented `type=both` returns `{"error":"Bad query."}` in practice; `key_of` (musical notation, e.g. "F#m") is the key field; tempo is serialized as a string. A wrong track's BPM/key silently merged into facts is worse than a gap — gaps are visible as `estimated`.
**Rejected:** trusting first search hit (wrong-artist contamination); `open_key` conversion (redundant — `key_of` parses fine).

## 2026-07-14 — Launcher runs the server without watch mode
**Status:** active
**Decision:** `SetFlow.cmd` → `tools/launch.ps1` → `npm run start` (plain `tsx`, vite client). Dev workflow keeps `npm run dev` (tsx watch) unchanged.
**Why:** `tsx watch` spawned without an interactive console wedges silently — child process alive but never binds :8321, zero output (reproduced 3×; plain `tsx` works in the same spawn chain). A launcher needs no hot reload.

## 2026-07-14 — GetSongBPM registration via GitHub Pages backlink page (docs/index.html)
**Status:** active
**Decision:** Ship a Pages-ready `docs/index.html` ("BPM & musical key data powered by GetSongBPM" dofollow link) and register with that URL as both Website and Backlink. In-app credit link kept as good faith.
**Why:** Registration requires a live public backlink BEFORE submitting; README links get `rel="nofollow"` from GitHub; a Pages page is the pattern real integrations use successfully (accounts suspended without notice otherwise).

## 2026-07-15 — Runtime data is never committed
`server/server/data/` (settings.json with API keys, cache.db*) is untracked and gitignored. The old ignore patterns targeted `server/data/*` but the server cwd is `server/`, so runtime data lands one level deeper — anything secret-bearing must be verified against the REAL runtime path, not the path the code appears to name. History was audited before the public push: no secrets ever committed.

## 2026-07-17 — Brain CLI adapters: neutral cwd + prompt via stdin
**Status:** active
**Decision:** `claudeCli`/`codexCli` adapters always run from `os.tmpdir()` and pass the prompt on stdin, never argv.
**Why:** Run from the repo, `claude -p` walks up, loads SETFLOW's own CLAUDE.md and answers as a protocol-os project session instead of as the DJ brain (observed verbatim). On Windows, the `cmd /c claude.cmd` fallback mangles `&` in argv (track names like "Antdot & Maz") and command lines cap at ~8k chars; stdin is immune to both. Applies to any future CLI adapter.

## 2026-07-17 — Spotify: resolve via query cascade; playlist create via /me/playlists
**Status:** active
**Decision:** resolveTrack tries `track:+artist:+mix` → `track:+artist:` → plain free text, first non-empty wins; playlist creation uses `POST /me/playlists`.
**Why:** Brains label nearly everything "Original/Extended Mix" — a mix-qualified query returns ZERO items when the canonical Spotify title lacks the suffix (live resolution was 5/22; cascade → ~20-22/24). Legacy `POST /users/{id}/playlists` returns bare 403 for newer Spotify apps even with `playlist-modify-private` granted; `/me/playlists` works (probe-verified 201).

## 2026-07-17 — LLM-facing schema seams get a normalizer, not just a stricter prompt
**Status:** active
**Decision:** Brain replace outputs pass through `normalizeReplacements` (z.preprocess) that adapts common shape drift (flattened track fields, `resolved`/`tracks` wrappers, `index`/`reason` keys) before zod; missing estimates get neutral priors since the pipeline verifies against real data anyway. Prompt examples stay strict; the parser stays forgiving.
**Why:** Even with an exact JSON example and "EXACTLY two keys" instructions, the CLI model drifted 2/3 attempts. The repair round costs a full second brain call (~1-2 min); normalizing is free and deterministic.

## 2026-07-17 — Verify runs are data-isolated (SETFLOW_DATA_DIR)
**Status:** active
**Decision:** `config.ts` + `cache/db.ts` honor `SETFLOW_DATA_DIR`; the acceptance runner sets it to `verify/.data` (wiped per run, gitignored).
**Why:** Verify runs shared the real app DB and dumped 52 mock sets into the user's visible history. Isolation also makes runs deterministic (no cache bleed between mock and live).
