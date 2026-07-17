# Current State
Last updated: 2026-07-17 (session 4 — v2 polish wave: 4 features + 6 adversarial-review fixes)

## What this is
AI DJ Set Architect: intent → verified, ordered tracklist with an editable energy arc, Spotify playlist export, five swappable themes. Spec: `setflow-spec.md`. Mode 1 Autopilot, v1-done = spec §10 acceptance tests (all machine-checkable ones pass; listening test remains).

## Working now
- Full pipeline end-to-end **live**: propose (Claude CLI) → resolve (real Spotify, query cascade) → replace (up to 2 brain rounds; round 2 blacklists candidates that failed to resolve) → enrich (real Deezer) → validate → SetDocument.
- **AT6 LIVE PASS** (session 3e): real private playlist `4GavmctOvPASILfpcPPjGD`, re-export updates same id. Exports now stamp a **playlist description**: vibe text + unicode energy-arc glyphs + "architected with SETFLOW" (300-char cap), synced on create and re-export (name too). Details sync best-effort.
- **Drag-to-reorder** in option columns: ⠿ handle per row, optimistic order + rollback, POST /api/sets/:id/reorder (permutation-checked) revalidates transitions server-side. Blend/note advice carries over by (from→to) pair — new adjacencies get fresh computed notes, never stale advice. Reorder requests FIFO-serialized client-side; export resyncs once if order changed mid-flight. Live-verified in Chrome.
- **Compact composer**: with a set loaded, the composer collapses to a one-line brief (set's persisted intent + constraints digests); click to expand, auto-collapse on new doc. Empty-state hero unchanged.
- Live resolution ~20-22/24; leftovers are genuinely-not-on-Spotify edits (replace rounds swap most; export skips the rest).
- Acceptance runner (`npm run verify`): 8 PASS + 2 PARTIAL offline, isolated `verify/.data`.
- Client: hero composer empty state; set-loaded state flows from top with brief + arc + options. Five themes, curation, exports, settings drawer, desktop launcher.
- Tests: shared 15, server 9, analyzer 58 — green; tsc clean everywhere; root `npm test` now passes (client `--passWithNoTests`).

## In progress
- Repo public (github.com/lokigod69/SetFlow), Pages live.
- GetSongBPM key saved but upstream 401 "inactive" (last probed session 3e) — flips when their crawler verifies the Pages backlink; graceful null fallback confirmed.

## Known problems
- **`npm run verify` needs port 8321 free**: if the real app server is up, the runner's health check hits it and AT1 calls the REAL brain → "job timeout" crash (and a stray test set may land in real history if the job completes). Stop the app, verify, relaunch via SetFlow.cmd.
- One track per set may stay unresolved when even its brain replacements aren't on Spotify (best-effort by design; export skips it).
- Reorder breaks-then-reforms an adjacency → original brain note is replaced by a generated default (pair-keyed carry-over only spans one recompute). "fix" can regenerate advice.
- Server test suite still thin (9 tests) — acceptance runner carries the real verification load.
- `tsx watch` wedges silently when spawned without a console — launcher avoids it.
- Vite binds `[::1]` only on this machine; `strictPort` on.
- chrome-devtools MCP can deadlock on its shared profile (fix: kill profile chromes + lockfile — worked again this session).
- Spotify playlists report `public: true` via API despite `public:false` at creation (known field quirk; harmless).

## Open questions
- (none)

## Next actions
1. User listening test of a real set (final acceptance dimension no machine can check) → tune brain prompts from feedback.
2. GetSongBPM: re-probe next session; when active, live-verify one enrich call (`key_of` → Camelot, source `getsongbpm`).
3. Optional next polish (not yet requested): live-verify the playlist description on the real playlist (re-export once); playlist cover art (needs `ugc-image-upload` scope → re-auth, parked in ROADMAP).
