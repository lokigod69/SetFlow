# Current State
Last updated: 2026-07-15 (session 3 — Client ID wired, repo hygiene, QA niceties)

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
- Repo public (github.com/lokigod69/SetFlow), Pages live (https://lokigod69.github.io/SetFlow/), runtime data untracked (history clean).
- Spotify FULLY working: connected + token live-verified as real premium account `Cryptononobo` (PH). Connect-button + settings-drawer bugs fixed.
- GetSongBPM key saved but upstream 401 "inactive" — activates after their crawler verifies the just-live Pages backlink; graceful null fallback confirmed.
- Adversarial code review running (Codex = server security; Opus subagent = shared/client/analyzer correctness). Verify findings before acting.
- Analyzer sidecar (:8322) wedged (stale process, /health unresponsive) — optional feature, non-blocking; restart if the analyzer path is needed.

## Known problems
- Server test suite is thin (5 tests) — acceptance runner carries the real verification load.
- `tsx watch` wedges silently when spawned without a console (no bind, no output) — launcher avoids it; dev CLI unaffected.
- Vite binds `[::1]` only on this machine — probes must use `[::1]` or a browser's `localhost`; `strictPort` now on (stale instances made it hop ports).
- AT6 live (real Spotify playlist) + GetSongBPM key path await user credentials — mechanical steps in protocol/NEXT_STEP.md.
- chrome-devtools MCP on this machine can deadlock on its shared profile (fix: kill `chrome-devtools-mcp` node procs + profile chromes + `lockfile`).

## Open questions
- (none)

## Next actions
1. USER: click **connect Spotify** in the app top bar → log in with the `Cryptononobo` account → then live AT6 (real playlist create + re-export) can run.
2. USER: register at getsongbpm.com/api with Website+Backlink = https://lokigod69.github.io/SetFlow/ → paste key in Settings → Sources.
3. After key arrives: live GetSongBPM verification (one enrich call, check `key_of` → Camelot lands as `getsongbpm`-sourced fact).
