import { useEffect, useRef, useState } from 'react';
import { api, type SpotifyStatus } from '../api';
import { useSetflow } from '../store';

export function SpotifyBadge() {
  const settingsOpen = useSetflow((s) => s.settingsOpen); const setSettingsOpen = useSetflow((s) => s.setSettingsOpen); const [status, setStatus] = useState<SpotifyStatus | null>(null); const timer = useRef<number | null>(null);
  const refresh = async () => { try { setStatus(await api.spotifyStatus()); } catch { setStatus({ connected: false, clientIdConfigured: false }); } };
  useEffect(() => { void refresh(); return () => { if (timer.current) window.clearInterval(timer.current); }; }, []);
  useEffect(() => { if (!settingsOpen) void refresh(); }, [settingsOpen]);
  const connect = () => { if (!status?.clientIdConfigured) { setSettingsOpen(true); return; } window.open('/auth/spotify/login', 'setflow-spotify', 'popup,width=520,height=720'); const started = Date.now(); if (timer.current) window.clearInterval(timer.current); timer.current = window.setInterval(() => { void api.spotifyStatus().then((current) => { setStatus(current); if (Date.now() - started > 120000 || current.connected) { if (timer.current) window.clearInterval(timer.current); } }).catch(() => undefined); }, 2000); };
  return status?.connected ? <span className="chip"><span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-success)' }} />{status.displayName || 'Spotify connected'}</span> : <button className="chip" onClick={connect}>connect Spotify</button>;
}
