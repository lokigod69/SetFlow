/**
 * Provenance-carrying facts. The brain is trusted for taste, never for facts:
 * every BPM/key/energy/duration value carries where it came from and how much
 * to trust it. UI badges render directly from `status`.
 */

export type FactSource =
  | 'brain-estimate'
  | 'spotify'
  | 'deezer'
  | 'getsongbpm'
  | 'analyzer'; // locally measured from the user's own file

export type FactStatus = 'estimated' | 'verified' | 'measured';

export interface Fact<T> {
  value: T;
  source: FactSource;
  status: FactStatus;
}

export function statusFor(source: FactSource): FactStatus {
  switch (source) {
    case 'brain-estimate':
      return 'estimated';
    case 'analyzer':
      return 'measured';
    default:
      return 'verified';
  }
}

export function fact<T>(value: T, source: FactSource): Fact<T> {
  return { value, source, status: statusFor(source) };
}

/** measured > verified > estimated — higher wins when merging sources. */
const RANK: Record<FactStatus, number> = { estimated: 0, verified: 1, measured: 2 };

/** Keep the more trustworthy of two facts (incoming wins ties — fresher). */
export function mergeFact<T>(current: Fact<T> | undefined, incoming: Fact<T>): Fact<T> {
  if (!current) return incoming;
  return RANK[incoming.status] >= RANK[current.status] ? incoming : current;
}
