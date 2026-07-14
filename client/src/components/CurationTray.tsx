import { useSetflow } from '../store';
import { trackName } from './helpers';

export function CurationTray() {
  const doc = useSetflow((s) => s.currentSet);
  const stage = useSetflow((s) => s.stage);
  const selectTrack = useSetflow((s) => s.selectTrack);
  const finalize = useSetflow((s) => s.finalize);
  if (!doc) return null;
  const starred = doc.pool.filter((track) => doc.starredTrackIds.includes(track.id));
  const finalReady = doc.options.some((option) => option.id === 'final');
  return <aside className="panel panel-pad no-print curation-tray" style={{ position: 'sticky', bottom: 12, zIndex: 3, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><div style={{ flex: '1 1 360px' }}><span className="label">curation</span><span className="mono" style={{ marginLeft: 8, color: 'var(--c-text-muted)' }}>{starred.length} of {doc.pool.length} starred</span><div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5, marginLeft: 10 }}>{starred.map((track) => <button className="chip" key={track.id} onClick={() => selectTrack(track.id)} style={{ padding: '3px 8px', fontSize: 11 }}>{trackName(track)}</button>)}</div></div>{finalReady && <span className="label" style={{ color: 'var(--c-success)' }}>final set ready</span>}<button className="btn primary" disabled={starred.length < 2 || stage !== 'idle'} onClick={() => void finalize()}>Build final set</button></aside>;
}
