# Current State
Last updated: 2026-07-14

## What this is
AI DJ Set Architect: intent → verified, ordered tracklist with an editable energy arc, Spotify playlist export, and five swappable interface themes. Spec: `setflow-spec.md`. Built autonomously (Mode 1) to the twelve §10 acceptance tests.

## Working now
- (nothing built yet — foundation docs just installed)

## In progress
- Project bootstrap: brain + protocol installed, repo scaffold next.

## Known problems
- Spotify audio-features endpoint is unavailable to new dev apps — enrichment must lean on Deezer + GetSongBPM (spec §5.2 already accounts for this).
- Acceptance tests 6 (real Spotify playlist) and 10 (live CLI brain calls) need the user's Spotify dev-app credentials / installed CLIs at final verification — build against mocks first, verify live at the end.
- The user's "ditter graph" widget was NOT attached in the kickoff — build the ArcRenderer adapter + SVG fallback (spec §0/§4 covers this); widget drops in later.

## Open questions
- (none — Mode 1: decide, log in DECISIONS, proceed)

## Next actions
1. Scaffold monorepo: `client/` (React+Vite+TS), `server/` (Fastify+TS, better-sqlite3), `analyzer/` (Python FastAPI sidecar), npm workspaces, one-command `npm run dev`.
2. Backend core: BrainAdapter interface + Claude/Codex CLI + Anthropic API implementations; Spotify PKCE OAuth; enrichment chain (Deezer → GetSongBPM → estimate); Camelot/BPM validation engine; SQLite cache; export endpoints (m3u8/csv/txt/youtube).
3. Frontend skeleton: token-based theme system (5 themes), intent bar + mode chips, Energy Arc (SVG renderer behind adapter), option columns, curation tray, settings drawer, set history.
4. Analyzer sidecar: librosa BPM + key estimation, folder scan, tag/filename match, override + re-validate flow.
5. Self-verify against §10 acceptance tests; produce evidence artifacts; hand over with FOR-YOU list (Spotify creds, CLI availability).
