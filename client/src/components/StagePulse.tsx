import { motion } from 'framer-motion';
import { useSetflow } from '../store';
import { useTheme } from '../theme/ThemeProvider';

const copy = { proposing: 'consulting the brain', resolving: 'verifying on Spotify', enriching: 'measuring BPM and keys', validating: 'checking the journey' } as const;

export function StagePulse() {
  const stage = useSetflow((s) => s.stage);
  const detail = useSetflow((s) => s.stageDetail);
  const progress = useSetflow((s) => s.progress);
  const { motion: springs } = useTheme();
  const reduced = springs.durationFast === 0;
  const label = stage in copy ? copy[stage as keyof typeof copy] : detail;
  return <motion.section className="panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={springs.spring} style={{ overflow: 'hidden' }}><div style={{ padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}><span className="label">{label}</span>{progress > 0 && <span className="mono" style={{ color: 'var(--c-text-muted)' }}>{Math.round(progress * 100)}%</span>}<div style={{ flex: 1, height: 3, overflow: 'hidden', background: 'var(--c-accent-soft)', borderRadius: 'var(--r-pill)' }}><motion.div animate={progress > 0 ? { width: `${Math.max(4, progress * 100)}%` } : reduced ? undefined : { x: ['-100%', '220%'] }} transition={progress > 0 ? springs.spring : { repeat: Infinity, duration: 1.15, ease: 'linear' }} style={{ width: progress > 0 ? undefined : reduced ? '100%' : '45%', height: '100%', background: 'var(--c-accent)', borderRadius: 'var(--r-pill)' }} /></div></div></motion.section>;
}
