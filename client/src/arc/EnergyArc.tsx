import { useEffect, useRef, useState } from 'react';
import { arcFromEnergies, energyToY, presetCurve, type CurvePoint, type SetDocument } from '@setflow/shared';
import { SvgArc } from './SvgArc';
import type { ArcMode, ArcRendererComponent, ArcSeries } from './types';
import { prefersReducedMotion } from '../theme/tokens';

/**
 * Energy Arc container: adapts SETFLOW state to the ArcRenderer contract.
 * Swap `renderer` to plug in an external graphing widget (spec §0/§4).
 */

interface EnergyArcProps {
  doc: SetDocument | null;
  activeOptionId: string;
  mode: ArcMode;
  /** live draft curve when authoring (curve-first mode), else doc.targetCurve */
  draftCurve: CurvePoint[] | null;
  onCurveChange?: (points: CurvePoint[]) => void;
  onNodeTap?: (trackId: string) => void;
  onNodeLongPress?: (trackId: string) => void;
  renderer?: ArcRendererComponent;
  height?: number;
}

const OPTION_COLORS: Record<string, string> = {
  A: 'var(--c-arc-a)',
  B: 'var(--c-arc-b)',
  final: 'var(--c-arc-a)',
};

export function seriesFromDoc(doc: SetDocument, activeOptionId: string): ArcSeries[] {
  const byId = new Map(doc.pool.map((t) => [t.id, t]));
  return doc.options.map((opt) => {
    const energies = opt.predictedEnergies.length
      ? opt.predictedEnergies
      : opt.trackIds.map((id) => byId.get(id)?.energy.value ?? 5);
    const points = arcFromEnergies(energies);
    const n = opt.trackIds.length;
    return {
      id: opt.id,
      color: OPTION_COLORS[opt.id] ?? 'var(--c-arc-b)',
      points,
      emphasized: opt.id === activeOptionId,
      nodes: opt.trackIds.map((id, i) => {
        const t = byId.get(id);
        const flagged =
          opt.transitions[i - 1]?.warnings.length || opt.transitions[i]?.warnings.length ? true : false;
        return {
          trackId: id,
          x: n <= 1 ? 0.5 : i / (n - 1),
          y: energyToY(energies[i] ?? 5),
          label: t ? `${i + 1} · ${t.artist} – ${t.title}${t.mix ? ` (${t.mix})` : ''}` : `${i + 1}`,
          status: t?.energy.status ?? 'estimated',
          flagged,
        };
      }),
    };
  });
}

export function EnergyArc({
  doc,
  activeOptionId,
  mode,
  draftCurve,
  onCurveChange,
  onNodeTap,
  onNodeLongPress,
  renderer,
  height = 260,
}: EnergyArcProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const target = draftCurve ?? doc?.targetCurve ?? (mode === 'draw' ? presetCurve('rise-peak-cooldown') : null);
  const series = doc ? seriesFromDoc(doc, activeOptionId) : [];
  const Renderer = renderer ?? SvgArc;

  return (
    <div ref={hostRef} style={{ width: '100%', height }}>
      {width > 0 && (
        <Renderer
          mode={mode}
          target={target}
          series={series}
          width={width}
          height={height}
          reducedMotion={prefersReducedMotion()}
          onTargetChange={onCurveChange}
          onNodeTap={onNodeTap}
          onNodeLongPress={onNodeLongPress}
        />
      )}
    </div>
  );
}
