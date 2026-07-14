# SETFLOW — AI DJ Set Architect
### Build specification v1.0 — for Fable (orchestrator), autonomous build, user tests at the end only

---

## 0. Read this first (orchestrator instructions)

- **You (Fable) orchestrate.** Use **Codex as a skill** for heavy code generation wherever possible. Delegate low-level plumbing (file IO, API clients, glue, config, tests) to **Opus/Sonnet sub-agents**.
- **Load and apply the user's local skills:** `taste`, `apple design` (animations/interaction feel), `brain`, and `protocol OS`. These govern aesthetics, interaction polish, and your autonomous working protocol.
- **The user will NOT be in the loop.** Make every decision yourself. Build fully, self-verify against §10 acceptance tests, and only then hand over.
- **Graphing widget:** the user will attach/link their own graphing widget ("ditter graph") in the kickoff prompt. Treat it as the preferred renderer for the Energy Arc (§4). Build the arc component against an adapter interface so the widget can be dropped in; ship a clean fallback renderer (SVG/canvas) so the app works without it.
- **Hard boundary:** this app NEVER downloads, rips, or touches audio acquisition. It outputs setlists, Spotify playlists, YouTube links, and export files. File sourcing is the user's own concern, outside this software. Local audio analysis (§6) only operates on files the user already has on disk.

---

## 1. Product vision

A local web app for a bedroom DJ learning to mix. The user expresses an intent — a seed track, a start+end pair, a vibe sentence, a set of artists, or a drawn emotional curve — and the app architects a **set**: an ordered journey of tracks with a deliberate emotional/energy arc, harmonic (key) compatibility, and manageable BPM transitions.

It is a tool for translating a *feeling* into a *tracklist*. The AI is the taste engine; the data layer keeps it honest.

Core loop:
1. Express intent → 2. AI proposes a candidate pool (20–30 tracks) in two arrangements (Option A / Option B) → 3. Every track is verified & enriched with real data → 4. User previews via auto-created Spotify playlist → 5. User curates down to ~10 → 6. Export (Spotify playlist, YouTube links, M3U/CSV/text) → 7. User sources files themselves → 8. (Optional) local analyzer measures the real files and re-validates the set order.

---

## 2. Modes of set creation

All modes share the same output pipeline (§5). Modes differ only in the intent payload sent to the brain.

1. **Seed Track** — one track (specific remix matters). Controls: set size (count or target duration), same-vibe / rising-energy / genre-locked / genre-blend.
2. **A→B Journey** — start track + end track; the app plots the path between them (key path on the Camelot wheel, BPM ramp, mood transition).
3. **Vibe Prompt** — no track at all. Free text: "golden hour Brazil beach party", "ice-cold deep philosophical journey, no vocals". Optional constraints: genre include/exclude, vocals on/off, era, BPM range.
4. **Artist Mesh** — user lists artists; the app finds tracks *across* those artists that mesh into one coherent set (not a greatest-hits shuffle — a journey that happens to weave them).
5. **Curve-First** — user draws the energy arc first (§4), then adds any of the above as flavor. The curve is the contract; tracks are chosen to trace it.

Cross-mode controls (surfaced minimally; full versions live in Advanced Settings §8):
- Set size: track count **or** target minutes (sum of durations).
- Energy behavior: flat / rise / rise-peak-cooldown / custom curve.
- Harmonic strictness: strict Camelot neighbors ↔ loose.
- BPM policy: max delta per transition (default ±4–6%), allow half/double-time reads.
- Vocal density, era window, explicit remix preference ("prefer extended/club mixes").

---

## 3. The Brain (AI layer)

### 3.1 Pluggable brain adapters — CLI-first (quota, not API cost)
Implement a `BrainAdapter` interface with three implementations, selectable in settings:
- **Claude Code CLI** — spawn `claude -p "<prompt>" --output-format json` (headless/print mode) as a subprocess; parse JSON.
- **Codex CLI** — spawn codex in exec/non-interactive mode with the prompt; parse JSON.
- **Anthropic API** — optional fallback for when no CLI is installed.

Adapter contract: `propose(intent, constraints, context) → CandidatePoolJSON`. Enforce strict JSON-only output in the prompt; strip fences; retry once on parse failure with a "return only valid JSON" repair prompt. Timeouts + graceful error surfaces.

### 3.2 What the brain is asked for — and what it is NOT trusted on
The brain is trusted for **taste**: which tracks fit the vibe, the arc logic, why a transition works emotionally, genre adjacency, remix knowledge, ordering rationale.

