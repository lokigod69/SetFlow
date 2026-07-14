import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { SetDocument } from '@setflow/shared';
import { ApiError, api } from '../api';
import { useSetflow } from '../store';
import { SetSheet } from './SetSheet';

export function ExportBar({ doc, optionId }: { doc: SetDocument; optionId: string }) {
  const applySetDoc = useSetflow((s) => s.applySetDoc);
  const setSettingsOpen = useSetflow((s) => s.setSettingsOpen);
  const [syncing, setSyncing] = useState(false); const [spotifyUrl, setSpotifyUrl] = useState<string | null>(doc.spotifyPlaylist?.optionId === optionId ? doc.spotifyPlaylist.url : null); const [copied, setCopied] = useState(false); const [sheet, setSheet] = useState(false);
  const sync = async () => { setSyncing(true); try { const result = await api.exportSpotify(doc.id, optionId); setSpotifyUrl(result.url); applySetDoc(await api.getSet(doc.id)); } catch (error) { if (error instanceof ApiError && (error.status === 400 || error.status === 401)) setSettingsOpen(true); } finally { setSyncing(false); } };
  const copyYoutube = async () => { const text = await fetch(api.exportUrl(doc.id, 'youtube', optionId)).then((res) => res.text()); await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  return <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderTop: 'var(--tx-border-w) solid var(--c-panel-border)', paddingTop: 12, marginTop: 12 }}><button className="btn quiet" onClick={() => void sync()} disabled={syncing}>{syncing ? 'syncing' : 'Spotify playlist'}</button>{spotifyUrl && <a className="btn quiet" href={spotifyUrl} target="_blank" rel="noreferrer">open playlist ↗</a>}{(['m3u8', 'csv', 'txt', 'rekordbox'] as const).map((format) => <a key={format} className="btn quiet" href={api.exportUrl(doc.id, format, optionId)} download>{format}</a>)}<button className="btn quiet" onClick={() => void copyYoutube()}>YouTube links</button>{copied && <span className="label" style={{ color: 'var(--c-success)' }}>copied</span>}<button className="btn quiet" onClick={() => setSheet(true)}>Set sheet</button>{sheet && createPortal(<SetSheet doc={doc} optionId={optionId} onClose={() => setSheet(false)} />, document.body)}</div>;
}
