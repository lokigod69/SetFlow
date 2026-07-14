import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSetflow } from '../store';
import { THEMES } from '../theme/themes';
import { useTheme } from '../theme/ThemeProvider';

/**
 * The theme switcher — deliberately a small, beautiful moment (spec §9).
 * Trigger shows the current theme as a three-swatch glyph; the popover lists
 * each personality with its palette strip and tagline.
 */

function Swatches({ colors, size = 8 }: { colors: string[]; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }} aria-hidden>
      {colors.map((c, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: c,
            boxShadow: 'inset 0 0 0 1px rgba(128,128,128,0.35)',
          }}
        />
      ))}
    </span>
  );
}

export function ThemeSwitcher() {
  const themeId = useSetflow((s) => s.themeId);
  const setTheme = useSetflow((s) => s.setTheme);
  const { motion: personality } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        className="chip"
        aria-label={`Theme: ${current.label}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Swatches colors={[current.colors.bg, current.colors.accent, current.colors.arcB]} />
        {current.label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="panel theme-menu"
            role="listbox"
            aria-label="Themes"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: 'spring', ...personality.microSpring }}
            style={{ transformOrigin: 'top right' }}
          >
            {THEMES.map((t, i) => (
              <motion.button
                key={t.id}
                role="option"
                aria-selected={t.id === themeId}
                className={`theme-row${t.id === themeId ? ' active' : ''}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', ...personality.microSpring, delay: i * 0.028 }}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
              >
                <span
                  className="theme-dot"
                  style={{ background: t.colors.bgAtmosphere, borderColor: t.colors.accent }}
                  aria-hidden
                />
                <span className="theme-row-text">
                  <span className="theme-row-name">{t.label}</span>
                  <span className="theme-row-tag">{t.tagline}</span>
                </span>
                <Swatches size={7} colors={[t.colors.accent, t.colors.arcA, t.colors.arcB]} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
