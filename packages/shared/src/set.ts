import type { Fact } from './facts.js';
import type { KeyRelation } from './camelot.js';
import type { Intent, Constraints } from './intent.js';
import type { CurvePoint } from './curve.js';

/** How a brain-proposed track fared against reality (spec §5.1). */
export type ResolutionState = 'pending' | 'resolved' | 'unresolved' | 'replaced';

export interface SpotifyResolution {
  trackId: string;
  uri: string; // spotify:track:...
  url: string;
  resolvedArtist: string;
  resolvedTitle: string;
  albumArtUrl: string | null;
  durationMs: number;
  /** exact-mix: named remix found in the resolved title */
  matchQuality: 'exact-mix' | 'title-match' | 'fuzzy';
}

export interface LocalFileMatch {
  path: string;
  matchedBy: 'tags' | 'filename';
}

export interface TrackCandidate {
  /** internal stable id within a SetDocument */
  id: string;
  artist: string;
  title: string;
  /** exact mix/remix name, '' if original */
  mix: string;
  bpm: Fact<number>;
  /** Camelot notation, e.g. "8A" */
  key: Fact<string>;
  /** 1–10 */
  energy: Fact<number>;
  durationMs: Fact<number> | null;
  moodTags: string[];
  /** where in the arc the brain slotted it, e.g. "opener", "peak", "cooldown" */
  slotHint: string;
  whyItBelongs: string;
  resolution: ResolutionState;
  spotify: SpotifyResolution | null;
  youtubeUrl: string | null;
  localFile: LocalFileMatch | null;
  /** id of the candidate this one replaced, if it came from a replacement call */
  replaces: string | null;
}

export interface ValidationWarning {
  rule: 'key' | 'bpm' | 'energy';
  severity: 'amber' | 'red';
  message: string;
}

/** Per-pair cheat note — the teaching feature (spec §11 ●). */
export interface TransitionNote {
  fromTrackId: string;
  toTrackId: string;
  keyRelation: KeyRelation;
  /** e.g. "8A→9A" */
  camelotPath: string;
  /** signed percent under the best read */
  bpmDeltaPercent: number;
  bpmRead: 'straight' | 'half-time' | 'double-time';
  /** signed energy step, 1–10 scale */
  energyStep: number;
  blend: 'long-blend' | 'quick-cut' | 'breakdown-swap';
  /** the brain's one-line why/how for this transition */
  note: string;
  warnings: ValidationWarning[];
}

export interface SetOption {
  id: string; // 'A' | 'B' | 'final'
  label: string;
  rationale: string;
  trackIds: string[];
  transitions: TransitionNote[];
  /** predicted energy (1–10) per slot, brain estimates upgraded by verified data */
  predictedEnergies: number[];
  /** 0–1 fit against the target curve, when one exists */
  curveFit: number | null;
}

export interface SpotifyPlaylistLink {
  playlistId: string;
  url: string;
  optionId: string;
  lastSyncedAt: string; // ISO
}

/** The persisted unit — one architected set (spec §8 history). */
export interface SetDocument {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  intent: Intent;
  constraints: Constraints;
  /** user-drawn or preset target curve, null when mode has none */
  targetCurve: CurvePoint[] | null;
  pool: TrackCandidate[];
  options: SetOption[];
  starredTrackIds: string[];
  spotifyPlaylist: SpotifyPlaylistLink | null;
  /** remix-this-set lineage */
  parentSetId: string | null;
  /** which brain adapter produced it, for the record */
  brainAdapterId: string;
}
