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
