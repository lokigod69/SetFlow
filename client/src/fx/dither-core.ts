/**
 * DitherKit reference core -- a clean-room ordered-dither engine for web UI.
 *
 * Technique (all public-domain math and standard platform APIs):
 *   1. A Bayer threshold matrix (B. E. Bayer, 1973/74) decides, per cell,
 *      whether that cell is "lit" for a given target density.
 *   2. We paint onto a LOW-RESOLUTION backing <canvas> (about one dither cell
 *      per `cellPx` CSS pixels) and let the browser upscale it with
 *      `image-rendering: pixelated`. Chunky retro texture, trivial cost.
 *   3. Color discipline: we never mix lighter/darker shades of a color.
 *      Every cell is painted in ONE fill color and only its ALPHA varies,
 *      so the same paint reads correctly on light and dark backgrounds.
 *   4. Optional "bloom": a second canvas showing a blurred copy of the crisp
 *      one, composited with `mix-blend-mode: plus-lighter` so the glow stays
 *      in the fill's own hue. The crisp canvas stays pixelated.
 *
 * Zero dependencies. Framework-agnostic (plain DOM). No Tailwind required.
 * A thin React wrapper lives in react-usage.md next to this file.
 */

/* ===================================================================== */
/* Basics                                                                */
/* ===================================================================== */

export type RGB = readonly [number, number, number];

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

/** CSS color string for `color` at alpha `a` (clamped). */
export const rgba = (color: RGB, a = 1): string =>
  `rgba(${color[0]},${color[1]},${color[2]},${clamp01(a)})`;

/* ===================================================================== */
/* Bayer threshold matrices                                              */
/* ===================================================================== */

/**
 * Build a Bayer index matrix of size 2^power (1 -> 2x2, 2 -> 4x4, 3 -> 8x8).
 * Classic recurrence: M(2n) = [[ 4M, 4M+2 ],
 *                              [ 4M+3, 4M+1 ]]
 */
export function bayerIndexMatrix(power: number): number[][] {
  let m: number[][] = [[0]];
  for (let p = 0; p < power; p++) {
    const n = m.length;
    const next: number[][] = Array.from({ length: n * 2 }, () =>
      new Array<number>(n * 2).fill(0)
    );
    for (let y = 0; y < n; y++) {
      const src = m[y] ?? [];
      const rowTop = next[y] ?? [];
      const rowBottom = next[y + n] ?? [];
      for (let x = 0; x < n; x++) {
        const v = 4 * (src[x] ?? 0);
        rowTop[x] = v;
        rowTop[x + n] = v + 2;
        rowBottom[x] = v + 3;
        rowBottom[x + n] = v + 1;
      }
    }
    m = next;
  }
  return m;
}

/** Threshold lookup with wraparound (safe under noUncheckedIndexedAccess). */
export const thresholdAt = (m: number[][], x: number, y: number): number =>
  m[y % m.length]?.[x % m.length] ?? 0.5;

/** Same matrix normalized to thresholds strictly inside (0, 1). */
export function bayerThresholds(power: number): number[][] {
  const m = bayerIndexMatrix(power);
  const count = m.length * m.length;
  return m.map((row) => row.map((v) => (v + 0.5) / count));
}

/** The workhorse 4x4 threshold matrix. 8x8 (`bayerThresholds(3)`) is smoother. */
export const BAYER4: number[][] = bayerThresholds(2);

/* ===================================================================== */
/* Backing-canvas sizing                                                 */
/* ===================================================================== */

export interface BackingSize {
  cols: number;
  rows: number;
}

/**
 * Backing resolution for a CSS box: one dither cell per `cellPx` CSS pixels,
 * clamped so a huge hero section can never allocate an absurd canvas.
 */
export function backingSize(
  cssWidth: number,
  cssHeight: number,
  cellPx = 3,
  maxCols = 1024,
  maxRows = 640
): BackingSize {
  return {
    cols: Math.min(maxCols, Math.max(4, Math.round(cssWidth / cellPx))),
    rows: Math.min(maxRows, Math.max(4, Math.round(cssHeight / cellPx))),
  };
}

/** Style a canvas element as a crisp, upscaled dither surface. */
export function styleAsDitherSurface(canvas: HTMLCanvasElement): void {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.imageRendering = "pixelated";
  canvas.style.pointerEvents = "none";
}

/* ===================================================================== */
/* Gradient wash                                                         */
/* ===================================================================== */

export type GradientDirection = "up" | "down" | "left" | "right";

