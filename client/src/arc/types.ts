import type { CurvePoint } from '@setflow/shared';

/**
 * ArcRenderer adapter (spec §0/§4): the Energy Arc component talks to its
 * renderer only through this contract, so the default SVG renderer can be
 * swapped for an external graphing widget (e.g. a DitherKit-styled canvas)
 * without touching the app.
 */

export interface ArcNodeDatum {
  trackId: string;
  /** slot position 0..1 */
  x: number;
  /** normalized energy 0..1 */
  y: number;
  label: string; // "3 · Artist – Title"
  /** verification status of the energy value backing this node */
  status: 'estimated' | 'verified' | 'measured';
  /** true when any transition touching this node carries a warning */
  flagged: boolean;
}

export interface ArcSeries {
  id: string; // option id
  color: string;
  /** sampled polyline in normalized [0,1]² space */
  points: CurvePoint[];
  nodes: ArcNodeDatum[];
  emphasized: boolean;
}

export type ArcMode = 'draw' | 'predict';

export interface ArcRendererProps {
  mode: ArcMode;
  /** editable target curve control points (normalized), null = no target */
  target: CurvePoint[] | null;
  series: ArcSeries[];
  width: number;
  height: number;
  reducedMotion: boolean;
  /** draw mode: control points changed (drag/add/remove) */
  onTargetChange?: (points: CurvePoint[]) => void;
  onNodeTap?: (trackId: string) => void;
  onNodeLongPress?: (trackId: string) => void;
}

export type ArcRendererComponent = (props: ArcRendererProps) => JSX.Element;
