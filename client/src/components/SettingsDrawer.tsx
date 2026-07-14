import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { BrainAdapterInfo } from '@setflow/shared';
import { api, awaitJob, type AnalyzerStatus } from '../api';
import { useSetflow } from '../store';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Advanced Settings drawer (spec §8): a drawer, not a page-wall.
 * State mirrors the server's NESTED settings shape (brain/spotify/sources/
 * defaults/analyzer); secrets never round-trip — the server redacts them to
 * has* booleans, and empty inputs are omitted from PUTs so they can't clobber.
 */

interface ServerSettings {
  brain: {
    adapterId: string;
    claudeCliPath?: string;
    codexCliPath?: string;
    anthropicModel?: string;
    timeoutMs?: number;
    promptOverrides: Record<string, string>;
    hasAnthropicApiKey?: boolean;
  };
  spotify: { redirectUri?: string; hasClientId?: boolean; connected?: boolean };
  sources: {
    deezer: boolean;
    getSongBpm: boolean;
    hasGetSongBpmApiKey?: boolean;
    hasYoutubeApiKey?: boolean;
  };
  defaults: { constraints: Record<string, unknown> };
  analyzer: { url?: string; musicFolder?: string };
  promptDefaults?: Record<string, string>;
}

const PROMPT_KINDS = ['propose', 'replace', 'finalize', 'fix-transition', 'alternatives'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: '16px 0', borderBottom: 'var(--tx-border-w) solid var(--c-panel-border)' }}>
      <div className="label" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'number';
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginTop: 10 }}>
      <span className="label">{label}</span>
      <input style={{ display: 'block', width: '100%', marginTop: 3 }} type={type} value={value}
        placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'block', margin: '8px 0' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span aria-hidden style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: ok ? 'var(--c-success)' : 'var(--c-danger)', marginRight: 6,
    }} />
  );
}

