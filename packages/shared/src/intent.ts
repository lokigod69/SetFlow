import { z } from 'zod';

/** The five modes of set creation (spec §2). */
export const IntentModeSchema = z.enum(['seed', 'journey', 'vibe', 'artist-mesh', 'curve-first']);
export type IntentMode = z.infer<typeof IntentModeSchema>;

export const CurvePointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const IntentSchema = z.object({
  mode: IntentModeSchema,
  /** Seed mode: "Artist – Title (Specific Remix)" free text; exact mix matters. */
  seedTrack: z.string().optional(),
  /** Journey mode. */
  startTrack: z.string().optional(),
  endTrack: z.string().optional(),
  /** Vibe mode — also usable as flavor text in every other mode. */
  vibeText: z.string().optional(),
  /** Artist-mesh mode. */
  artists: z.array(z.string()).optional(),
  /** Curve-first mode: the drawn curve is the contract. */
  targetCurve: z.array(CurvePointSchema).optional(),
});
export type Intent = z.infer<typeof IntentSchema>;

export const SetSizeSchema = z.object({
  type: z.enum(['count', 'minutes']),
  value: z.number().positive(),
});

export const ConstraintsSchema = z.object({
  setSize: SetSizeSchema.default({ type: 'count', value: 10 }),
  energyBehavior: z.enum(['flat', 'rise', 'rise-peak-cooldown', 'custom']).default('rise-peak-cooldown'),
  /** 0 loose … 1 strict Camelot neighbors only */
  harmonicStrictness: z.number().min(0).max(1).default(0.8),
  bpmPolicy: z
    .object({
      maxDeltaPercent: z.number().min(1).max(25).default(6),
      allowHalfDouble: z.boolean().default(true),
    })
    .default({ maxDeltaPercent: 6, allowHalfDouble: true }),
  vocals: z.enum(['any', 'prefer-vocal', 'prefer-instrumental', 'no-vocals']).default('any'),
  eraWindow: z.object({ from: z.number().optional(), to: z.number().optional() }).optional(),
  bpmRange: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  genresInclude: z.array(z.string()).default([]),
  genresExclude: z.array(z.string()).default([]),
  preferExtendedMixes: z.boolean().default(true),
  /** seed-mode flavor (spec §2.1) */
  seedStrategy: z.enum(['same-vibe', 'rising-energy', 'genre-locked', 'genre-blend']).default('same-vibe'),
});
export type Constraints = z.infer<typeof ConstraintsSchema>;

export const DEFAULT_CONSTRAINTS: Constraints = ConstraintsSchema.parse({});
