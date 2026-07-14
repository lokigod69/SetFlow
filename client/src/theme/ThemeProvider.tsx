import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { applyTheme, effectiveMotion, type MotionPersonality, type ThemeTokens } from './tokens';
import { themeById } from './themes';
import { useSetflow } from '../store';

interface ThemeContextValue {
  theme: ThemeTokens;
  motion: MotionPersonality;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useSetflow((s) => s.themeId);
  const theme = themeById(themeId);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, motion: effectiveMotion(theme) }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <MotionConfig reducedMotion="user" transition={{ type: 'spring', ...value.motion.spring }}>
        {children}
      </MotionConfig>
    </ThemeContext.Provider>
  );
}
