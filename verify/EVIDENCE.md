# SETFLOW acceptance evidence — 2026-07-14T15:15:35.771Z

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | seed-track mode: 20–30 pool + A/B, resolved-or-replaced | PASS | pool=24, options=A,B, unresolved-in-options=false |
| 2 | vibe mode: coherent ordered set with transition notes | PASS | tracks=10, transitions=9 |
| 3 | A→B mode: endpoints honored, path valid under default policy | PASS | first="Ben Böhmer – Beyond Beliefs", last="Adriatique – Home", redWarnings=false |
| 4 | artist-mesh: 3 artists interleaved with valid transitions | PASS | artists-in-set=yotto, lane 8, tinlicker |
| 5 | curve-first: predicted arc tracks a custom target (API level; node-tap = UI check) | PASS | curveFit=0.965, arcLen=10 |
| 6 | spotify playlist create + re-export updates same playlist (mock mode) | PASS | playlistId=mock-playlist, stable=true, persisted=true |
| 7 | BPM/key badges carry source status; enrichment source returns data | PARTIAL | statuses-seen=estimated; offline run: source-status plumbing verified; live Deezer check skipped (--live-enrich) |
| 10 | brain adapters (probe only; live CLI calls need --live-brain) | PARTIAL | claude-cli:true, codex-cli:true, anthropic-api:false |
| 11 | exports valid: m3u8, csv, txt, youtube list, rekordbox | PASS | all formats well-formed (see verify/artifacts/) |
| 12 | no download/rip functionality anywhere | PASS | source sweep clean |

## Not covered by this runner (verified separately)
- **AT5 (UI half):** drawing the curve and tapping nodes — driven via browser automation / by hand; API half is covered above.
- **AT6 (live half):** a real private playlist needs the user's Spotify dev-app Client ID — mock path proves the create/update flow.
- **AT8:** analyzer measurement accuracy is proven by its own test suite (58 pytest tests incl. synthesized 120 BPM / A-minor audio and a live /scan smoke test); the override + re-validate path is exercised against the server when both services run.
- **AT9:** five themes / reduced-motion — visual check via browser automation.

## Live verification (2026-07-14, beyond the offline runner)
| # | Check | Result | Evidence |
|---|---|---|---|
| 5 (UI) | Arc node tap opens track card; draw mode drags control points | PASS | browser-driven; card showed Camelot mini-wheel 10B/D major, energy meter, transition context |
| 7 (live) | Real Deezer BPM via 2-step lookup | PASS | CamelPhat - Constellations = 121.96 BPM (verify/artifacts/at7-deezer-live.json) |
| 8 | Analyzer results override + revalidate + mismatch warning | PASS | POST /api/analyzer/results: key 1B(estimated) -> 4B(measured), bpm 125.8 measured, 26 sets revalidated, deliberate mismatch produced red 1A->4B clash warning |
| 9 | Five themes switch live, no layout breakage | PASS | browser screenshots: Horizon/Console/Atelier/Meridian/Crate; reduced-motion honored in code (MotionConfig reducedMotion="user", effectiveMotion snap, SvgArc reducedMotion prop, dither static-paint) |
| 10 (live) | Real Claude Code CLI proposal | PASS | 169s, pool=24 + options A/B zod-validated; taste check: Polo & Pan, Marcos Valle, Synapson for "golden hour brazil beach party" (verify/artifacts/at10-live-claude-proposal.json) |
| 10 (live) | Real Codex CLI adapter round-trip | PASS | codex exec returned exact JSON; stdin:'ignore' fix documented in adapter |
| curation | finalize (6 starred -> 6-track final + 5 transitions), alternatives (3), remix (lineage + flavor) | PASS | API-driven against live server |

Remaining for the user (cannot be machine-verified without their accounts):
- AT6 live: real Spotify playlist needs the user's dev-app Client ID (guided setup in Settings).
