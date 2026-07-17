import { useEffect, useRef, useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import type { SetDocument, SetOption, TrackCandidate } from '@setflow/shared';
import { useSetflow } from '../store';
import { useTheme } from '../theme/ThemeProvider';
import { ExportBar } from './ExportBar';
import { TransitionChip } from './TransitionChip';
import { trackName } from './helpers';

function TrackRow({ track, position, starred, onStar, canDrag, dragControls }: { track: TrackCandidate; position: number; starred: boolean; onStar: () => void; canDrag: boolean; dragControls: ReturnType<typeof useDragControls> }) {
  const selectTrack = useSetflow((s) => s.selectTrack);
  const { motion: springs } = useTheme();
  return <motion.div layout transition={springs.spring} onClick={() => selectTrack(track.id)} style={{ display: 'grid', gridTemplateColumns: '18px 26px minmax(0, 1fr) auto auto auto', gap: 8, alignItems: 'center', padding: '7px 0', cursor: 'pointer' }}><span className="track-drag-handle" aria-label="Drag to reorder track" aria-disabled={!canDrag} onPointerDown={(event) => { if (canDrag) dragControls.start(event); }}>⠿</span><span className="mono" style={{ color: 'var(--c-text-faint)' }}>{String(position).padStart(2, '0')}</span><span title={trackName(track)} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trackName(track)} {track.resolution === 'unresolved' && <small className="danger-text">unresolved</small>}</span><span className="mono">{track.key.value || '—'}</span><span className="mono">{Math.round(track.bpm.value || 0) || '—'}</span><button className="btn quiet" aria-label={starred ? 'Unstar track' : 'Star track'} onClick={(e) => { e.stopPropagation(); onStar(); }} style={{ padding: 3, color: starred ? 'var(--c-accent)' : undefined }}>{starred ? '★' : '☆'}</button><span className={`badge ${track.bpm.status}`} style={{ gridColumn: '3 / -1', justifySelf: 'start' }}>{track.bpm.status}</span></motion.div>;
}

function TrackItem({ track, position, starred, transition, canDrag, onStar, onFix, onDragEnd }: { track: TrackCandidate; position: number; starred: boolean; transition: SetOption['transitions'][number] | undefined; canDrag: boolean; onStar: () => void; onFix: () => void; onDragEnd: () => void }) {
  const dragControls = useDragControls();
  const { motion: springs } = useTheme();
  return <Reorder.Item as="li" value={track.id} dragListener={false} dragControls={dragControls} drag={canDrag ? 'y' : false} layout transition={springs.spring} onDragEnd={onDragEnd}><TrackRow track={track} position={position} starred={starred} onStar={onStar} canDrag={canDrag} dragControls={dragControls} />{transition && <TransitionChip transition={transition} onFix={onFix} />}</Reorder.Item>;
}

export function OptionColumn({ doc, option }: { doc: SetDocument; option: SetOption }) {
  const activeOptionId = useSetflow((s) => s.activeOptionId);
  const setActiveOption = useSetflow((s) => s.setActiveOption);
  const toggleStar = useSetflow((s) => s.toggleStar);
  const reorderOption = useSetflow((s) => s.reorderOption);
  const fixTransition = useSetflow((s) => s.fixTransition);
  const stage = useSetflow((s) => s.stage);
  const [order, setOrder] = useState(option.trackIds);
  const orderRef = useRef(order);
  useEffect(() => { setOrder(option.trackIds); orderRef.current = option.trackIds; }, [option.trackIds]);
  const tracks = order.map((id) => doc.pool.find((track) => track.id === id)).filter((track): track is TrackCandidate => Boolean(track));
  const handleReorder = (next: string[]) => { orderRef.current = next; setOrder(next); };
  const commitReorder = () => { const next = orderRef.current; if (next.length === option.trackIds.length && next.some((id, index) => id !== option.trackIds[index])) void reorderOption(option.id, next); };
  return <section className="panel panel-pad" style={{ borderColor: activeOptionId === option.id ? 'var(--c-accent)' : undefined }}><button onClick={() => setActiveOption(option.id)} style={{ display: 'block', textAlign: 'left', width: '100%', marginBottom: 10 }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span className="label">option {option.id === 'final' ? 'final' : option.id}</span><h2 style={{ fontSize: 18 }}>{option.label}</h2>{option.curveFit !== null && <span className="mono" style={{ marginLeft: 'auto', color: 'var(--c-text-muted)' }}>{Math.round(option.curveFit * 100)}% on-curve</span>}</div><p style={{ margin: '4px 0 0', color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.rationale}</p></button><Reorder.Group as="ol" axis="y" values={order} onReorder={handleReorder} style={{ listStyle: 'none', padding: 0, margin: 0 }}>{tracks.map((track, index) => <TrackItem key={track.id} track={track} position={index + 1} starred={doc.starredTrackIds.includes(track.id)} transition={index < tracks.length - 1 ? option.transitions[index] : undefined} canDrag={stage === 'idle'} onStar={() => void toggleStar(track.id)} onFix={() => void fixTransition(option.id, index)} onDragEnd={commitReorder} />)}</Reorder.Group><ExportBar doc={doc} optionId={option.id} /></section>;
}
