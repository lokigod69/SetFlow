import { motion } from 'framer-motion';
import type { SetDocument, SetOption, TrackCandidate } from '@setflow/shared';
import { useSetflow } from '../store';
import { useTheme } from '../theme/ThemeProvider';
import { ExportBar } from './ExportBar';
import { TransitionChip } from './TransitionChip';
import { trackName } from './helpers';

function TrackRow({ track, position, starred, onStar }: { track: TrackCandidate; position: number; starred: boolean; onStar: () => void }) {
  const selectTrack = useSetflow((s) => s.selectTrack);
  const { motion: springs } = useTheme();
  return <motion.div layout transition={springs.spring} onClick={() => selectTrack(track.id)} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 1fr) auto auto auto', gap: 8, alignItems: 'center', padding: '7px 0', cursor: 'pointer' }}><span className="mono" style={{ color: 'var(--c-text-faint)' }}>{String(position).padStart(2, '0')}</span><span title={trackName(track)} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trackName(track)} {track.resolution === 'unresolved' && <small className="danger-text">unresolved</small>}</span><span className="mono">{track.key.value || '—'}</span><span className="mono">{Math.round(track.bpm.value || 0) || '—'}</span><button className="btn quiet" aria-label={starred ? 'Unstar track' : 'Star track'} onClick={(e) => { e.stopPropagation(); onStar(); }} style={{ padding: 3, color: starred ? 'var(--c-accent)' : undefined }}>{starred ? '★' : '☆'}</button><span className={`badge ${track.bpm.status}`} style={{ gridColumn: '2 / -1', justifySelf: 'start' }}>{track.bpm.status}</span></motion.div>;
}

export function OptionColumn({ doc, option }: { doc: SetDocument; option: SetOption }) {
  const activeOptionId = useSetflow((s) => s.activeOptionId);
  const setActiveOption = useSetflow((s) => s.setActiveOption);
  const toggleStar = useSetflow((s) => s.toggleStar);
  const fixTransition = useSetflow((s) => s.fixTransition);
  const tracks = option.trackIds.map((id) => doc.pool.find((track) => track.id === id)).filter((track): track is TrackCandidate => Boolean(track));
  return <section className="panel panel-pad" style={{ borderColor: activeOptionId === option.id ? 'var(--c-accent)' : undefined }}><button onClick={() => setActiveOption(option.id)} style={{ display: 'block', textAlign: 'left', width: '100%', marginBottom: 10 }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span className="label">option {option.id === 'final' ? 'final' : option.id}</span><h2 style={{ fontSize: 18 }}>{option.label}</h2>{option.curveFit !== null && <span className="mono" style={{ marginLeft: 'auto', color: 'var(--c-text-muted)' }}>{Math.round(option.curveFit * 100)}% on-curve</span>}</div><p style={{ margin: '4px 0 0', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.rationale}</p></button><ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>{tracks.map((track, index) => <li key={track.id}><TrackRow track={track} position={index + 1} starred={doc.starredTrackIds.includes(track.id)} onStar={() => void toggleStar(track.id)} />{index < tracks.length - 1 && option.transitions[index] && <TransitionChip transition={option.transitions[index]!} onFix={() => void fixTransition(option.id, index)} />}</li>)}</ol><ExportBar doc={doc} optionId={option.id} /></section>;
}
