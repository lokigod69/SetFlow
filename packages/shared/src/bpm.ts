/** BPM transition math, including half/double-time reads. */

export interface BpmRead {
  /** effective BPM of the incoming track after the best read */
  effectiveBpm: number;
  /** signed percent change from the outgoing track's BPM */
  deltaPercent: number;
  read: 'straight' | 'half-time' | 'double-time';
}

/** NaN when either tempo is unknown (<= 0): an unknown BPM must never read as a 0% match. */
export function deltaPercent(fromBpm: number, toBpm: number): number {
  if (fromBpm <= 0 || toBpm <= 0) return NaN;
  return ((toBpm - fromBpm) / fromBpm) * 100;
}

/**
 * Best way to hear track B against track A: straight, half-time, or double-time.
 * Picks the read with the smallest absolute tempo delta.
 */
export function bestRead(fromBpm: number, toBpm: number, allowHalfDouble = true): BpmRead {
  const candidates: BpmRead[] = [
    { effectiveBpm: toBpm, deltaPercent: deltaPercent(fromBpm, toBpm), read: 'straight' },
  ];
  if (allowHalfDouble) {
    candidates.push(
      { effectiveBpm: toBpm / 2, deltaPercent: deltaPercent(fromBpm, toBpm / 2), read: 'half-time' },
      { effectiveBpm: toBpm * 2, deltaPercent: deltaPercent(fromBpm, toBpm * 2), read: 'double-time' },
    );
  }
  return candidates.reduce((best, c) =>
    Math.abs(c.deltaPercent) < Math.abs(best.deltaPercent) ? c : best,
  );
}

export interface BpmPolicy {
  /** max acceptable |delta| per transition, percent (default 6) */
  maxDeltaPercent: number;
  allowHalfDouble: boolean;
}

export const DEFAULT_BPM_POLICY: BpmPolicy = { maxDeltaPercent: 6, allowHalfDouble: true };

export function withinPolicy(fromBpm: number, toBpm: number, policy: BpmPolicy = DEFAULT_BPM_POLICY): boolean {
  const delta = bestRead(fromBpm, toBpm, policy.allowHalfDouble).deltaPercent;
  return Number.isFinite(delta) && Math.abs(delta) <= policy.maxDeltaPercent;
}
