# SETFLOW acceptance evidence — 2026-07-16T16:34:11.219Z

| # | Test | Result | Evidence |
|---|---|---|---|
| 1 | seed-track mode: 20–30 pool + A/B, resolved-or-replaced | PASS | pool=24, options=A,B, unresolved-in-options=false |
| 2 | vibe mode: coherent ordered set with transition notes | PASS | tracks=10, transitions=9 |
| 3 | A→B mode: endpoints honored, path valid under default policy | PASS | first="Ben Böhmer – Beyond Beliefs", last="Adriatique – Home", redWarnings=false |
| 4 | artist-mesh: 3 artists interleaved with valid transitions | PASS | artists-in-set=yotto, lane 8, tinlicker |
| 5 | curve-first: predicted arc tracks a custom target (API level; node-tap = UI check) | PASS | curveFit=0.965, arcLen=10 |
| 6 | spotify playlist create + re-export updates same playlist (mock mode) | PASS | playlistId=mock-playlist, stable=true, persisted=true |
| 7 | BPM/key badges carry source status; enrichment source returns data | PARTIAL | statuses-seen=estimated,verified; offline run: source-status plumbing verified; live Deezer check skipped (--live-enrich) |
| 10 | brain adapters (probe only; live CLI calls need --live-brain) | PARTIAL | claude-cli:true, codex-cli:true, anthropic-api:false |
| 11 | exports valid: m3u8, csv, txt, youtube list, rekordbox | PASS | all formats well-formed (see verify/artifacts/) |
| 12 | no download/rip functionality anywhere | PASS | source sweep clean |

## Not covered by this runner (verified separately)
- **AT5 (UI half):** drawing the curve and tapping nodes — driven via browser automation / by hand; API half is covered above.
- **AT6 (live half):** a real private playlist needs the user's Spotify dev-app Client ID — mock path proves the create/update flow.
- **AT8:** analyzer measurement accuracy is proven by its own test suite (58 pytest tests incl. synthesized 120 BPM / A-minor audio and a live /scan smoke test); the override + re-validate path is exercised against the server when both services run.
- **AT9:** five themes / reduced-motion — visual check via browser automation.
