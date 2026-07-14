# SETFLOW — Memory Index
Last updated: 2026-07-14

> SETFLOW is a local-first web app for a bedroom DJ learning to mix: the user expresses an intent (seed track, A→B pair, vibe sentence, artist list, or a drawn energy curve) and an AI "brain" (Claude Code CLI / Codex CLI subprocess) architects an ordered DJ set with a deliberate energy arc, harmonic (Camelot) compatibility, and manageable BPM transitions — every AI claim verified against real data (Spotify resolve, Deezer/GetSongBPM enrichment, optional local librosa analysis). Phase: greenfield build from `setflow-spec.md`, Mode 1 Autopilot, built autonomously to the §10 acceptance tests.

## Map

| File | What it holds | Read when |
|---|---|---|
| [[STATE]] | Current truth: works / in progress / problems / next actions | Every session |
| [[DECISIONS]] | Why things are the way they are | Before changing direction |
| [[ARCHITECTURE]] | How the system is built | Before touching structure |
| [[LOG]] | Dated session journal, newest first | Catching up on recent work |
| raw/ | Untouched captures: pasted chats, research, prompts | Only when hunting a source |
| notes/ | Compiled topic pages | When INDEX points you there |
| archive/ | Rolled-off log entries and retired notes | Almost never |

## Topic notes
<!-- One line per page in notes/, added when created -->
*(none yet)*

## Rules for agents
Read [[STATE]] at session start; open the rest only when needed. After meaningful work: prepend [[LOG]], refresh [[STATE]], append decisions to [[DECISIONS]]. Update, don't duplicate. Date everything. Mark wrong things `⚠️ superseded` — never leave known-false statements looking current. Never edit raw/. Full protocol: SecondBrainOS/PROTOCOL.md.
