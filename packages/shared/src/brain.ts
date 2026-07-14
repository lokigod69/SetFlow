import { z } from 'zod';
import type { Intent, Constraints } from './intent.js';
import type { CurvePoint } from './curve.js';

/**
 * The strict-JSON contract between SETFLOW and the brain (LLM).
 * These schemas parse raw model output — keep them forgiving on types
 * (coerce numbers) but strict on shape. The brain is trusted for taste,
 * not facts: est* fields are priors, verified later by the pipeline.
 */

export const BrainTrackSchema = z.object({
  artist: z.string().min(1),
  title: z.string().min(1),
  /** exact mix/remix name; '' or omitted for original mix */
  mix: z.string().default(''),
  estBpm: z.coerce.number().min(40).max(220),
  /** Camelot, e.g. "8A" — parse failures downgrade to unknown, never reject the pool */
  estKey: z.string().default(''),
  estEnergy: z.coerce.number().min(1).max(10),
  moodTags: z.array(z.string()).default([]),
  /** e.g. "opener", "build", "peak", "cooldown" */
  slot: z.string().default(''),
  why: z.string().default(''),
});
export type BrainTrack = z.infer<typeof BrainTrackSchema>;

export const BrainTransitionSchema = z.object({
  blend: z.enum(['long-blend', 'quick-cut', 'breakdown-swap']).catch('long-blend'),
  note: z.string().default(''),
});

export const BrainOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().default(''),
  rationale: z.string().default(''),
  /** indices into pool[], in play order */
  order: z.array(z.coerce.number().int().min(0)),
  /** length = order.length - 1; tolerate mismatch, server pads/truncates */
  transitions: z.array(BrainTransitionSchema).default([]),
});
export type BrainOption = z.infer<typeof BrainOptionSchema>;

export const BrainProposalSchema = z.object({
  pool: z.array(BrainTrackSchema).min(1),
  options: z.array(BrainOptionSchema).min(1),
  /** optional: the brain's own predicted arc per option id, energies 1–10 */
  arcs: z.record(z.string(), z.array(z.coerce.number())).default({}),
});
export type BrainProposal = z.infer<typeof BrainProposalSchema>;

/** Replacement call: same shape, but only replacement tracks. */
export const BrainReplacementSchema = z.object({
  replacements: z.array(
    z.object({
      /** pool index (or track id) of the unresolvable track being replaced */
      replacesIndex: z.coerce.number().int().min(0),
      track: BrainTrackSchema,
    }),
  ),
});
export type BrainReplacement = z.infer<typeof BrainReplacementSchema>;

/** Swap-a-track call: alternatives that keep both neighbors compatible. */
export const BrainAlternativesSchema = z.object({
  alternatives: z.array(BrainTrackSchema).min(1).max(5),
});
export type BrainAlternatives = z.infer<typeof BrainAlternativesSchema>;

// ---------------------------------------------------------------------------
// Requests (server → adapter). One adapter interface, five call kinds.
// ---------------------------------------------------------------------------

export interface BrainContext {
  intent: Intent;
  constraints: Constraints;
  targetCurve: CurvePoint[] | null;
}

export type BrainRequest =
  | { kind: 'propose'; context: BrainContext }
  | {
      kind: 'replace';
      context: BrainContext;
      /** current pool as compact lines, and which entries failed to resolve */
      poolSummary: string;
      unresolved: { index: number; artist: string; title: string; mix: string; slot: string }[];
    }
  | {
      kind: 'finalize';
      context: BrainContext;
      /** starred tracks only, with verified data — order these into the best journey */
      starredSummary: string;
    }
  | {
      kind: 'fix-transition';
      context: BrainContext;
      optionSummary: string;
      problem: string; // e.g. "transition 4→5 clashes: 8A→3B, +9.2% BPM"
    }
  | {
      kind: 'alternatives';
      context: BrainContext;
      target: string; // the track to swap, compact line
      neighbors: string; // prev/next compact lines with verified key/bpm
    };

export type BrainAdapterId = 'claude-cli' | 'codex-cli' | 'anthropic-api';

export interface BrainAdapterInfo {
  id: BrainAdapterId;
  label: string;
  available: boolean;
  detail: string; // e.g. resolved CLI path or "not found on PATH"
}

/** Server-side adapter contract (spec §3.1). */
export interface BrainAdapter {
  id: BrainAdapterId;
  /** raw call: prompt in, model text out (JSON expected; caller parses/repairs) */
  complete(prompt: string, opts?: { timeoutMs?: number }): Promise<string>;
  /** cheap availability probe for settings UI */
  probe(): Promise<BrainAdapterInfo>;
}
