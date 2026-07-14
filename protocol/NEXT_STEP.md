# NEXT STEP — SETFLOW/main — updated 2026-07-15 (checkpoint 5)

## FOR YOU
**Start the app:** double-click **SETFLOW** on your Desktop (or `SetFlow.cmd` in the repo).

**1. Connect Spotify — one click (now working):** the connect button was silently broken (it opened Settings instead of the login popup); fixed. In the SetFlow app top bar — the pill labeled **connect Spotify**, left of "history"/"settings" — click it, then log in in the popup with your **Cryptononobo** Spotify account (the one that owns the app) and approve. Your app is in Development mode, so only that account (or up to 5 you add under User Management on Spotify's dashboard) can log in — the owner is always allowed. That's the only step; once connected I can run the real-playlist test.

**2. GetSongBPM key (page is live now):** your backlink page is up at `https://lokigod69.github.io/SetFlow/`. At getsongbpm.com/api fill **Website URL** and **Backlink URL** both = that URL, **Email** = yours. Key arrives by email → SETFLOW Settings → Sources → paste → save. Don't take the Pages site down afterward (they suspend keys whose backlink disappears).

## PASTE THIS
Resume SETFLOW/main under protocol-os.
Read protocol/PROTOCOL.md and this file, plus memory/INDEX.md and memory/STATE.md.
Verify: `npm run verify` in D:\CODING\SetFlow — expect 8 PASS + 2 PARTIAL (live-flag variants already proven; see verify/EVIDENCE.md).
Then per memory/STATE.md → Next actions: if Spotify is connected, run live AT6 (real playlist create + re-export, then re-export updates the same playlist); if a GetSongBPM key was pasted, live-verify one enrich call (key_of → Camelot, source `getsongbpm`). Repo is public at github.com/lokigod69/SetFlow, Pages live. Mode 1.
Work in long runs; checkpoint and Status Block only per protocol-os Iron Rules.
