import {
  sampleCurve,
  presetCurve,
  type BrainAdapter,
  type BrainAdapterInfo,
  type BrainProposal,
  type BrainRequest,
  type BrainTrack,
} from '@setflow/shared';

/**
 * Deterministic mock brain (SETFLOW_MOCK=1 and tests). Unlike a canned blob,
 * it honors the request: set size, journey endpoints, seed track, artist mesh,
 * and the target curve — and assigns keys as a Camelot walk along Option A so
 * the validation pipeline is exercised on data that can actually pass.
 */

const SEED: [string, string, string][] = [
  ['Lane 8', 'Atlas', 'Extended Mix'],
  ['Ben Böhmer', 'Beyond Beliefs', 'Extended Mix'],
  ['Yotto', 'The One You Left Behind', 'Original Mix'],
  ['Tinlicker', 'Because You Move Me', 'Extended Mix'],
  ['&ME', 'As If', 'Original Mix'],
  ['Adriatique', 'Home', 'Original Mix'],
  ['Lane 8', 'Fingerprint', 'Extended Mix'],
  ['Ben Böhmer', 'Breathing', 'Extended Mix'],
  ['Yotto', 'Walls', 'Original Mix'],
  ['Tinlicker', 'Children', 'Extended Mix'],
  ['Marsh', 'Lailonie', 'Original Mix'],
  ['Nora En Pure', 'Birthright', 'Extended Mix'],
  ['Sultan + Shepard', 'Assassin', 'Extended Mix'],
  ['Le Youth', 'I Will Leave a Light On', 'Extended Mix'],
  ['Eli & Fur', 'You and I', 'Original Mix'],
  ['Jody Wisternoff', 'For All Time', 'Extended Mix'],
  ['Jerro', 'Tunnel Vision', 'Original Mix'],
  ['Dosem', 'Extraction', 'Original Mix'],
  ['RÜFÜS DU SOL', 'Innerbloom', 'Sasha Remix'],
  ['Kölsch', 'Grey', 'Original Mix'],
  ['ARTBAT', 'Upperground', 'Original Mix'],
  ['CamelPhat', 'Constellations', 'Original Mix'],
  ['WhoMadeWho', 'Abu Simbel', 'Original Mix'],
  ['Mind Against', 'Walking Away', 'Original Mix'],
];

/** "Artist – Title (Some Mix)" → parts; tolerant of '-' vs '–'. */
function parseRef(s: string | undefined): { artist: string; title: string; mix: string } | null {
  if (!s) return null;
  const mixMatch = /\(([^)]+)\)\s*$/.exec(s);
  const mix = mixMatch?.[1] ?? '';
  const body = s.replace(/\(([^)]+)\)\s*$/, '').trim();
  const parts = body.split(/\s+[–—-]\s+/);
  if (parts.length < 2) return { artist: body, title: body, mix };
  return { artist: parts[0]!.trim(), title: parts.slice(1).join(' - ').trim(), mix };
}

function desiredCount(request: Extract<BrainRequest, { kind: 'propose' | 'finalize' }> | BrainRequest): number {
  const c = 'context' in request ? request.context.constraints : undefined;
  if (!c) return 10;
  const n = c.setSize.type === 'count' ? c.setSize.value : Math.round(c.setSize.value / 5.5);
  return Math.max(4, Math.min(24, Math.round(n)));
}

