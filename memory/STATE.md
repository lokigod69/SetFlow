# Current State
Last updated: 2026-07-14 (end of session 2 — go-live prep)

## What this is
AI DJ Set Architect: intent → verified, ordered tracklist with an editable energy arc, Spotify playlist export, five swappable themes. Spec: `setflow-spec.md`. Mode 1 Autopilot, v1-done = spec §10 acceptance tests.

## Working now
- Full pipeline end-to-end in mock mode: propose → resolve → enrich → validate → SetDocument; all five intent modes.
- Acceptance runner (`npm run verify`): 10/10 machine checks PASS offline; `--live-enrich --live-brain` variants also PASS (see verify/EVIDENCE.md).
- Live brains verified: Claude Code CLI full 24-track proposal (169s, zod-valid) and Codex CLI JSON round-trip (`stdin:'ignore'` required).
- Real Deezer enrichment (2-step lookup; advanced search syntax is dead upstream).
- GetSongBPM adapter rewritten against the live API (`api.getsong.co`, title-only search, client-side artist match, `key_of` field, string tempo). Live-probed: clean 401 + graceful nulls on bad key. Happy path needs the user's key. Backlink page ready at `docs/index.html` (GitHub Pages).
- Analyzer (FastAPI :8322, librosa BPM + K-S key → Camelot): venv installed and working (librosa 0.11), 58 pytest green; override → `measured` → revalidate → mismatch warning verified.
- **Desktop launcher**: `SETFLOW.lnk` on Desktop (custom icon) → `SetFlow.cmd` → starts analyzer + server + client (`npm run start`, no watch), opens browser when :5173 answers. Verified: real double-click → all three services 200.
- Favicon: `client/public/favicon.svg` + multi-size `setflow.ico`, both served (index.html links them).
- Client: five themes live-switch cleanly; spring-field SVG arc; curation; exports; settings drawer (incl. GetSongBPM credit link).
- Tests: shared 14, server 5, analyzer 58 — all green; tsc clean everywhere.

## In progress
- Nothing mid-flight. Remaining QA niceties: set-sheet print view, curation-tray stick, SetHistory "pool 24" label.

## Known problems
- Server test suite is thin (5 tests) — acceptance runner carries the real verification load.
- `tsx watch` wedges silently when spawned without a console (no bind, no output) — launcher avoids it; dev CLI unaffected.
- Vite binds `[::1]` only on this machine — probes must use `[::1]` or a browser's `localhost`; `strictPort` now on (stale instances made it hop ports).
- AT6 live (real Spotify playlist) + GetSongBPM key path await user credentials — mechanical steps in protocol/NEXT_STEP.md.
- chrome-devtools MCP on this machine can deadlock on its shared profile (fix: kill `chrome-devtools-mcp` node procs + profile chromes + `lockfile`).

## Open questions
- (none)

## Next actions
1. USER: Spotify dev app + Client ID; GitHub repo + Pages → GetSongBPM key; paste both in Settings (exact steps in NEXT_STEP.md).
2. After key arrives: live GetSongBPM verification (one enrich call, check `key_of` → Camelot lands as `getsongbpm`-sourced fact).
3. Optional QA niceties: set-sheet print view, curation-tray stick, SetHistory label.
