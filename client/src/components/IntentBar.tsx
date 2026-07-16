import { AnimatePresence, motion } from 'framer-motion';
import type { IntentMode } from '@setflow/shared';
import { useState, type KeyboardEvent } from 'react';
import { useSetflow } from '../store';
import { useTheme } from '../theme/ThemeProvider';
import { strictnessLabel } from './helpers';

const modes: Array<[IntentMode, string]> = [
  ['seed', 'Seed Track'], ['journey', 'A to B'], ['vibe', 'Vibe'], ['artist-mesh', 'Artist Mesh'], ['curve-first', 'Curve First'],
];

export function IntentBar() {
  const draft = useSetflow((s) => s.draft);
  const constraints = useSetflow((s) => s.constraints);
  const stage = useSetflow((s) => s.stage);
  const error = useSetflow((s) => s.error);
  const updateDraft = useSetflow((s) => s.updateDraft);
  const updateConstraints = useSetflow((s) => s.updateConstraints);
  const generate = useSetflow((s) => s.generate);
  const { motion: springs } = useTheme();
  const [artist, setArtist] = useState('');
  const needed = draft.mode === 'seed' ? draft.seedTrack.trim() : draft.mode === 'journey'
    ? draft.startTrack.trim() && draft.endTrack.trim() : draft.mode === 'vibe'
      ? draft.vibeText.trim() : draft.mode === 'artist-mesh' ? draft.artists.length > 0 : true;
  const addArtist = () => {
    const trimmed = artist.trim();
    if (trimmed && !draft.artists.includes(trimmed)) updateDraft({ artists: [...draft.artists, trimmed] });
    setArtist('');
  };
  const onArtistKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { event.preventDefault(); addArtist(); }
  };

  return <section className="panel panel-pad intent-panel" aria-label="Set intent">
    <div className="mode-row">
      <span className="label">start with</span>
      {modes.map(([id, label]) => <button key={id} className={`chip ${draft.mode === id ? 'active' : ''}`} onClick={() => updateDraft({ mode: id })}>{label}</button>)}
    </div>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={draft.mode} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={springs.spring} style={{ overflow: 'hidden' }} className="intent-input-zone">
        {draft.mode === 'seed' && <input style={{ width: '100%' }} type="text" value={draft.seedTrack} onChange={(e) => updateDraft({ seedTrack: e.target.value })} placeholder="Artist — Title (exact remix matters)" />}
        {draft.mode === 'journey' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}><input type="text" value={draft.startTrack} onChange={(e) => updateDraft({ startTrack: e.target.value })} placeholder="start track" /><input type="text" value={draft.endTrack} onChange={(e) => updateDraft({ endTrack: e.target.value })} placeholder="end track" /></div>}
        {draft.mode === 'vibe' && <textarea style={{ width: '100%', minHeight: 84, resize: 'vertical' }} value={draft.vibeText} onChange={(e) => updateDraft({ vibeText: e.target.value })} placeholder="golden hour brazil beach party" />}
        {draft.mode === 'artist-mesh' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{draft.artists.map((name) => <button key={name} className="chip active" onClick={() => updateDraft({ artists: draft.artists.filter((a) => a !== name) })}>{name} ×</button>)}<input style={{ flex: '1 1 180px' }} type="text" value={artist} onChange={(e) => setArtist(e.target.value)} onKeyDown={onArtistKey} onBlur={addArtist} placeholder="type an artist + Enter" /></div>}
        {draft.mode === 'curve-first' && <div><span className="label">curve first</span><p style={{ margin: '4px 0 8px', color: 'var(--c-text-muted)' }}>draw the arc below, then add flavor</p><input style={{ width: '100%' }} type="text" value={draft.vibeText} onChange={(e) => updateDraft({ vibeText: e.target.value })} placeholder="optional vibe flavor" /></div>}
      </motion.div>
    </AnimatePresence>
    <div className="controls-row">
      <label className="control"><span className="label">set size</span><div className="control-inline"><input className="mono" style={{ width: 68 }} type="number" min="1" value={constraints.setSize.value} onChange={(e) => updateConstraints({ setSize: { ...constraints.setSize, value: Number(e.target.value) || 1 } })} /><select value={constraints.setSize.type} onChange={(e) => updateConstraints({ setSize: { ...constraints.setSize, type: e.target.value as 'count' | 'minutes' } })}><option value="count">tracks</option><option value="minutes">minutes</option></select></div></label>
      <label className="control"><span className="label">energy</span><select value={constraints.energyBehavior} onChange={(e) => updateConstraints({ energyBehavior: e.target.value as typeof constraints.energyBehavior })}><option value="flat">flat</option><option value="rise">rise</option><option value="rise-peak-cooldown">rise / peak / cooldown</option><option value="custom">custom</option></select></label>
      <label className="control" style={{ minWidth: 160 }}><span className="label">harmony · {strictnessLabel(constraints.harmonicStrictness)}</span><input className="control-range" type="range" min="0" max="1" step=".05" value={constraints.harmonicStrictness} onChange={(e) => updateConstraints({ harmonicStrictness: Number(e.target.value) })} /></label>
      <label className="control"><span className="label">BPM max Δ</span><input className="mono" style={{ width: 70 }} type="number" min="1" value={constraints.bpmPolicy.maxDeltaPercent} onChange={(e) => updateConstraints({ bpmPolicy: { ...constraints.bpmPolicy, maxDeltaPercent: Number(e.target.value) || 1 } })} /></label>
      <button className="btn primary architect-btn" disabled={!needed || stage !== 'idle'} onClick={() => void generate()}>Architect the set</button>
    </div>
    {stage === 'error' && error && <p className="danger-text" style={{ margin: '10px 0 0' }}>{error}</p>}
  </section>;
}