export function SettingsDrawer() {
  const open = useSetflow((s) => s.settingsOpen);
  const setOpen = useSetflow((s) => s.setSettingsOpen);
  const { motion: springs } = useTheme();

  const [s, setS] = useState<ServerSettings | null>(null);
  const [adapters, setAdapters] = useState<BrainAdapterInfo[]>([]);
  const [analyzer, setAnalyzer] = useState<AnalyzerStatus>({ connected: false });
  const [spotifyName, setSpotifyName] = useState<string | undefined>();
  const [saved, setSaved] = useState('');
  const [promptKind, setPromptKind] = useState('propose');
  const [scanNote, setScanNote] = useState('');
  // secrets are local-only drafts, never echoed back by the server
  const [anthropicKey, setAnthropicKey] = useState('');
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [gsbKey, setGsbKey] = useState('');
  const [ytKey, setYtKey] = useState('');

  const load = async () => {
    const [raw, brain, spot, an] = await Promise.all([
      api.getSettings(), api.brainAdapters(), api.spotifyStatus(), api.analyzerStatus(),
    ]);
    setS(raw as unknown as ServerSettings);
    setAdapters(brain.adapters);
    setSpotifyName(spot.displayName);
    setAnalyzer(an);
  };
  useEffect(() => { if (open) void load(); }, [open]);

  if (!open || !s) {
    return <AnimatePresence>{null}</AnimatePresence>;
  }

  const flash = (msg: string) => { setSaved(msg); window.setTimeout(() => setSaved(''), 1800); };
  const put = async (patch: Record<string, unknown>, msg: string) => {
    const next = await api.putSettings(patch);
    setS(next as unknown as ServerSettings);
    flash(msg);
  };

  const saveBrain = () =>
    put({
      brain: {
        adapterId: s.brain.adapterId,
        claudeCliPath: s.brain.claudeCliPath || undefined,
        codexCliPath: s.brain.codexCliPath || undefined,
        timeoutMs: s.brain.timeoutMs,
        promptOverrides: s.brain.promptOverrides,
        ...(anthropicKey ? { anthropicApiKey: anthropicKey } : {}),
      },
    }, 'brain saved').then(() => setAnthropicKey(''));

  const saveSpotify = () =>
    put({ spotify: spotifyClientId ? { clientId: spotifyClientId } : {} }, 'Spotify saved')
      .then(() => setSpotifyClientId(''));

  const saveSources = () =>
    put({
      sources: {
        deezer: s.sources.deezer,
        getSongBpm: s.sources.getSongBpm,
        ...(gsbKey ? { getSongBpmApiKey: gsbKey } : {}),
        ...(ytKey ? { youtubeApiKey: ytKey } : {}),
      },
    }, 'sources saved').then(() => { setGsbKey(''); setYtKey(''); });

  const savePolicies = () => put({ defaults: { constraints: s.defaults.constraints } }, 'policies saved');
  const saveAnalyzer = () => put({ analyzer: { musicFolder: s.analyzer.musicFolder || undefined } }, 'analyzer saved');

  const constraints = s.defaults.constraints as {
    harmonicStrictness?: number;
    bpmPolicy?: { maxDeltaPercent?: number; allowHalfDouble?: boolean };
    preferExtendedMixes?: boolean;
  };
  const setConstraints = (patch: Record<string, unknown>) =>
    setS({ ...s, defaults: { constraints: { ...s.defaults.constraints, ...patch } } });

  const scanFolder = async () => {
    const folder = s.analyzer.musicFolder;
    if (!folder) return;
    await saveAnalyzer();
    setScanNote('starting scan');
    try {
      const { jobId } = await api.analyzerScan(folder);
      await awaitJob<Record<string, unknown>>(jobId, (j) =>
        setScanNote(`${Math.round(j.progress * 100)}% ${j.stage ?? ''}`),
      );
      setScanNote('scan complete');
      setAnalyzer(await api.analyzerStatus());
    } catch {
      setScanNote('analyzer not reachable — start it with python run.py');
    }
  };

  const overrides = s.brain.promptOverrides ?? {};
  const promptValue = overrides[promptKind] ?? '';

  const connectSpotify = () => {
    window.open('/auth/spotify/login', 'setflow-spotify', 'width=520,height=720');
  };

  return (
    <AnimatePresence>
      <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.35)' }}
        onMouseDown={() => setOpen(false)}>
        <motion.aside className="panel scroll-y"
          initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 32, opacity: 0 }}
          transition={{ type: 'spring', ...springs.spring }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ marginLeft: 'auto', width: 'min(430px, 100%)', height: '100%', padding: '20px 22px', borderRadius: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 22 }}>settings</h2>
            <button className="btn quiet" onClick={() => setOpen(false)}>close</button>
          </div>
          {saved && <p className="label" style={{ color: 'var(--c-success)' }}>{saved} ✓</p>}

          <Section title="brain">
            <div style={{ display: 'grid', gap: 8 }}>
              {adapters.map((a) => (
                <label key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                  <input type="radio" name="adapter" checked={s.brain.adapterId === a.id}
                    onChange={() => setS({ ...s, brain: { ...s.brain, adapterId: a.id } })} />
                  <span>
                    <Dot ok={a.available} />{a.label}
                    <small style={{ display: 'block', color: 'var(--c-text-muted)' }}>{a.detail}</small>
                  </span>
                </label>
              ))}
            </div>
            <Field label="Claude CLI path (optional)" value={s.brain.claudeCliPath ?? ''}
              onChange={(v) => setS({ ...s, brain: { ...s.brain, claudeCliPath: v } })} placeholder="claude" />
            <Field label="Codex CLI path (optional)" value={s.brain.codexCliPath ?? ''}
              onChange={(v) => setS({ ...s, brain: { ...s.brain, codexCliPath: v } })} placeholder="codex" />
            <Field label="Anthropic API key" type="password" value={anthropicKey}
              onChange={setAnthropicKey} placeholder={s.brain.hasAnthropicApiKey ? '••• key saved' : 'only for the API adapter'} />
            <Field label="Timeout (ms)" type="number" value={String(s.brain.timeoutMs ?? 240000)}
              onChange={(v) => setS({ ...s, brain: { ...s.brain, timeoutMs: Number(v) || 240000 } })} />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => void saveBrain()}>save brain</button>
          </Section>

          <Section title="spotify">
            <ol style={{ paddingLeft: 18, margin: '0 0 10px', color: 'var(--c-text-muted)' }}>
              <li>create a free app at developer.spotify.com/dashboard</li>
              <li>set the redirect URI exactly to<br /><span className="mono" style={{ fontSize: 11 }}>http://127.0.0.1:8321/auth/spotify/callback</span></li>
              <li>paste the Client ID here and connect</li>
            </ol>
            <Field label="Client ID" value={spotifyClientId} onChange={setSpotifyClientId}
              placeholder={s.spotify.hasClientId ? '••• saved' : ''} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <button className="btn" onClick={() => void saveSpotify()}>save</button>
              {s.spotify.hasClientId && !s.spotify.connected && (
                <button className="btn primary" onClick={connectSpotify}>connect Spotify</button>
              )}
              <span style={{ color: 'var(--c-text-muted)' }}>
                <Dot ok={Boolean(s.spotify.connected)} />
                {s.spotify.connected ? `connected${spotifyName ? ` as ${spotifyName}` : ''}` : 'not connected'}
              </span>
            </div>
            {s.spotify.connected && (
              <button className="btn quiet" style={{ marginTop: 8 }}
                onClick={() => void api.spotifyDisconnect().then(load)}>disconnect</button>
            )}
          </Section>

          <Section title="sources">
            <Check label="Deezer (BPM, no key needed)" checked={s.sources.deezer}
              onChange={(v) => setS({ ...s, sources: { ...s.sources, deezer: v } })} />
            <Check label="GetSongBPM (BPM + key)" checked={s.sources.getSongBpm}
              onChange={(v) => setS({ ...s, sources: { ...s.sources, getSongBpm: v } })} />
            <Field label="GetSongBPM API key (free)" value={gsbKey} onChange={setGsbKey}
              placeholder={s.sources.hasGetSongBpmApiKey ? '••• saved' : ''} />
            <p className="label">key &amp; BPM data by <a href="https://getsongbpm.com" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>GetSongBPM.com</a></p>
            <Field label="YouTube Data API key (optional)" value={ytKey} onChange={setYtKey}
              placeholder={s.sources.hasYoutubeApiKey ? '••• saved' : 'plain search links without it'} />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => void saveSources()}>save sources</button>
          </Section>

          <Section title="policies">
            <label className="label">
              default harmonic strictness · {(constraints.harmonicStrictness ?? 0.8) >= 0.75 ? 'strict' : (constraints.harmonicStrictness ?? 0.8) >= 0.35 ? 'medium' : 'loose'}
              <input style={{ display: 'block', width: '100%' }} type="range" min="0" max="1" step="0.05"
                value={constraints.harmonicStrictness ?? 0.8}
                onChange={(e) => setConstraints({ harmonicStrictness: Number(e.target.value) })} />
            </label>
            <Field label="BPM max delta (%)" type="number"
              value={String(constraints.bpmPolicy?.maxDeltaPercent ?? 6)}
              onChange={(v) => setConstraints({ bpmPolicy: { ...constraints.bpmPolicy, maxDeltaPercent: Number(v) || 6 } })} />
            <Check label="Allow half / double-time reads" checked={constraints.bpmPolicy?.allowHalfDouble ?? true}
              onChange={(v) => setConstraints({ bpmPolicy: { ...constraints.bpmPolicy, allowHalfDouble: v } })} />
            <Check label="Prefer extended / club mixes" checked={constraints.preferExtendedMixes ?? true}
              onChange={(v) => setConstraints({ preferExtendedMixes: v })} />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => void savePolicies()}>save policies</button>
          </Section>

          <Section title="prompt templates">
            <select value={promptKind} onChange={(e) => setPromptKind(e.target.value)}>
              {PROMPT_KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <textarea className="mono"
              style={{ display: 'block', width: '100%', minHeight: 140, marginTop: 8, fontSize: 12 }}
              value={promptValue}
              placeholder={s.promptDefaults?.[promptKind] ?? 'server default in use'}
              onChange={(e) => setS({ ...s, brain: { ...s.brain, promptOverrides: { ...overrides, [promptKind]: e.target.value } } })} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="btn" onClick={() => void saveBrain()}>save template</button>
              <button className="btn quiet" onClick={() => {
                const next = { ...overrides };
                delete next[promptKind];
                setS({ ...s, brain: { ...s.brain, promptOverrides: next } });
              }}>reset to default</button>
            </div>
          </Section>

          <Section title="analyzer">
            <p><Dot ok={analyzer.connected} />{analyzer.connected ? 'connected' : 'not running'}</p>
            {!analyzer.connected && (
              <code className="mono" style={{ display: 'block', fontSize: 11, margin: '6px 0' }}>
                cd analyzer && .venv\Scripts\python.exe run.py
              </code>
            )}
            <Field label="Music folder" value={s.analyzer.musicFolder ?? ''}
              onChange={(v) => setS({ ...s, analyzer: { ...s.analyzer, musicFolder: v } })}
              placeholder="D:\Music" />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => void scanFolder()}>scan folder</button>
            {scanNote && <p className="mono" style={{ fontSize: 12 }}>{scanNote}</p>}
            {typeof analyzer.trackCount === 'number' && (
              <p className="label">{analyzer.trackCount} tracks in library</p>
            )}
          </Section>

          <Section title="about">
            <p style={{ color: 'var(--c-text-muted)' }}>
              Track data: Spotify. BPM &amp; key enrichment: Deezer and GetSongBPM.com (attribution required).
              Local measurement: librosa. SETFLOW never downloads or rips audio.
            </p>
          </Section>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
