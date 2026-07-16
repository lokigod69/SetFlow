# Current State
Last updated: 2026-07-17 (session 3e — AT6 live PASS, live-pipeline fixes, hero layout)

## What this is
AI DJ Set Architect: intent → verified, ordered tracklist with an editable energy arc, Spotify playlist export, five swappable themes. Spec: `setflow-spec.md`. Mode 1 Autopilot, v1-done = spec §10 acceptance tests.

## Working now
- Full pipeline end-to-end **live**: propose (Claude CLI) → resolve (real Spotify, query cascade) → replace (brain swaps unresolvable tracks, wired 3e) → enrich (real Deezer) → validate → SetDocument.
- **AT6 LIVE PASS**: real private playlist created in user's account (`4GavmctOvPASILfpcPPjGD`), re-export updates the same playlist, link persisted. Playlist create uses `POST /me/playlists` (legacy /users/{id} route 403s on newer Spotify apps).
- Live resolution ~20-22/24 (was 5/22 before the query cascade fix). Unresolved leftovers are genuinely-not-on-Spotify edits; replace pass swaps most, export skips the rest.
- CLI brain adapters hardened: neutral cwd (repo CLAUDE.md was hijacking answers), prompt via stdin (cmd.exe `&` mangling + 8k argv cap), shape-drift normalizer for replace outputs.
- Acceptance runner (`npm run verify`): 8 PASS + 2 PARTIAL offline, now writes to isolated `verify/.data` (never pollutes app history). Live-flag variants proven earlier (EVIDENCE.md).
- Client: empty state = centered hero composer ("Shape the night."), rebuilt controls row; set-loaded state flows from top. Skeleton shared by all five themes; verified Horizon + Atelier.
- Desktop launcher, favicon, five themes, curation, exports, settings drawer — all as before.
- Tests: shared 15, server 5, analyzer 58 — green; tsc clean everywhere.

## In progress
- Repo public (github.com/lokigod69/SetFlow), Pages live. Latest push: 2e58df5.
- GetSongBPM key saved but upstream 401 "inactive" (re-probed 3e) — flips when their crawler verifies the Pages backlink; graceful null fallback confirmed.

## Known problems
- One track per set may stay unresolved when even its brain replacement isn't on Spotify (best-effort by design; export skips it).
- Verify runner's taskkill can orphan its mock server on :8321 — kill by port before starting the real server.
- Server test suite is thin (5 tests) — acceptance runner carries the real verification load.
- `tsx watch` wedges silently when spawned without a console — launcher avoids it.
- Vite binds `[::1]` only on this machine; `strictPort` on.
- chrome-devtools MCP can deadlock on its shared profile (fix: kill profile chromes + lockfile); also restarts browser mid-session sometimes — renavigate.
- Spotify playlists report `public: true` via API despite `public:false` at creation (known Spotify field quirk — playlist is not on the profile; harmless, but eyeball in the app once).

## Open questions
- (none)

## Next actions
1. User listening test of a real set (final acceptance dimension no machine can check).
2. GetSongBPM: re-probe next session; when active, live-verify one enrich call (`key_of` → Camelot, source `getsongbpm`).
3. Optional polish candidates (user-approved ideas list in protocol/NEXT_STEP.md): compact composer once a set loads, second replace round, playlist description/artwork, drag-reorder in options.