export interface GradientSpec {
  /** Color the wash is densest in. */
  from: RGB;
  /** Second color for a two-tone blend; omit to dissolve to transparent. */
  to?: RGB;
  /** Which edge the wash fades TOWARD. "up" = glow rising from the bottom. */
  direction?: GradientDirection;
  /** Overall alpha multiplier, 0..1. */
  opacity?: number;
  /** Alpha of a lit cell at zero density (ramps up to 1 with density). */
  litFloor?: number;
  /** Fraction of the lit alpha kept by unlit cells (kills banding). */
  offTier?: number;
  /** Threshold matrix; defaults to BAYER4. */
  matrix?: number[][];
}

/**
 * Paint an ordered-dither gradient onto a low-res backing context.
 * One color: cells dissolve to transparent along the ramp (density -> alpha).
 * Two colors: every cell is painted; the dither decides which color wins.
 * Static: call once per size/spec change -- no animation loop needed.
 */
export function paintGradient(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  spec: GradientSpec
): void {
  const {
    from,
    to,
    direction = "up",
    opacity = 1,
    litFloor = 0.3,
    offTier = 0.15,
  } = spec;
  const m = spec.matrix ?? BAYER4;

  ctx.clearRect(0, 0, cols, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // fade runs 0 at the dense edge -> 1 at the `direction` edge
      const fade =
        direction === "up"
          ? 1 - (y + 0.5) / rows
          : direction === "down"
            ? (y + 0.5) / rows
            : direction === "left"
              ? 1 - (x + 0.5) / cols
              : (x + 0.5) / cols;
      const density = 1 - fade;
      const lit = density > thresholdAt(m, x, y);

      if (to) {
        ctx.fillStyle = rgba(lit ? from : to, opacity);
        ctx.fillRect(x, y, 1, 1);
      } else {
        // Unlit cells keep a faint tint of the SAME color instead of a hole,
        // so the falloff reads smooth on any background.
        const litAlpha = litFloor + (1 - litFloor) * density;
        const a = (lit ? litAlpha : litAlpha * offTier) * opacity;
        if (a < 0.005) continue;
        ctx.fillStyle = rgba(from, a);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/* ===================================================================== */
/* Area fill under a curve (chart/graph skinning)                        */
/* ===================================================================== */

/** Linearly resample `values` to exactly `cols` samples. */
export function resampleLinear(values: number[], cols: number): number[] {
  const out = new Array<number>(cols);
  if (values.length === 0) return out.fill(0);
  const last = Math.max(values.length - 1, 1);
  for (let c = 0; c < cols; c++) {
    const pos = (c / Math.max(cols - 1, 1)) * last;
    const i = Math.floor(pos);
    const frac = pos - i;
    const a = values[i] ?? 0;
    const b = values[Math.min(i + 1, values.length - 1)] ?? a;
    out[c] = a + (b - a) * frac;
  }
  return out;
}

export interface AreaFillSpec {
  color: RGB;
  /**
   * Top of the fill per backing column, in backing-row units (0 = top of
   * canvas). Must have length `cols` -- use `resampleLinear` to fit data.
   */
  topRows: number[];
  /** Bottom of the fill in rows. Defaults to `rows` (the canvas floor). */
  floorRow?: number;
  opacity?: number;
  /** Positive bias thins the dither out; negative packs it denser. */
  sparse?: number;
  /** Alpha of a lit cell right under the curve (ramps to ~1 at the floor). */
  litFloor?: number;
  /** Fraction of lit alpha kept by unlit cells. */
  offTier?: number;
  /** Draw a near-solid 1px edge along the curve, feathered one row below. */
  edge?: boolean;
  matrix?: number[][];
}

/**
 * Dithered fill under a curve: solid near the floor, dissolving upward so it
 * fades out toward the value line, optionally capped by a soft edge.
 * This is the "energy graph" / area-chart paint.
 */
export function paintAreaFill(
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  spec: AreaFillSpec
): void {
  const {
    color,
    topRows,
    floorRow = rows,
    opacity = 1,
    sparse = 0,
    litFloor = 0.25,
    offTier = 0.15,
    edge = true,
  } = spec;
  const m = spec.matrix ?? BAYER4;

  ctx.clearRect(0, 0, cols, rows);
  for (let x = 0; x < cols; x++) {
    const top = Math.round(topRows[x] ?? floorRow);
    const floor = Math.round(floorRow);
    const depth = floor - top;

    if (depth <= 0) {
      if (edge) {
        ctx.fillStyle = rgba(color, 0.75 * opacity);
        ctx.fillRect(x, Math.min(top, rows - 1), 1, 1);
      }
      continue;
    }

    for (let y = top; y < floor; y++) {
      // 0 at the curve, 1 at the floor: dense at the bottom, airy at the top.
      const density = (y - top) / depth;
      const lit = density - sparse > thresholdAt(m, x, y);
      const litAlpha = litFloor + (1 - litFloor) * density;
      const a = (lit ? litAlpha : litAlpha * offTier) * opacity;
      if (a < 0.005) continue;
      ctx.fillStyle = rgba(color, a);
      ctx.fillRect(x, y, 1, 1);
    }

    if (edge) {
      ctx.fillStyle = rgba(color, 0.75 * opacity);
      ctx.fillRect(x, top, 1, 1);
      if (depth > 1) {
        ctx.fillStyle = rgba(color, 0.35 * opacity);
        ctx.fillRect(x, top + 1, 1, 1);
      }
    }
  }
}

/* ===================================================================== */
/* Arbitrary image dithering (something the original kit does NOT do)    */
/* ===================================================================== */

export interface ImageDitherOptions {
  /** Uniform quantization levels per channel (2 = 1-bit per channel). */
  levels?: number;
  /** Optional fixed palette; nearest entry wins after thresholding. */
  palette?: RGB[];
  /** Strength of the ordered perturbation, 0..1. */
  spread?: number;
  matrix?: number[][];
}

/**
 * Ordered-dither an ImageData in place-safe fashion (returns a new one).
 * Per pixel: perturb each channel by (threshold - 0.5) * amplitude, then
 * quantize -- to uniform levels, or to the nearest palette entry if given.
 * Alpha is preserved untouched.
 */
export function ditherImageData(
  src: ImageData,
  opts: ImageDitherOptions = {}
): ImageData {
  const { levels = 2, palette, spread = 1 } = opts;
  const m = opts.matrix ?? BAYER4;
  const out = new ImageData(
    new Uint8ClampedArray(src.data),
    src.width,
    src.height
  );
  const d = out.data;

  const step = 255 / Math.max(levels - 1, 1);
  // Perturbation amplitude: one quantization step for level mode, a fixed
  // mid-range kick for palette mode (palette spacing is irregular).
  const amp = spread * (palette ? 96 : step);

  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4;
      const kick = (thresholdAt(m, x, y) - 0.5) * amp;
      if (palette && palette.length > 0) {
        const r = (d[i] ?? 0) + kick;
        const g = (d[i + 1] ?? 0) + kick;
        const b = (d[i + 2] ?? 0) + kick;
        let best: RGB = palette[0] ?? [0, 0, 0];
        let bestDist = Infinity;
        for (const p of palette) {
          const dr = r - p[0];
          const dg = g - p[1];
          const db = b - p[2];
          const dist = dr * dr + dg * dg + db * db;
          if (dist < bestDist) {
            bestDist = dist;
            best = p;
          }
        }
        d[i] = best[0];
        d[i + 1] = best[1];
        d[i + 2] = best[2];
      } else {
        for (let c = 0; c < 3; c++) {
          const v = (d[i + c] ?? 0) + kick;
          d[i + c] = Math.round(v / step) * step; // Uint8ClampedArray clamps
        }
      }
    }
  }
  return out;
}

/**
 * Convenience: draw `image` downscaled into `canvas` at ~1 cell per `cellPx`
 * CSS pixels, dither it, and put the result back. Style the canvas with
 * `styleAsDitherSurface` (or `image-rendering: pixelated`) for the retro look.
 */
export function ditherImageToCanvas(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  cellPx = 2,
  opts?: ImageDitherOptions
): void {
  const { cols, rows } = backingSize(cssWidth, cssHeight, cellPx);
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0, cols, rows);
  ctx.putImageData(ditherImageData(ctx.getImageData(0, 0, cols, rows), opts), 0, 0);
}

