# NEXT STEP — SETFLOW/main — updated 2026-07-14 (checkpoint 2)

## FOR YOU
Nothing needed yet — the build is functionally complete and machine-verified. When you want to go live (5 minutes total):
1. Create a free Spotify dev app at developer.spotify.com/dashboard → set redirect URI exactly `http://127.0.0.1:8321/auth/spotify/callback` → paste the Client ID in Settings → Spotify → connect. This unlocks real track verification + one-tap playlists (AT6 live).
2. Optional: free API key from getsongbpm.com → Settings → Sources (adds musical-key enrichment; Deezer BPM already works keyless).
3. Optional (ground truth): `cd analyzer; python -m venv .venv; .venv\Scripts\python.exe -m pip install -r requirements.txt; .venv\Scripts\python.exe run.py`, then point Settings → Analyzer at your music folder.
Start the app: `npm run dev` → http://localhost:5173 (add `SETFLOW_MOCK=1` env to demo without any accounts).

## PASTE THIS
Resume SETFLOW/main under protocol-os.
Read protocol/PROTOCOL.md and this file, plus memory/INDEX.md and memory/STATE.md.
Verify: `npm run verify` in D:\CODING\SetFlow — expect 8 PASS + 2 PARTIAL (partials are live-flag variants, already proven; see verify/EVIDENCE.md).
Then: final QA sweep per memory/STATE.md → Next actions (drawer visual re-check, set-sheet print, tray stick), then handover polish. Mode 1.
Work in long runs; checkpoint and Status Block only per protocol-os Iron Rules.