function buildProposal(request: BrainRequest): BrainProposal {
  const intent = 'context' in request ? request.context.intent : undefined;
  const constraints = 'context' in request ? request.context.constraints : undefined;
  const artists = intent?.artists?.length ? intent.artists : null;

  // pool of 24, mesh mode re-weaves the artist names the user asked for
  const pool: BrainTrack[] = SEED.map(([artist, title, mix], i) => ({
    artist: artists ? artists[i % artists.length]! : artist,
    title,
    mix,
    estBpm: 116 + (i % 12),
    estKey: '',
    estEnergy: Math.max(1, Math.min(10, 3 + Math.round((i / 23) * 6))),
    moodTags: ['melodic', i % 2 ? 'deep' : 'driving'],
    slot: i < 6 ? 'opener' : i > 18 ? 'peak' : 'build',
    why: 'Sits naturally in the arc and shares the melodic language of its neighbors.',
  }));

  // seed / journey endpoints become real pool entries
  const seedRef = parseRef(intent?.seedTrack);
  if (seedRef) pool[0] = { ...pool[0]!, ...seedRef };
  const startRef = parseRef(intent?.startTrack);
  const endRef = parseRef(intent?.endTrack);
  if (startRef) pool[0] = { ...pool[0]!, ...startRef };
  if (endRef) pool[pool.length - 1] = { ...pool[pool.length - 1]!, ...endRef };

  const n = desiredCount(request);
  const curve = ('context' in request ? request.context.targetCurve : null) ??
    presetCurve(constraints?.energyBehavior && constraints.energyBehavior !== 'custom' ? constraints.energyBehavior : 'rise-peak-cooldown');
  const wanted = sampleCurve(curve, n).map((y) => 1 + y * 9);

  // greedy pick: nearest-energy unused pool track per slot (endpoints pinned)
  const used = new Set<number>();
  if (startRef || seedRef) used.add(0);
  if (endRef) used.add(pool.length - 1);
  const pick = (energy: number): number => {
    let best = -1;
    let bestErr = Infinity;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      const err = Math.abs(pool[i]!.estEnergy - energy);
      if (err < bestErr) { bestErr = err; best = i; }
    }
    used.add(best);
    return best;
  };
  const orderA: number[] = [];
  for (let s = 0; s < n; s++) {
    if (s === 0 && (startRef || seedRef)) { orderA.push(0); continue; }
    if (s === n - 1 && endRef) { orderA.push(pool.length - 1); continue; }
    orderA.push(pick(wanted[s]!));
  }

  // Camelot walk along option A: same/±1 on the ring, ring-flips only as pure
  // relative moves (num step 0), so the whole path validates under strict mode
  const walk = [0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0];
  let num = 8;
  orderA.forEach((poolIdx, s) => {
    num = ((num - 1 + walk[s % walk.length]!) % 12) + 1;
    pool[poolIdx]!.estKey = `${num}${s % 5 === 4 ? 'B' : 'A'}`;
  });
  // BPM ramp along the journey keeps deltas within default policy
  orderA.forEach((poolIdx, s) => {
    pool[poolIdx]!.estBpm = Math.round(118 + (s / Math.max(1, n - 1)) * 8);
  });
  // leftover pool tracks get plausible keys/bpm too
  pool.forEach((t, i) => {
    if (!t.estKey) t.estKey = `${(i % 12) + 1}${i % 3 ? 'A' : 'B'}`;
  });

  // option B: same endpoints, different pathing (swap interior pairs)
  const orderB = [...orderA];
  for (let i = 1; i + 2 < orderB.length; i += 2) {
    [orderB[i], orderB[i + 1]] = [orderB[i + 1]!, orderB[i]!];
  }

  const mk = (order: number[], id: string, label: string, rationale: string) => ({
    id,
    label,
    rationale,
    order,
    transitions: order.slice(1).map((_, i) => ({
      blend: (i % 3 === 2 ? 'breakdown-swap' : 'long-blend') as 'breakdown-swap' | 'long-blend',
      note: i % 3 === 2 ? 'Swap in the breakdown — both tracks strip back here.' : 'Long blend across 16 bars; let the pads overlap.',
    })),
  });

  return {
    pool,
    options: [
      mk(orderA, 'A', 'On-curve journey', 'Traces the target arc as closely as the pool allows.'),
      mk(orderB, 'B', 'Wandering path', 'Same endpoints, more tension in the middle third.'),
    ],
    arcs: {
      A: orderA.map((i) => pool[i]!.estEnergy),
      B: orderB.map((i) => pool[i]!.estEnergy),
    },
  };
}

export class MockBrainAdapter implements BrainAdapter {
  id = 'claude-cli' as const;
  async complete(_prompt: string): Promise<string> {
    return JSON.stringify(buildProposal({ kind: 'propose', context: { intent: { mode: 'vibe' }, constraints: undefined as never, targetCurve: null } }));
  }
  async probe(): Promise<BrainAdapterInfo> {
    return { id: this.id, label: 'Mock brain', available: true, detail: 'SETFLOW_MOCK=1' };
  }
  async request(request: BrainRequest): Promise<unknown> {
    if (request.kind === 'replace') {
      const fresh = buildProposal(request).pool;
      return {
        replacements: request.unresolved.map((u, i) => ({ replacesIndex: u.index, track: fresh[(i + 5) % fresh.length]! })),
      };
    }
    if (request.kind === 'alternatives') {
      return { alternatives: buildProposal(request).pool.slice(6, 9) };
    }
    if (request.kind === 'finalize') {
      // order over the starred tracks only — indices into the starred list
      const n = Math.max(2, request.starredSummary.split('\n').filter(Boolean).length);
      const order = Array.from({ length: n }, (_, i) => i);
      // gentle journey: evens ascending then odds descending ≈ rise-peak-cooldown
      const shaped = [...order.filter((i) => i % 2 === 0), ...order.filter((i) => i % 2 === 1).reverse()];
      return {
        pool: buildProposal(request).pool.slice(0, n),
        options: [
          {
            id: 'final',
            label: 'Final journey',
            rationale: 'Starred tracks ordered into the smoothest available arc.',
            order: shaped,
            transitions: shaped.slice(1).map(() => ({ blend: 'long-blend' as const, note: 'Ride the overlap.' })),
          },
        ],
        arcs: {},
      };
    }
    return buildProposal(request);
  }
}
