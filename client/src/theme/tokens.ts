/**
 * SETFLOW theme system. One layout skeleton, five personalities.
 * A theme is pure data: color/type/radius/texture tokens applied as CSS
 * custom properties, plus a motion personality consumed by framer-motion.
 * Components never hardcode a color or a spring — they read tokens.
 */

export interface MotionPersonality {
  /** default spring for layout moves (reorder, morph, drawer) */
  spring: { stiffness: number; damping: number; mass: number };
  /** snappier spring for micro-interactions (hover, press, badge) */
  microSpring: { stiffness: number; damping: number; mass: number };
  /** base durations (ms) for non-spring fades */
  durationFast: number;
  durationBase: number;
  durationSlow: number;
  /** how far things travel when entering, px */
  enterDistance: number;
}

export interface ThemeTokens {
  id: ThemeId;
  label: string;
  tagline: string;
  /** 'dark' | 'light' — drives meta color-scheme */
  scheme: 'dark' | 'light';
  colors: {
    bg: string;
    /** large-surface atmosphere behind panels (gradient allowed) */
    bgAtmosphere: string;
    panel: string;
    panelElevated: string;
    panelBorder: string;
    text: string;
    textMuted: string;
    textFaint: string;
    accent: string;
    accentText: string;
    accentSoft: string;
    warn: string;
    danger: string;
    success: string;
    /** the user's target curve */
    arcTarget: string;
    /** predicted arc, option A */
    arcA: string;
    /** predicted arc, option B */
    arcB: string;
    arcNode: string;
    arcNodeRing: string;
    badgeEstimated: string;
    badgeVerified: string;
    badgeMeasured: string;
    focusRing: string;
  };
  typography: {
    display: string;
    body: string;
    mono: string;
    displayWeight: number;
    displayTracking: string;
    /** text-transform for labels/overlines */
    labelCase: 'uppercase' | 'none';
  };
  radius: { sm: string; md: string; lg: string; pill: string };
  texture: {
    /** css background-image/etc layered over bg, '' for none */
    grain: string;
    panelShadow: string;
    /** backdrop-filter for elevated panels, '' for none */
    panelBlur: string;
    /** hairline vs none vs chunky borders */
    borderWidth: string;
  };
  motion: MotionPersonality;
}

export type ThemeId = 'console' | 'atelier' | 'meridian' | 'crate' | 'horizon';

/** Flatten tokens into CSS custom properties on :root. */
export function applyTheme(t: ThemeTokens): void {
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(t.colors)) set(`--c-${kebab(k)}`, v);
  set('--f-display', t.typography.display);
  set('--f-body', t.typography.body);
  set('--f-mono', t.typography.mono);
  set('--f-display-weight', String(t.typography.displayWeight));
  set('--f-display-tracking', t.typography.displayTracking);
  set('--f-label-case', t.typography.labelCase);
  for (const [k, v] of Object.entries(t.radius)) set(`--r-${k}`, v);
  set('--tx-grain', t.texture.grain || 'none');
  set('--tx-panel-shadow', t.texture.panelShadow);
  set('--tx-panel-blur', t.texture.panelBlur || 'none');
  set('--tx-border-w', t.texture.borderWidth);
  set('--m-fast', `${t.motion.durationFast}ms`);
  set('--m-base', `${t.motion.durationBase}ms`);
  set('--m-slow', `${t.motion.durationSlow}ms`);
  root.dataset.theme = t.id;
  root.style.colorScheme = t.scheme;
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/** Reduced-motion variant: springs become near-instant fades. */
export function effectiveMotion(t: ThemeTokens): MotionPersonality {
  if (!prefersReducedMotion()) return t.motion;
  return {
    spring: { stiffness: 1000, damping: 100, mass: 1 },
    microSpring: { stiffness: 1000, damping: 100, mass: 1 },
    durationFast: 0,
    durationBase: 0,
    durationSlow: 0,
    enterDistance: 0,
  };
}
