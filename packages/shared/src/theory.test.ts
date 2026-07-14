import { describe, expect, it } from 'vitest';
import {
  parseCamelot,
  parseMusicalKey,
  formatCamelot,
  musicalName,
  keyRelation,
  isCompatible,
  wheelDistance,
} from './camelot.js';
import { bestRead, deltaPercent, withinPolicy, DEFAULT_BPM_POLICY } from './bpm.js';
import {
  presetCurve,
  monotoneInterpolator,
  sampleCurve,
  arcFromEnergies,
  fitScore,
  energyToY,
} from './curve.js';
import { fact, mergeFact } from './facts.js';

describe('camelot', () => {
  it('parses camelot notation in any case with whitespace', () => {
    expect(parseCamelot('8A')).toEqual({ num: 8, letter: 'A' });
    expect(parseCamelot(' 12b ')).toEqual({ num: 12, letter: 'B' });
    expect(parseCamelot('0A')).toBeNull();
    expect(parseCamelot('13B')).toBeNull();
    expect(parseCamelot('')).toBeNull();
  });

  it('parses musical key names including enharmonics', () => {
    expect(parseMusicalKey('A minor')).toEqual({ num: 8, letter: 'A' });
    expect(parseMusicalKey('Am')).toEqual({ num: 8, letter: 'A' });
    expect(parseMusicalKey('C major')).toEqual({ num: 8, letter: 'B' });
    expect(parseMusicalKey('C')).toEqual({ num: 8, letter: 'B' });
    expect(parseMusicalKey('F# minor')).toEqual({ num: 11, letter: 'A' });
    expect(parseMusicalKey('Gb major')).toEqual({ num: 2, letter: 'B' });
    expect(parseMusicalKey('G#m')).toEqual({ num: 1, letter: 'A' });
  });

  it('round-trips format and names', () => {
    expect(formatCamelot({ num: 8, letter: 'A' })).toBe('8A');
    expect(musicalName({ num: 8, letter: 'A' })).toBe('A minor');
    expect(musicalName({ num: 8, letter: 'B' })).toBe('C major');
  });

  it('classifies relations with wheel wrap-around', () => {
    const k = parseCamelot('12A')!;
    expect(keyRelation(k, parseCamelot('1A'))).toBe('adjacent-up');
    expect(keyRelation(parseCamelot('1A'), parseCamelot('12A'))).toBe('adjacent-down');
    expect(keyRelation(parseCamelot('8A'), parseCamelot('8B'))).toBe('relative');
    expect(keyRelation(parseCamelot('8A'), parseCamelot('8A'))).toBe('same');
    expect(keyRelation(parseCamelot('8A'), parseCamelot('10A'))).toBe('energy-boost');
    expect(keyRelation(parseCamelot('8A'), parseCamelot('3B'))).toBe('clash');
    expect(keyRelation(null, parseCamelot('3B'))).toBe('unknown');
  });

  it('applies the strictness dial', () => {
    const a = parseCamelot('8A');
    const boost = parseCamelot('10A');
    expect(isCompatible(a, boost, 0.9)).toBe(false);
    expect(isCompatible(a, boost, 0.5)).toBe(true);
    const diagonal = parseCamelot('9B');
    expect(isCompatible(a, diagonal, 0.5)).toBe(false);
    expect(isCompatible(a, diagonal, 0.2)).toBe(true);
  });

  it('wheel distance is signed and minimal', () => {
    expect(wheelDistance(parseCamelot('11A')!, parseCamelot('2A')!)).toBe(3);
    expect(wheelDistance(parseCamelot('2A')!, parseCamelot('11A')!)).toBe(-3);
  });
});

describe('bpm', () => {
  it('computes signed delta percent', () => {
    expect(deltaPercent(120, 126)).toBeCloseTo(5);
    expect(deltaPercent(128, 120)).toBeCloseTo(-6.25);
  });

  it('finds half/double-time reads', () => {
    const read = bestRead(124, 63);
    expect(read.read).toBe('double-time');
    expect(Math.abs(read.deltaPercent)).toBeLessThan(2);
    expect(bestRead(124, 63, false).read).toBe('straight');
  });

  it('enforces policy', () => {
    expect(withinPolicy(120, 126, DEFAULT_BPM_POLICY)).toBe(true);
    expect(withinPolicy(120, 132, DEFAULT_BPM_POLICY)).toBe(false);
    expect(withinPolicy(120, 240, DEFAULT_BPM_POLICY)).toBe(true); // double-time read
  });

  it('treats an unknown (<= 0) BPM as unverified, never a 0% match', () => {
    expect(deltaPercent(0, 128)).toBeNaN();
    expect(deltaPercent(128, 0)).toBeNaN();
    expect(withinPolicy(0, 128, DEFAULT_BPM_POLICY)).toBe(false);
    expect(withinPolicy(128, 0, DEFAULT_BPM_POLICY)).toBe(false);
  });
});

describe('curve', () => {
  it('monotone interpolation hits control points and never overshoots', () => {
    const pts = [
      { x: 0, y: 0.2 },
      { x: 0.5, y: 0.9 },
      { x: 1, y: 0.4 },
    ];
    const f = monotoneInterpolator(pts);
    expect(f(0)).toBeCloseTo(0.2);
    expect(f(0.5)).toBeCloseTo(0.9);
    expect(f(1)).toBeCloseTo(0.4);
    for (let x = 0; x <= 1; x += 0.01) {
      expect(f(x)).toBeLessThanOrEqual(0.9 + 1e-9);
      expect(f(x)).toBeGreaterThanOrEqual(0.2 - 1e-9);
    }
  });

  it('samples presets at n slots', () => {
    const s = sampleCurve(presetCurve('rise'), 10);
    expect(s).toHaveLength(10);
    expect(s[0]!).toBeLessThan(s[9]!);
  });

  it('scores fit — perfect tracking scores ~1', () => {
    const target = presetCurve('rise');
    const energies = sampleCurve(target, 8).map((y) => 1 + y * 9);
    expect(fitScore(target, energies)).toBeGreaterThan(0.99);
    const inverted = energies.map((e) => 11 - e);
    expect(fitScore(target, inverted)).toBeLessThan(0.8);
  });

  it('builds arcs from energies', () => {
    const arc = arcFromEnergies([3, 7, 5]);
    expect(arc).toEqual([
      { x: 0, y: energyToY(3) },
      { x: 0.5, y: energyToY(7) },
      { x: 1, y: energyToY(5) },
    ]);
  });
});

describe('facts', () => {
  it('assigns status by source and merges by trust rank', () => {
    const est = fact(128, 'brain-estimate');
    expect(est.status).toBe('estimated');
    const deezer = fact(126, 'deezer');
    expect(deezer.status).toBe('verified');
    const measured = fact(125, 'analyzer');
    expect(measured.status).toBe('measured');
    expect(mergeFact(est, deezer)).toBe(deezer);
    expect(mergeFact(measured, deezer)).toBe(measured);
    expect(mergeFact(undefined, est)).toBe(est);
  });
});
