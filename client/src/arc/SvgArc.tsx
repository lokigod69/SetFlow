import { useEffect, useMemo, useRef, useState } from 'react';
import { monotoneInterpolator, type CurvePoint } from '@setflow/shared';
import type { ArcRendererProps } from './types';

/**
 * Default ArcRenderer: pure SVG with a hand-rolled spring field.
 *
 * Every curve is sampled at SAMPLES fixed x-positions; each sample's y runs
 * its own damped spring toward the target. When tracks reorder or a curve is
 * redrawn, the whole line fluidly morphs instead of snapping — and because
 * the springs are per-sample, a local edit ripples locally (neighboring
 * samples chase their own targets) rather than tweening the path globally.
 * Node markers ride the same physics.
 */

const SAMPLES = 96;
const PAD = { top: 18, right: 18, bottom: 22, left: 18 };

interface SpringField {
  pos: Float64Array;
  vel: Float64Array;
}

function stepSprings(
  f: SpringField,
  target: Float64Array,
  dt: number,
  stiffness: number,
  damping: number,
): boolean {
  let settled = true;
  for (let i = 0; i < f.pos.length; i++) {
    const x = f.pos[i]!;
    const v = f.vel[i]!;
    const a = stiffness * (target[i]! - x) - damping * v;
    const nv = v + a * dt;
    const nx = x + nv * dt;
    f.vel[i] = nv;
    f.pos[i] = nx;
    if (Math.abs(nv) > 0.0004 || Math.abs(target[i]! - nx) > 0.0004) settled = false;
  }
  return settled;
}

function sampleTargets(points: CurvePoint[]): Float64Array {
  const out = new Float64Array(SAMPLES);
  if (points.length === 0) return out.fill(0.5);
  const f = monotoneInterpolator(points);
  for (let i = 0; i < SAMPLES; i++) out[i] = f(i / (SAMPLES - 1));
  return out;
}

function pathFrom(ys: ArrayLike<number>, w: number, h: number): string {
  const iw = w - PAD.left - PAD.right;
  const ih = h - PAD.top - PAD.bottom;
  let d = '';
  for (let i = 0; i < SAMPLES; i++) {
    const px = PAD.left + (i / (SAMPLES - 1)) * iw;
    const py = PAD.top + (1 - ys[i]!) * ih;
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
  }
  return d;
}

