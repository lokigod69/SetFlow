# Protocol — SETFLOW
Mode: 1 Autopilot  (set 2026-07-14, mandated by setflow-spec.md §0: user not in the loop)
Brain: memory/ — coordination here, memory there
Definition of v1-done: All twelve acceptance tests in setflow-spec.md §10 pass, machine-verified with evidence artifacts in `verify/`; tests needing user-held resources (Spotify dev credentials, live listening) are built, mock-verified, and reduced to mechanical FOR-YOU steps.
Decision rights: mode-standard (decide, log rationale in memory/DECISIONS.md, proceed; wrong guesses acceptable, stalls not)
Human's standing duties: paste NEXT_STEP on context resets; at handover: create Spotify dev app + paste credentials, run the acceptance script, listen-test a set.
Workstreams: main
Custom rules for this project: Hard boundary — no audio download/rip/acquisition code, ever (spec §0). Delegation layer active (Fable orchestrates; codex = primary executor, sonnet/opus sub-agents for plumbing/taste work). Aesthetics governed by taste/apple-design skills; all five themes are first-class deliverables, not afterthoughts.