/* ===================================================================== */
/* Bloom layer                                                           */
/* ===================================================================== */

export interface BloomConfig {
  blurPx: number;
  /** 1 = neutral. */
  brightness: number;
  /** Layer opacity 0..1. */
  opacity: number;
  /** >1 keeps the glow vividly in-hue instead of washing to white. */
  saturate?: number;
}

export type BloomPreset = "subtle" | "strong" | "aura";

export const BLOOM_PRESETS: Record<BloomPreset, BloomConfig> = {
  subtle: { blurPx: 3, brightness: 1.3, opacity: 0.65, saturate: 1.3 },
  strong: { blurPx: 6, brightness: 1.6, opacity: 0.75, saturate: 1.5 },
  aura: { blurPx: 14, brightness: 2.5, opacity: 0.12, saturate: 2.5 },
};

/**
 * Inline CSS for the bloom layer canvas (a copy of the crisp canvas).
 * Apply to a second canvas stacked over the crisp one, then `drawImage` the
 * crisp canvas into it after every paint.
 */
export function bloomLayerCss(
  input: BloomPreset | BloomConfig
): Record<string, string> {
  const cfg = typeof input === "string" ? BLOOM_PRESETS[input] : input;
  return {
    filter: `blur(${cfg.blurPx}px) brightness(${cfg.brightness}) saturate(${cfg.saturate ?? 1})`,
    opacity: String(cfg.opacity),
    mixBlendMode: "plus-lighter",
    imageRendering: "auto",
  };
}

