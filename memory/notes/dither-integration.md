# DitherKit / dither styling in SETFLOW
Created: 2026-07-14

## Source situation
- User pointed at https://www.tripwire.sh/dither-kit (author ripgrim / Boring-Software-Inc): shadcn-registry of copy-in React components — Bayer-dithered canvas charts, gradients, buttons, avatars.
- **Repo has NO license** (`license: null`, no LICENSE file) → verbatim reuse/redistribution not granted. Decision: clean-room reimplementation of the (public-domain) technique. See [[DECISIONS]] if this ever changes (e.g. upstream adds MIT).
- Clean-room core lives canonically in the global skill `~/.claude/skills/ditherkit/references/dither-core.ts` (mirrored notice for Codex at `~/.codex/skills/ditherkit/`), vendored into this repo at `client/src/fx/dither-core.ts` (18.8 KB, zero deps, strict-TS clean, Bayer matrix runtime-verified).

## What the vendored core offers
`bayerThresholds`/`BAYER4`, `backingSize` (low-res canvas + `image-rendering: pixelated`), `paintGradient` (dissolve-to-transparent + two-tone), `paintAreaFill` + `resampleLinear` (dither fill under a curve — made for the Energy Arc), `ditherImageToCanvas` (arbitrary images — upstream can't do this), `bloomLayerCss` (blur/brightness/saturate + `plus-lighter`), `createIntensityEaser` (rAF hover easing, reduced-motion snap), `observeAndPaint`, `mountDitherGradient`.

## Planned use in SETFLOW (theme polish phase)
- **Console theme:** dithered amber/green gradient washes behind panels; optionally dither-filled area under the oscilloscope-style arc trace (canvas overlay clipped to arc region, `paintAreaFill` fed by the arc's spring-field samples).
- **Crate theme:** coarse-cell (4–5px) paper-tone dither texture on panel backdrops — cardboard grain.
- Other themes stay clean (Meridian/Horizon get glow, Atelier stays ink-pure).
- Respect reduced-motion: dither repaint only on resize/theme change, no animation loops except opt-in hover easing.
