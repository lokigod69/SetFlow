# BOARD — SETFLOW — updated 2026-07-17 (checkpoint 7)

## ⚠️ WAITING ON YOU
- Listening test: architect a set, export, actually mix/listen — the one acceptance no machine can run. Also: mention if GetSongBPM emails a key-activation confirmation.

## Workstreams
| Workstream | Phase/Gate | Last done | Next | State |
|---|---|---|---|---|
| main | Live-verified end-to-end; awaiting listen test + GSB activation | AT6 LIVE PASS + 4 live-pipeline fixes + hero layout (2e58df5) | User listening feedback → prompt tuning; GSB re-probe | 🟢 active |

## Recently finished (last 5)
- 2026-07-17 AT6 LIVE PASS: real playlist created + re-export same id; resolve cascade (5/22→20/24), /me/playlists fix, replace pass wired + verified, CLI adapters neutral-cwd + stdin (2e58df5)
- 2026-07-17 Hero layout: empty state centered composer, all themes; controls-row rebuilt (2e58df5)
- 2026-07-17 Verify isolation (SETFLOW_DATA_DIR) + purged 52 mock sets from user history (2e58df5)
- 2026-07-16 Server security round: disconnect token-wipe, fetch timeouts everywhere, GSB parse guard, settings corrupt-file backup, PKCE session TTL, swap schema, postMessage removal (4a34719)
- 2026-07-15 Theory/client round: store races (setSeq/starSeq), toggleStar rollback, unknown-BPM-as-perfect-match (55d3f50)
