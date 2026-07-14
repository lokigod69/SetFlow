# NEXT STEP — SETFLOW/main — updated 2026-07-15 (checkpoint 4)

## FOR YOU
**Start the app:** double-click **SETFLOW** on your Desktop (or `SetFlow.cmd` in the repo).

**1. Spotify — one click left:** your Client ID is already saved in Settings. In the app top bar click **connect Spotify**, log in, approve. Done.

**2. Push the repo (I'm blocked on this — needs your approval/hands):** your GitHub repo exists at github.com/lokigod69/SetFlow but the code isn't pushed yet (my push was blocked by the permission layer). In a terminal in `D:\CODING\SetFlow`:
```
git remote add origin https://github.com/lokigod69/SetFlow.git
git push -u origin main
```
(Or just tell me "push it" and approve the prompt.) History is audited — no secrets were ever committed; settings.json is now untracked.

**3. After the push — GetSongBPM key:**
   - On GitHub: repo → Settings → Pages → deploy from branch `main`, folder `/docs` → note the URL (e.g. `https://lokigod69.github.io/SetFlow/`). Or tell me — I can enable Pages via `gh`.
   - At getsongbpm.com/api: **Website URL** = that Pages URL · **Backlink URL** = same · **Email** = yours. Key arrives by email → SETFLOW Settings → Sources → paste → save. Don't remove the Pages page afterwards.

## PASTE THIS
Resume SETFLOW/main under protocol-os.
Read protocol/PROTOCOL.md and this file, plus memory/INDEX.md and memory/STATE.md.
Verify: `npm run verify` in D:\CODING\SetFlow — expect 8 PASS + 2 PARTIAL (live-flag variants already proven; see verify/EVIDENCE.md).
Then per memory/STATE.md → Next actions: if the repo is pushed, enable/verify GitHub Pages (main, /docs); if a GetSongBPM key was pasted, live-verify one enrich call (key_of → Camelot, source `getsongbpm`); if Spotify is connected, run live AT6 (real playlist create + re-export). Mode 1.
Work in long runs; checkpoint and Status Block only per protocol-os Iron Rules.
