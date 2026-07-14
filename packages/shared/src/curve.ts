/**
 * Energy-curve math. A curve is a list of control points with x ∈ [0,1]
 * (position in the set) and y ∈ [0,1] (normalized energy; energy 1–10 maps
 * to y = (e-1)/9). Interpolation is monotone cubic (Fritsch–Carlson), which
 * never overshoots between points — an energy curve must not wiggle past
 * its own control points.
 */

export interface CurvePoint {
  x: number;
  y: number;
}

export type EnergyBehavior = 'flat' | 'rise' | 'rise-peak-cooldown' | 'custom';

export const energyToY = (energy: number): number => clamp01((energy - 1) / 9);
export const yToEnergy = (y: number): number => 1 + clamp01(y) * 9;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Canonical preset shapes (control points; render/sample as needed). */
export function presetCurve(kind: EnergyBehavior): CurvePoint[] {
  switch (kind) {
    case 'flat':
      return [{ x: 0, y: 0.55 }, { x: 1, y: 0.55 }];
    case 'rise':
      return [{ x: 0, y: 0.25 }, { x: 0.6, y: 0.55 }, { x: 1, y: 0.9 }];
    case 'rise-peak-cooldown':
      return [{ x: 0, y: 0.3 }, { x: 0.45, y: 0.7 }, { x: 0.7, y: 0.95 }, { x: 1, y: 0.45 }];
    case 'custom':
      return [{ x: 0, y: 0.4 }, { x: 0.5, y: 0.6 }, { x: 1, y: 0.5 }];
  }
}

/**
 * Monotone cubic (Fritsch–Carlson) interpolator over sorted control points.
 * Returns a function y(x) valid on [0,1]; clamps outside the point range.
 */
export function monotoneInterpolator(points: CurvePoint[]): (x: number) => number {
  const pts = [...points].sort((a, b) => a.x - b.x);
  if (pts.length === 0) return () => 0.5;
  if (pts.length === 1) return () => pts[0]!.y;

  const n = pts.length;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const h: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1]! - xs[i]!;
    h.push(dx === 0 ? 1e-9 : dx);
    slope.push((ys[i + 1]! - ys[i]!) / (dx === 0 ? 1e-9 : dx));
  }

  // Fritsch–Carlson tangents
  const m: number[] = new Array(n).fill(0);
  m[0] = slope[0]!;
  m[n - 1] = slope[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1]! * slope[i]! <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i]! + h[i - 1]!;
      const w2 = h[i]! + 2 * h[i - 1]!;
      m[i] = (w1 + w2) / (w1 / slope[i - 1]! + w2 / slope[i]!);
    }
  }
  // prevent overshoot at the ends
  for (const i of [0, n - 1]) {
    const s = i === 0 ? slope[0]! : slope[n - 2]!;
    if (s === 0) m[i] = 0;
    else if (Math.abs(m[i]!) > 3 * Math.abs(s)) m[i] = 3 * s;
  }

  return (x: number): number => {
    if (x <= xs[0]!) return ys[0]!;
    if (x >= xs[n - 1]!) return ys[n - 1]!;
    // binary search for the segment
    let lo = 0;
    let hi = n - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (xs[mid]! <= x) lo = mid;
      else hi = mid - 1;
    }
    const i = lo;
    const t = (x - xs[i]!) / h[i]!;
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    return clamp01(h00 * ys[i]! + h10 * h[i]! * m[i]! + h01 * ys[i + 1]! + h11 * h[i]! * m[i + 1]!);
  };
}

/** Sample a control-point curve at n evenly spaced positions (track slots). */
export function sampleCurve(points: CurvePoint[], n: number): number[] {
  const f = monotoneInterpolator(points);
  if (n <= 1) return [f(0.5)];
  return Array.from({ length: n }, (_, i) => f(i / (n - 1)));
}

/** Energy values (1–10) of an ordered set → normalized curve points. */
export function arcFromEnergies(energies: number[]): CurvePoint[] {
  if (energies.length === 0) return [];
  if (energies.length === 1) return [{ x: 0.5, y: energyToY(energies[0]!) }];
  return energies.map((e, i) => ({ x: i / (energies.length - 1), y: energyToY(e) }));
}

/**
 * How well a predicted arc tracks a target curve: RMS error in [0,1] space,
 * returned as a fit score 1 = perfect … 0 = maximally off.
 */
export function fitScore(target: CurvePoint[], predictedEnergies: number[]): number {
  if (target.length === 0 || predictedEnergies.length === 0) return 0;
  const sampled = sampleCurve(target, predictedEnergies.length);
  let sum = 0;
  for (let i = 0; i < predictedEnergies.length; i++) {
    const err = sampled[i]! - energyToY(predictedEnergies[i]!);
    sum += err * err;
  }
  return 1 - Math.sqrt(sum / predictedEnergies.length);
}

/**
 * Per-slot deviation of predicted energy from the target curve, in energy units
 * (1–10 scale). Positive = predicted hotter than target. Feeds validation ambers.
 */
export function slotDeviations(target: CurvePoint[], predictedEnergies: number[]): number[] {
  const sampled = sampleCurve(target, predictedEnergies.length);
  return predictedEnergies.map((e, i) => e - yToEnergy(sampled[i]!));
}