The brain is **not trusted** for facts: BPM, key, duration, even track existence. It must still *estimate* BPM/key/energy per track (useful as a prior), but every value is marked `unverified` until the data pipeline (§5) confirms or corrects it. Tracks that cannot be resolved on Spotify are flagged and auto-replaced by a follow-up brain call ("replace these 3 unresolvable tracks, same slot in the arc").

### 3.3 Proposal shape
For any intent, the brain returns:
- `pool`: 20–30 candidates, each: artist, title, exact mix/remix, est. BPM, est. key (Camelot), est. energy 1–10, mood tags, slot-in-arc hint, one-line "why it belongs".
- `optionA` and `optionB`: two distinct orderings/journeys drawn from the pool (different curve interpretation or different genre pathing), each with per-transition notes: key relation, BPM delta, energy step, suggested blend character (long blend / quick cut / breakdown swap).
- `arc`: the predicted energy curve of each option as a number series (feeds the graph, §4).

---

## 4. Energy Arc (the signature interaction)

An editable curve of energy-over-set-position:
- **Draw mode:** drag control points to author the intended journey (Curve-First mode) or reshape a proposal.
- **Predict mode:** the app plots the *predicted* arc of Option A/B from per-track energy values (brain estimate first, verified data when available), overlaid on the user's target curve — the gap is visible.
- Tracks render as nodes on the curve: tap → track card (art, BPM, key badge on a mini Camelot wheel, verification status, why-it-fits, transition note to next track).
- **Renderer adapter:** integrate the user's graphing widget when provided; SVG fallback otherwise. Smooth, Apple-grade animation on reorder/replace (curve morphs, nodes glide).

---

## 5. Data & verification pipeline

Every brain proposal flows through: **proposed → resolved → enriched → validated**.

