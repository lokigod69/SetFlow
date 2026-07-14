import { useEffect, useRef } from 'react';
import { mountDitherGradient, type GradientMount, type GradientSpec, type GradientMountOptions } from './dither-core';
import { useSetflow } from '../store';

/**
 * Theme-aware dithered atmosphere accent (clean-room DitherKit technique).
 * Static paint — repaints only on resize/theme change, so it costs nothing
 * at runtime and stays honest under prefers-reduced-motion.
 */

const SPECS: Partial<Record<string, { spec: GradientSpec; opts: GradientMountOptions }>> = {
  // Console: amber phosphor glow rising from the bottom edge, like a warm
  // tube amp behind the rack.
  console: {
    spec: { from: [255, 180, 84], direction: 'up', opacity: 0.16, litFloor: 0.2, offTier: 0.1 },
    opts: { cellPx: 3, bloom: 'subtle' },
  },
  // Crate: coarse cardboard tooth — a barely-there two-tone paper dither.
  crate: {
    spec: { from: [214, 199, 166], to: [231, 220, 196], direction: 'down', opacity: 0.5 },
    opts: { cellPx: 5 },
  },
  // Horizon: the last sliver of sun dissolving at the horizon line.
  horizon: {
    spec: { from: [255, 158, 107], direction: 'up', opacity: 0.1, litFloor: 0.25, offTier: 0.08 },
    opts: { cellPx: 4, bloom: 'subtle' },
  },
};

export function DitherBackdrop() {
  const themeId = useSetflow((s) => s.themeId);
  const hostRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<GradientMount | null>(null);

  useEffect(() => {
    mountRef.current?.dispose();
    mountRef.current = null;
    const host = hostRef.current;
    const cfg = SPECS[themeId];
    if (!host || !cfg) return;
    mountRef.current = mountDitherGradient(host, cfg.spec, cfg.opts);
    return () => {
      mountRef.current?.dispose();
      mountRef.current = null;
    };
  }, [themeId]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: themeId === 'crate' ? '100vh' : '38vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
