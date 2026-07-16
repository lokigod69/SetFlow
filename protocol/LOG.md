# LOG — append only
2026-07-14T00:00 | main | Bootstrap: brain (memory/) + protocol (protocol/) installed, foundation docs written | evidence: files exist under memory/ and protocol/
2026-07-14T22:10 | main | Scaffold: workspaces installed; shared theory engine written + 14 vitest tests green | evidence: npm run test -w packages/shared -> 14 passed
2026-07-14T22:35 | main | Analyzer sidecar built (librosa BPM + K-S key -> Camelot, FastAPI :8322) | evidence: 58 pytest passed, re-run by orchestrator | via sonnet agent
2026-07-14T22:35 | main | DitherKit global skill installed clean-room for Claude Code + Codex | evidence: ~/.claude/skills/ditherkit + ~/.codex/skills/ditherkit, tsc strict clean, Bayer matrix runtime-verified | via opus agent
2026-07-14T23:00 | main | Server core (codex) + client components (codex) verified: tsc clean both, acceptance runner 10/10 PASS w/ --live-enrich --live-brain | evidence: verify/EVIDENCE.md, commit | via codex x2 + own fixes (mock intent-honoring, deezer 2-step lookup, probe forceReal)
2026-07-14T23:59 | main | UI e2e in browser (all modes, track card, history, settings), themes x5 live-switch OK | evidence: screenshots in session, EVIDENCE.md live table
2026-07-14T23:59 | main | AT8 verified: analyzer override->measured->revalidate + red mismatch warning | evidence: live POST /api/analyzer/results, EVIDENCE.md
2026-07-14T23:59 | main | AT10 verified live: claude CLI full proposal 169s + codex CLI round-trip (stdin:ignore fix) | evidence: verify/artifacts/at10-live-claude-proposal.json
2026-07-14T23:59 | main | Fixes: settings drawer nested-shape rewrite, finalize mock, deezer 2-step, theme switcher redesign, dither accents, favicon | evidence: commit f56bc11, builds+tests green
2026-07-15T00:00 | main | GetSongBPM research (subagent, ~50 integrations) -> registration recipe + API truth (api.getsong.co, key_of, type=both broken) | evidence: briefing in session, DECISIONS.md
2026-07-15T00:00 | main | GetSongBPM adapter rewritten + latent Camelot-reparse crash fixed in enrich/index.ts | evidence: tsc clean, server tests 5/5, live 401 probe graceful
2026-07-15T00:00 | main | Desktop launcher (SETFLOW.lnk -> SetFlow.cmd -> launch.ps1, npm run start no-watch) verified via real double-click: client+server+analyzer 200 | evidence: curl probes in session
2026-07-15T00:00 | main | Favicon promoted to client/public/favicon.svg + multi-size setflow.ico; served 200 | evidence: curl content-type image/svg+xml
2026-07-15T00:00 | main | Backlink page docs/index.html (Pages-ready) + Settings credit link; analyzer venv confirmed installed (librosa 0.11) | evidence: import probe
2026-07-15T | main | Resume: npm run verify -> 8 PASS + 2 PARTIAL (expected) | evidence: runner output in session
2026-07-15T | main | Spotify Client ID saved via PUT /api/settings (hasClientId:true); OAuth connect awaits user click | evidence: API response in session
2026-07-15T | main | Fixed .gitignore (server/server/data untracked: settings.json + cache.db*; history clean, no secrets ever committed) | evidence: commit 7686d39
2026-07-15T | main | Push to github.com/lokigod69/SetFlow blocked by permission layer -> FOR YOU step | evidence: denial in session
2026-07-15T | main | QA niceties done: print-view page-clip fix (wrapper static in print), tray z-index 40 restored, history "pool 24" label; browser-verified live | evidence: commit, CSSOM print sim + computed styles in session
2026-07-15T | main | QA niceties done: print-view page-clip fix (wrapper static in print), tray z-index 40 restored, history pool-24 label; browser-verified live | evidence: commit, CSSOM print sim + computed styles in session
23:07 | GetSongBPM re-probe: HTTP 401 (key still inactive upstream; graceful fallback already verified)
2026-07-16 | Layout upgrade: hero-centered composer in empty state (App/IntentBar/styles.css), controls-row rebuilt; verified via chrome-devtools screenshots on Horizon + Atelier themes, tsc clean
2026-07-16 | AT6 LIVE PASS: real playlist 4GavmctOvPASILfpcPPjGD created + re-export same id, persisted; 8 items verified via API readback
2026-07-16 | Fix: resolve query cascade (mix -> mixless -> plain) — live resolution was 5/22, now 20/24 (mock never caught it)
2026-07-16 | Fix: playlist create via POST /me/playlists (legacy /users/{id}/playlists 403s for newer Spotify apps despite correct scopes)
2026-07-16 | Wired replace pass into hydrate (spec AT1 resolved-or-replaced was dead code in live mode); tsc + 5 server tests green
2026-07-16 | Verify-runner data isolation: SETFLOW_DATA_DIR env + verify/.data; purged 52 mock sets from user history (4 real kept)