1. **Resolve (Spotify Web API):** OAuth (PKCE, user's own free dev app credentials; first-run guided setup screen). Search each candidate (artist + title + mix). Exact-mix matching matters — prefer results whose title contains the named remix. Unresolved → flagged → brain replacement call. This step is also the **hallucination filter**.
2. **Enrich (BPM/key/duration):**
   - Note: Spotify's audio-features endpoint is unavailable to new apps — do not depend on it (attempt it once at runtime; use it only if the credentials happen to have access).
   - Primary free sources, tried in order with caching: **Deezer API** (BPM for many tracks, no auth for public data), **GetSongBPM API** (free key, attribution required — put attribution in the footer/about).
   - Duration always available from Spotify metadata.
   - Anything still unknown keeps the brain's estimate, badged `≈ estimated`.
3. **Validate:** check the ordered set against rules — Camelot compatibility per transition (same, ±1, relative major/minor; configurable strictness), BPM delta within policy, energy steps roughly monotone with the target curve. Violations render as amber warnings on the transition, with a one-tap "fix this transition" (brain micro-call: reorder or substitute).
4. **Ground truth (local, optional — §6).**

**Caching:** SQLite (or JSON store) keyed by Spotify track ID: metadata, BPM/key per source, brain annotations. Never re-fetch what's cached.

---

## 6. Local Library Analyzer (ground truth)

A small local analysis service (Python: `librosa` for BPM, `essentia` or `keyfinder-cli` for key; whichever installs cleanest — pick one, wrap the other as optional):
- User points it at their music folder (the files they sourced themselves). It scans, fingerprints by filename/tag match against the set, and measures **real** BPM and key.
- Measured values override estimates everywhere (badge flips to `✓ measured`), and the set is re-validated — "you planned 8A→9A, but your file is actually 4B; here's a reorder that fixes it."
- Also useful standalone: a Library view of everything analyzed, filter by key/BPM — a lightweight crate.

---

## 7. Outputs & exports

- **Spotify playlist (headline feature):** one tap → creates a private playlist "SETFLOW — {set name}" in the user's account with the chosen tracks in set order (Option A, B, or curated selection). Re-export after edits updates the same playlist. This is the pre-listen loop.
- **YouTube links:** per track, a best-guess YouTube search/watch link (via YouTube search-results URL construction, or Data API if a key is provided in settings). Copy-all button.
- **Files:** `.m3u8` (in set order, pointing at library files when the analyzer has matched them), `.csv` (full data: order, artist, title, mix, BPM, key, energy, transition notes), plain-text tracklist, and Rekordbox-compatible XML playlist (nice-to-have, behind Advanced).
- **Set sheet:** printable/exportable one-pager — the arc graph, tracklist, per-transition cheat notes. This is what sits next to the decks while practicing.

---

## 8. UX architecture

**Surface: radically clean.** One intent bar ("Start with a track, artists, or a feeling…"), mode chips, the arc, the two option columns, and the curation tray. That's it.

**Depth: Advanced Settings** (a drawer, not a page-wall): brain adapter choice & CLI paths, harmonic strictness, BPM policy, energy model tuning, source toggles (Deezer/GetSongBPM/YouTube key), cache controls, export formats, analyzer folder config, prompt-template editor (power feature: the user can see/edit the brain prompt templates).

**Curation flow:** pool of 20–30 → user stars ~10 → "Build final set" reorders the starred tracks into the best journey (brain call constrained to starred tracks + target curve). Swap-a-track: long-press any node → 3 alternatives that keep neighbors compatible.

**Set history:** every generated set is saved locally (name, intent, pool, choices, exports). Sets are remixable — "start from this set, but darker."

---

## 9. Interface themes (build all five, swappable live)

One layout skeleton + token system (color, type, radius, texture, motion curves); themes swap tokens and motion personality. A theme switcher lives in the top corner as a small, beautiful moment of its own. All five: impeccable spacing, minimal-artistic layout discipline, Apple-quality animation (respect `prefers-reduced-motion`). Apply the `taste` + `apple design` skills here; the directions below are briefs, not final token values — design them properly.

1. **Console** — old-school music tech. Warm dark hardware feel: brushed panels, VU-meter energy readouts, knurled-knob controls for strictness/BPM, monospaced data labels, amber/green indicator glow. The arc renders like an oscilloscope trace.
2. **Atelier** — extremely elegant, minimal, editorial. Light, gallery-white space, one characterful serif display face, hairline data tables, the arc as a single ink brushstroke. Feels like a printed program for a concert.
3. **Meridian** — futuristic glass. Deep gradient atmosphere, translucent layered panels, soft depth and glow, fluid spring physics on every interaction; the arc is luminous and alive. (Futuristic without defaulting to acid-green-on-black.)
4. **Crate** — analog crate-digging. Paper and cardboard textures, record-sleeve track cards, stamped/label typography, tactile drag-to-reorder like flipping through vinyl; energy shown as groove-depth.
5. **Horizon** — the "golden hour" theme. Warm dusk gradients that subtly shift with the set's average energy/mood, rounded geometry, airy spacing; the arc reads like a sun path. Calm, beach-party-ready.

---

## 10. Tech stack & acceptance tests

**Stack (recommendation — Fable may deviate with reason):** local-first web app. Frontend: React + Vite, token-based theme system, framer-motion-grade animation. Backend: Node (Express/Fastify) for Spotify OAuth, brain-adapter subprocess management, enrichment, cache (SQLite). Analyzer: Python sidecar service. One-command start (`npm run dev` / packaged script) on both the user's Windows PC and Mac.

**Acceptance tests (self-verify before handover — the user only checks these):**
1. Seed-track mode with a named remix returns a 20–30 pool + Option A/B, each track Spotify-resolved or flagged-and-replaced.
2. Vibe-prompt mode ("golden hour brazil beach party") produces a coherent, ordered set with transition notes.
3. A→B mode produces a set whose first/last tracks are the given ones and whose key/BPM path is valid under default policy.
4. Artist-mesh mode with 3 artists returns a set interleaving them with valid transitions.
5. Energy arc: draw a custom curve → regenerate → predicted arc visibly tracks the target; nodes open track cards.
6. One tap creates a real private Spotify playlist in correct order; re-export updates it.
7. BPM/key badges show source status (measured / verified / estimated); at least one enrichment source returns real data.
8. Local analyzer measures BPM+key of a folder of MP3s and overrides estimates; a deliberate key mismatch triggers a reorder suggestion.
9. All five themes switch live with no layout breakage; animations honor reduced-motion.
10. Brain adapter works via Claude Code CLI subprocess (no API key configured); switching to Codex CLI in settings also works.
11. Exports produce valid .m3u8, .csv, text tracklist, and YouTube link list.
12. The app contains no download/rip functionality of any kind.

---

## 11. Ideas added beyond the original brief (build the ones marked ●, park the rest in a ROADMAP.md)

● **Transition cheat notes** on every pair (key relation, BPM delta, suggested blend style) — this is what actually teaches mixing.
● **Set sheet** printable one-pager for the decks.
● **Swap-a-track** with neighbor-aware alternatives.
● **Set history + "remix this set"**.
● **Camelot mini-wheel** on track cards (quiet music-theory education by osmosis).
○ Practice log: after a session, mark which transitions worked/failed; the brain learns the user's taste per feedback and biases future sets.
○ "Double-drop finder": pairs in the pool that could layer (same key, compatible BPM, complementary energy).
○ Tempo-journey templates: warm-up / peak-time / sunset / after-hours presets that pre-shape the curve.
○ TEMENOS-style export of the "emotional intent → realized set" pairing to the user's other apps, if ever wanted.
