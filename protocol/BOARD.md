# BOARD — SETFLOW — updated 2026-07-16 (checkpoint 6)

## ⚠️ WAITING ON YOU
- Nothing blocking. Optional: be present for live AT6 (real Spotify playlist test — say "run live AT6"); mention if GetSongBPM emails a key-activation confirmation.

## Workstreams
| Workstream | Phase/Gate | Last done | Next | State |
|---|---|---|---|---|
| main | Hardened, awaiting live AT6 + GSB activation | Adversarial review complete: 10 verified fixes (theory/client + server security) | Live AT6 with user; GSB key re-probe | 🟢 active |

## Recently finished (last 5)
- 2026-07-16 Server security round: disconnect token-wipe, fetch timeouts everywhere, GSB parse guard, settings corrupt-file backup, PKCE session TTL, swap schema, postMessage removal (4a34719)
- 2026-07-15 Theory/client round: store races (setSeq/starSeq), toggleStar rollback, unknown-BPM-as-perfect-match (55d3f50)
- 2026-07-15 Settings-drawer blank bug (analyzer proxy timeout + resilient load) (99be52a)
- 2026-07-15 Spotify connect verified end-to-end as real account; GetSongBPM key saved (inactive upstream)
- 2026-07-15 Repo public + Pages live with GetSongBPM backlink
