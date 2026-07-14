/**
 * Camelot wheel math — the harmonic backbone of SETFLOW.
 *
 * The wheel: 12 positions × 2 rings. Ring A = minor keys, ring B = major keys.
 * Compatible moves (classic harmonic mixing): same key, ±1 position on the same
 * ring (wraps 12→1), or the relative major/minor (same number, other ring).
 */

export type CamelotLetter = 'A' | 'B';

export interface CamelotKey {
  /** 1–12, position on the wheel */
  num: number;
  /** A = minor ring, B = major ring */
  letter: CamelotLetter;
}

export type KeyRelation =
  | 'same'
  | 'adjacent-up' // +1 on the wheel, same ring (e.g. 8A→9A)
  | 'adjacent-down' // -1 on the wheel, same ring
  | 'relative' // same number, other ring (relative major/minor)
  | 'energy-boost' // +2 same ring — spicy but usable when loose
  | 'diagonal' // ±1 and ring flip — borderline, loose-mode only
  | 'clash'
  | 'unknown';

/** Musical names per Camelot slot (canonical spellings used by DJs). */
const MINOR_NAMES: Record<number, string> = {
  1: 'A♭ minor', 2: 'E♭ minor', 3: 'B♭ minor', 4: 'F minor',
  5: 'C minor', 6: 'G minor', 7: 'D minor', 8: 'A minor',
  9: 'E minor', 10: 'B minor', 11: 'F♯ minor', 12: 'D♭ minor',
};
const MAJOR_NAMES: Record<number, string> = {
  1: 'B major', 2: 'F♯ major', 3: 'D♭ major', 4: 'A♭ major',
  5: 'E♭ major', 6: 'B♭ major', 7: 'F major', 8: 'C major',
  9: 'G major', 10: 'D major', 11: 'A major', 12: 'E major',
};

/** Normalized pitch-class spelling → camelot lookup, both rings. */
const NAME_TO_CAMELOT: Record<string, string> = {};
{
  // enharmonic spellings for each pitch class we accept
  const enharmonics: Record<string, string[]> = {
    'A♭': ['ab', 'g#', 'gsharp', 'aflat'],
    'E♭': ['eb', 'd#', 'dsharp', 'eflat'],
    'B♭': ['bb', 'a#', 'asharp', 'bflat'],
    'F': ['f'],
    'C': ['c'],
    'G': ['g'],
    'D': ['d'],
    'A': ['a'],
    'E': ['e'],
    'B': ['b', 'cb'],
    'F♯': ['f#', 'gb', 'fsharp', 'gflat'],
    'D♭': ['db', 'c#', 'csharp', 'dflat'],
  };
  const put = (names: Record<number, string>, letter: CamelotLetter) => {
    for (const [numStr, full] of Object.entries(names)) {
      const root = full.split(' ')[0]!; // e.g. 'A♭'
      for (const alias of enharmonics[root] ?? []) {
        NAME_TO_CAMELOT[`${alias}${letter === 'A' ? 'm' : ''}`] = `${numStr}${letter}`;
      }
    }
  };
  put(MINOR_NAMES, 'A');
  put(MAJOR_NAMES, 'B');
}

/** Parse "8A", "8a", " 12b " → CamelotKey, or null. */
export function parseCamelot(raw: string | null | undefined): CamelotKey | null {
  if (!raw) return null;
  const m = /^\s*(\d{1,2})\s*([ABab])\s*$/.exec(raw);
  if (!m) return parseMusicalKey(raw);
  const num = Number(m[1]);
  if (num < 1 || num > 12) return null;
  return { num, letter: m[2]!.toUpperCase() as CamelotLetter };
}

/**
 * Parse a musical key name ("A minor", "Am", "C# maj", "Gb", "F♯m") → CamelotKey.
 * Bare pitch class with no quality is treated as major (analyzer convention).
 */
export function parseMusicalKey(raw: string | null | undefined): CamelotKey | null {
  if (!raw) return null;
  let s = raw.trim().toLowerCase().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/\s+/g, ' ');
  let minor = false;
  if (/(minor|min\.?)$/.test(s)) { minor = true; s = s.replace(/\s*(minor|min\.?)$/, ''); }
  else if (/(major|maj\.?)$/.test(s)) { s = s.replace(/\s*(major|maj\.?)$/, ''); }
  else if (/m$/.test(s) && s.length <= 3) { minor = true; s = s.slice(0, -1); }
  s = s.replace(/\s/g, '');
  const hit = NAME_TO_CAMELOT[`${s}${minor ? 'm' : ''}`];
  return hit ? parseCamelot(hit) : null;
}

export function formatCamelot(k: CamelotKey): string {
  return `${k.num}${k.letter}`;
}

/** "8A" → "A minor" */
export function musicalName(k: CamelotKey): string {
  return (k.letter === 'A' ? MINOR_NAMES : MAJOR_NAMES)[k.num] ?? '?';
}

/** Signed circular distance from a to b on the wheel: result in [-6, +6]. */
export function wheelDistance(a: CamelotKey, b: CamelotKey): number {
  let d = (b.num - a.num) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

/** Classify the harmonic relation of a transition a→b. */
export function keyRelation(a: CamelotKey | null, b: CamelotKey | null): KeyRelation {
  if (!a || !b) return 'unknown';
  const d = wheelDistance(a, b);
  const sameRing = a.letter === b.letter;
  if (d === 0 && sameRing) return 'same';
  if (d === 0 && !sameRing) return 'relative';
  if (d === 1 && sameRing) return 'adjacent-up';
  if (d === -1 && sameRing) return 'adjacent-down';
  if (d === 2 && sameRing) return 'energy-boost';
  if (Math.abs(d) === 1 && !sameRing) return 'diagonal';
  return 'clash';
}

/**
 * Compatibility under a strictness dial (0 = loose … 1 = strict).
 * strict (≥0.75): same / ±1 / relative only.
 * medium (0.35–0.75): + energy-boost (+2).
 * loose (<0.35): + diagonal.
 */
export function isCompatible(a: CamelotKey | null, b: CamelotKey | null, strictness = 0.75): boolean {
  const rel = keyRelation(a, b);
  if (rel === 'unknown') return true; // can't judge what we can't see — validators badge it instead
  const allowed: KeyRelation[] = ['same', 'adjacent-up', 'adjacent-down', 'relative'];
  if (strictness < 0.75) allowed.push('energy-boost');
  if (strictness < 0.35) allowed.push('diagonal');
  return allowed.includes(rel);
}

/** All keys compatible with k at the given strictness — for swap-a-track candidate filters. */
export function compatibleKeys(k: CamelotKey, strictness = 0.75): CamelotKey[] {
  const out: CamelotKey[] = [];
  for (let num = 1; num <= 12; num++) {
    for (const letter of ['A', 'B'] as const) {
      const cand = { num, letter };
      if (isCompatible(k, cand, strictness)) out.push(cand);
    }
  }
  return out;
}

/** Human-readable one-liner for a relation — feeds transition cheat notes. */
export function relationLabel(rel: KeyRelation): string {
  switch (rel) {
    case 'same': return 'same key — free blend';
    case 'adjacent-up': return '+1 on the wheel — smooth lift';
    case 'adjacent-down': return '−1 on the wheel — smooth settle';
    case 'relative': return 'relative major/minor — mood flip, zero tension';
    case 'energy-boost': return '+2 jump — energy boost, keep the blend short';
    case 'diagonal': return 'diagonal move — workable, mind the overlap';
    case 'clash': return 'key clash — cut, don\'t blend';
    case 'unknown': return 'key unknown — trust your ears';
  }
}