/* ===================================================================== */
/* Motion helpers                                                        */
/* ===================================================================== */

/** True when the OS asks for reduced motion (skip eases, snap instead). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false)
  );
}

export interface IntensityEaser {
  /** Ease toward a new target (e.g. 0 rest, 1 hover, 1.5 pressed). */
  set(target: number): void;
  /** Cancel any pending frame. */
  dispose(): void;
}

/**
 * requestAnimationFrame-driven exponential approach for hover/press states.
 * The loop only runs while settling; `onFrame` receives the eased intensity
 * and should repaint. Honors reduced motion by snapping.
 */
export function createIntensityEaser(
  onFrame: (intensity: number) => void,
  opts: { rate?: number; epsilon?: number } = {}
): IntensityEaser {
  const rate = opts.rate ?? 0.16;
  const epsilon = opts.epsilon ?? 0.01;
  const reduce = prefersReducedMotion();
  let value = 0;
  let target = 0;
  let raf = 0;

  const tick = (): void => {
    const delta = target - value;
    if (Math.abs(delta) < epsilon) {
      value = target;
      onFrame(value);
      raf = 0;
      return;
    }
    value += delta * rate;
    onFrame(value);
    raf = requestAnimationFrame(tick);
  };

  return {
    set(t: number): void {
      target = t;
      if (reduce) {
        value = t;
        onFrame(value);
      } else if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    },
    dispose(): void {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/* ===================================================================== */
/* Resize plumbing + one-call gradient mount                             */
/* ===================================================================== */

/**
 * Call `paint(cssWidth, cssHeight)` now and again on every resize of `host`.
 * Returns a disposer.
 */
export function observeAndPaint(
  host: Element,
  paint: (cssWidth: number, cssHeight: number) => void
): () => void {
  const run = (): void => {
    const box = host.getBoundingClientRect();
    paint(box.width, box.height);
  };
  run();
  if (typeof ResizeObserver === "undefined") return () => undefined;
  const ro = new ResizeObserver(run);
  ro.observe(host);
  return () => ro.disconnect();
}

export interface GradientMountOptions {
  cellPx?: number;
  bloom?: BloomPreset | BloomConfig | "off";
}

export interface GradientMount {
  update(spec: GradientSpec): void;
  dispose(): void;
}

/**
 * Vanilla one-call setup: fills `host` (which must be `position: relative`
 * or otherwise positioned) with a dithered gradient wash that repaints on
 * resize. Framework-free; the React wrapper is a ~20-line effect over this.
 */
export function mountDitherGradient(
  host: HTMLElement,
  spec: GradientSpec,
  options: GradientMountOptions = {}
): GradientMount {
  const { cellPx = 3, bloom = "off" } = options;

  const makeLayer = (): HTMLCanvasElement => {
    const c = document.createElement("canvas");
    c.style.position = "absolute";
    c.style.inset = "0";
    styleAsDitherSurface(c);
    host.appendChild(c);
    return c;
  };

  const crisp = makeLayer();
  let bloomCanvas: HTMLCanvasElement | null = null;
  if (bloom !== "off") {
    bloomCanvas = makeLayer();
    Object.assign(bloomCanvas.style, bloomLayerCss(bloom));
  }

  let current = spec;
  const paint = (w: number, h: number): void => {
    const { cols, rows } = backingSize(w, h, cellPx);
    crisp.width = cols;
    crisp.height = rows;
    const ctx = crisp.getContext("2d");
    if (!ctx) return;
    paintGradient(ctx, cols, rows, current);
    if (bloomCanvas) {
      bloomCanvas.width = cols;
      bloomCanvas.height = rows;
      bloomCanvas.getContext("2d")?.drawImage(crisp, 0, 0);
    }
  };

  const stopObserving = observeAndPaint(host, paint);

  return {
    update(next: GradientSpec): void {
      current = next;
      const box = host.getBoundingClientRect();
      paint(box.width, box.height);
    },
    dispose(): void {
      stopObserving();
      crisp.remove();
      bloomCanvas?.remove();
    },
  };
}
