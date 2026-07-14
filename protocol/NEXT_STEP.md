# NEXT STEP — SETFLOW/main — updated 2026-07-14 (checkpoint 3)

## FOR YOU
**Start the app:** double-click **SETFLOW** on your Desktop (or `SetFlow.cmd` in the repo). It starts everything and opens the browser. Analyzer included — its venv is already installed.

**1. Spotify (5 min — unlocks real playlists):** at developer.spotify.com/dashboard → Create app →
   - App name: `SetFlow` · Description: anything (e.g. "AI DJ set planner")
   - Redirect URI — exactly: `http://127.0.0.1:8321/auth/spotify/callback`
   - Which API/SDKs: check **Web API** only. (Ignore the "top 5 tracks" tutorial page — that's just Spotify's demo.)
   - Copy the **Client ID** (no secret needed — we use PKCE) → SETFLOW Settings → Spotify → paste → connect.

**2. GetSongBPM key (adds musical-key data; needs a public backlink FIRST):**
   - Create a GitHub repo for SetFlow (public) and push, or say "publish the backlink page" and I'll walk it.
   - Repo → Settings → Pages → deploy from branch `main`, folder `/docs` → note the URL (e.g. `https://<you>.github.io/SetFlow/`). The page is already in the repo (`docs/index.html`, contains the required GetSongBPM link).
   - Then at getsongbpm.com/api fill: **Website URL** = that Pages URL · **Backlink URL** = same URL · **Email** = yours. Key arrives by email → SETFLOW Settings → Sources → paste → save.
   - Don't remove the Pages page afterwards — they suspend keys whose backlink disappears.

## PASTE THIS
Resume SETFLOW/main under protocol-os.
Read protocol/PROTOCOL.md and this file, plus memory/INDEX.md and memory/STATE.md.
Verify: `npm run verify` in D:\CODING\SetFlow — expect 8 PASS + 2 PARTIAL (live-flag variants already proven; see verify/EVIDENCE.md).
Then per memory/STATE.md → Next actions: if the user pasted a GetSongBPM key, live-verify one enrich call (key_of → Camelot, source `getsongbpm`); remaining QA niceties (set-sheet print, tray stick, SetHistory label). Mode 1.
Work in long runs; checkpoint and Status Block only per protocol-os Iron Rules.
