# Current State
Last updated: 2026-07-14 (end of build session 1)

## What this is
AI DJ Set Architect: intent → verified, ordered tracklist with an editable energy arc, Spotify playlist export, five swappable themes. Spec: `setflow-spec.md`. Mode 1 Autopilot, v1-done = spec §10 acceptance tests.

## Working now
- Full pipeline end-to-end in mock mode: propose → resolve → enrich → validate → SetDocument; all five intent modes.
- Acceptance runner (`npm run verify`): 10/10 machine checks PASS offline; `--live-enrich --live-brain` variants also PASS (see verify/EVIDENCE.md).
- Live brains verified: Claude Code CLI full 24-track proposal (169s, zod-valid, genuinely tasteful) and Codex CLI JSON round-trip (needed `stdin:'ignore'` — codex exec otherwise hangs on stdin).
- Real Deezer enrichment (2-step lookup: search → /track/{id}; advanced search syntax is dead, plain query + own scoring).
- Analyzer (FastAPI :8322, librosa BPM + K-S key → Camelot): 58 pytest green; override → `measured` badges → revalidate → mismatch red warning, all verified against live server.
- Client: five themes live-switch cleanly (screenshotted); spring-field SVG arc (draw + predict, node tap → track card w/ Camelot mini-wheel); curation (star → finalize 'final' option), swap alternatives, remix lineage; exports (spotify mock, m3u8, csv, txt, youtube, rekordbox, set sheet); designed theme-switcher popover; DitherBackdrop accents (console/crate/horizon).
- Tests: shared 14, server 5, analyzer 58 — all green; tsc clean everywhere.

## In progress
- Nothing mid-flight. Next session = final QA sweep (drawer visual re-check after nested-shape rewrite, set-sheet print view, YouTube copy button) + handover.

## Known problems
- Server test suite is thin (5 tests) — acceptance runner carries the real verification load.
- SetHistory shows pool size (24) as "tracks"; label could say "pool 24".
- AT6 live (real Spotify playlist) requires the user's dev-app Client ID — guided setup built; user step at handover.
- chrome-devtools MCP on this machine can deadlock on its shared profile (fix: kill `chrome-devtools-mcp` node procs + profile chromes + `lockfile`).

## Open questions
- (none)

## Next actions
1. Quick visual QA: settings drawer (rewritten), set sheet print, curation tray stick behavior.
2. Write handover NEXT_STEP FOR-YOU list (Spotify Client ID setup, optional GetSongBPM key, analyzer venv run).
3. Optional niceties if time: GetSongBPM live check with key, SetHistory label, Rekordbox import test in real Rekordbox (user-side).