/** Area between two sampled curves — the visible "gap" band. */
function bandPath(a: ArrayLike<number>, b: ArrayLike<number>, w: number, h: number): string {
  const iw = w - PAD.left - PAD.right;
  const ih = h - PAD.top - PAD.bottom;
  let d = '';
  for (let i = 0; i < SAMPLES; i++) {
    const px = PAD.left + (i / (SAMPLES - 1)) * iw;
    const py = PAD.top + (1 - a[i]!) * ih;
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`;
  }
  for (let i = SAMPLES - 1; i >= 0; i--) {
    const px = PAD.left + (i / (SAMPLES - 1)) * iw;
    const py = PAD.top + (1 - b[i]!) * ih;
    d += `L${px.toFixed(2)},${py.toFixed(2)}`;
  }
  return d + 'Z';
}

const toScreen = (p: CurvePoint, w: number, h: number) => ({
  x: PAD.left + p.x * (w - PAD.left - PAD.right),
  y: PAD.top + (1 - p.y) * (h - PAD.top - PAD.bottom),
});
const fromScreen = (sx: number, sy: number, w: number, h: number): CurvePoint => ({
  x: Math.min(1, Math.max(0, (sx - PAD.left) / (w - PAD.left - PAD.right))),
  y: Math.min(1, Math.max(0, 1 - (sy - PAD.top) / (h - PAD.top - PAD.bottom))),
});

export function SvgArc({
  mode,
  target,
  series,
  width,
  height,
  reducedMotion,
  onTargetChange,
  onNodeTap,
  onNodeLongPress,
}: ArcRendererProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [, forceFrame] = useState(0);

  // one spring field per series id + one for the target curve
  const fields = useRef(new Map<string, SpringField>());
  const targets = useRef(new Map<string, Float64Array>());
  const raf = useRef<number | null>(null);

  const seriesKey = useMemo(
    () =>
      series
        .map((s) => `${s.id}:${s.points.map((p) => p.y.toFixed(3)).join(',')}`)
        .join('|') + (target ? `|t:${target.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(';')}` : ''),
    [series, target],
  );

  useEffect(() => {
    const entries: [string, CurvePoint[]][] = series.map((s) => [s.id, s.points]);
    if (target) entries.push(['__target__', target]);
    const live = new Set(entries.map(([id]) => id));
    for (const id of fields.current.keys()) if (!live.has(id)) { fields.current.delete(id); targets.current.delete(id); }

    for (const [id, pts] of entries) {
      const t = sampleTargets(pts);
      targets.current.set(id, t);
      if (!fields.current.has(id)) {
        fields.current.set(id, { pos: Float64Array.from(t), vel: new Float64Array(SAMPLES) });
      } else if (reducedMotion) {
        const f = fields.current.get(id)!;
        f.pos.set(t);
        f.vel.fill(0);
      }
    }

    if (reducedMotion) {
      forceFrame((n) => n + 1);
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      let allSettled = true;
      for (const [id, f] of fields.current) {
        const t = targets.current.get(id);
        if (!t) continue;
        if (!stepSprings(f, t, dt, 170, 22)) allSettled = false;
      }
      forceFrame((n) => n + 1);
      if (!allSettled) raf.current = requestAnimationFrame(tick);
      else raf.current = null;
    };
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesKey, reducedMotion]);

  // ---- draw-mode interaction ------------------------------------------------
  const drag = useRef<{ index: number } | null>(null);
  const longPress = useRef<number | null>(null);

  const handlePointerDown = (idx: number) => (e: React.PointerEvent) => {
    if (mode !== 'draw' || !target) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { index: idx };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !target || !onTargetChange || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = fromScreen(e.clientX - rect.left, e.clientY - rect.top, width, height);
    const idx = drag.current.index;
    const next = target.map((pt, i) => {
      if (i !== idx) return pt;
      const lo = i === 0 ? 0 : target[i - 1]!.x + 0.02;
      const hi = i === target.length - 1 ? 1 : target[i + 1]!.x - 0.02;
      const isEdge = i === 0 || i === target.length - 1;
      return { x: isEdge ? pt.x : Math.min(hi, Math.max(lo, p.x)), y: p.y };
    });
    onTargetChange(next);
  };
  const handlePointerUp = () => {
    drag.current = null;
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (mode !== 'draw' || !target || !onTargetChange || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const p = fromScreen(e.clientX - rect.left, e.clientY - rect.top, width, height);
    // near an existing point → remove it; otherwise → add
    const near = target.findIndex((pt, i) => {
      if (i === 0 || i === target.length - 1) return false;
      const s = toScreen(pt, width, height);
      return Math.hypot(s.x - (e.clientX - rect.left), s.y - (e.clientY - rect.top)) < 14;
    });
    if (near >= 0 && target.length > 2) onTargetChange(target.filter((_, i) => i !== near));
    else onTargetChange([...target, p].sort((a, b) => a.x - b.x));
  };

  if (width < 40 || height < 40) return <svg ref={svgRef} width={width} height={height} />;

  const targetField = fields.current.get('__target__');
  const emphasized = series.find((s) => s.emphasized) ?? series[0];
  const emphField = emphasized ? fields.current.get(emphasized.id) : undefined;

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{ touchAction: 'none', display: 'block', overflow: 'visible' }}
      role="img"
      aria-label="Energy arc"
    >
      {/* faint energy gridlines */}
      {[0.25, 0.5, 0.75].map((g) => {
        const y = PAD.top + (1 - g) * (height - PAD.top - PAD.bottom);
        return (
          <line key={g} x1={PAD.left} x2={width - PAD.right} y1={y} y2={y}
            stroke="var(--c-panel-border)" strokeWidth={1} strokeDasharray="2 6" opacity={0.5} />
        );
      })}

      {/* the visible gap between target and the emphasized prediction */}
      {targetField && emphField && mode === 'predict' && (
        <path d={bandPath(targetField.pos, emphField.pos, width, height)}
          fill="var(--c-arc-target)" opacity={0.08} />
      )}

      {/* predicted series */}
      {series.map((s) => {
        const f = fields.current.get(s.id);
        if (!f) return null;
        return (
          <g key={s.id} opacity={s.emphasized ? 1 : 0.28}>
            <path d={pathFrom(f.pos, width, height)} fill="none" stroke={s.color}
              strokeWidth={s.emphasized ? 2.5 : 1.5} strokeLinecap="round" />
          </g>
        );
      })}

      {/* target curve */}
      {targetField && target && (
        <path d={pathFrom(targetField.pos, width, height)} fill="none"
          stroke="var(--c-arc-target)" strokeWidth={2}
          strokeDasharray={mode === 'predict' ? '5 7' : undefined} strokeLinecap="round" />
      )}

      {/* draw-mode control points */}
      {mode === 'draw' && target?.map((pt, i) => {
        const s = toScreen(pt, width, height);
        return (
          <circle key={i} cx={s.x} cy={s.y} r={7}
            fill="var(--c-bg)" stroke="var(--c-arc-target)" strokeWidth={2.5}
            style={{ cursor: 'grab' }} onPointerDown={handlePointerDown(i)} />
        );
      })}

      {/* track nodes on the emphasized series */}
      {emphasized && emphField && mode === 'predict' &&
        emphasized.nodes.map((n) => {
          const idx = Math.round(n.x * (SAMPLES - 1));
          const y = emphField.pos[idx] ?? n.y;
          const sx = PAD.left + n.x * (width - PAD.left - PAD.right);
          const sy = PAD.top + (1 - y) * (height - PAD.top - PAD.bottom);
          const statusColor =
            n.status === 'measured' ? 'var(--c-badge-measured)'
            : n.status === 'verified' ? 'var(--c-badge-verified)'
            : 'var(--c-badge-estimated)';
          return (
            <g key={n.trackId} style={{ cursor: 'pointer' }}
              onPointerDown={() => {
                longPress.current = window.setTimeout(() => {
                  longPress.current = null;
                  onNodeLongPress?.(n.trackId);
                }, 480);
              }}
              onPointerUp={() => {
                if (longPress.current != null) {
                  clearTimeout(longPress.current);
                  longPress.current = null;
                  onNodeTap?.(n.trackId);
                }
              }}
              onPointerLeave={() => {
                if (longPress.current != null) clearTimeout(longPress.current);
                longPress.current = null;
              }}>
              <title>{n.label}</title>
              {n.flagged && (
                <circle cx={sx} cy={sy} r={11} fill="none" stroke="var(--c-warn)" strokeWidth={1.5} opacity={0.85}>
                  {!reducedMotion && (
                    <animate attributeName="r" values="9;13;9" dur="1.8s" repeatCount="indefinite" />
                  )}
                </circle>
              )}
              <circle cx={sx} cy={sy} r={6.5} fill="var(--c-arc-node)" stroke="var(--c-arc-node-ring)" strokeWidth={2} />
              <circle cx={sx} cy={sy + 0.5} r={2.4} fill={statusColor} />
            </g>
          );
        })}
    </svg>
  );
}
