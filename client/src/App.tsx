import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './theme/ThemeProvider';
import { useSetflow } from './store';
import { EnergyArc } from './arc/EnergyArc';
import { IntentBar } from './components/IntentBar';
import { OptionColumn } from './components/OptionColumn';
import { CurationTray } from './components/CurationTray';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SetHistory } from './components/SetHistory';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { StagePulse } from './components/StagePulse';
import { TrackCardOverlay } from './components/TrackCard';
import { SpotifyBadge } from './components/SpotifyBadge';
import './styles.css';

function Shell() {
  const doc = useSetflow((s) => s.currentSet);
  const activeOptionId = useSetflow((s) => s.activeOptionId);
  const draft = useSetflow((s) => s.draft);
  const updateDraft = useSetflow((s) => s.updateDraft);
  const stage = useSetflow((s) => s.stage);
  const selectTrack = useSetflow((s) => s.selectTrack);
  const setSettingsOpen = useSetflow((s) => s.setSettingsOpen);
  const refreshHistory = useSetflow((s) => s.refreshHistory);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const arcMode = draft.mode === 'curve-first' && !doc ? 'draw' : 'predict';

  return (
    <>
      <div className="atmosphere" aria-hidden />
      <div className="app">
        <header className="topbar">
          <span className="wordmark">SETFLOW</span>
          <span className="label">set architect</span>
          <span className="spacer" />
          <SpotifyBadge />
          <SetHistory />
          <button className="btn quiet no-print" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            settings
          </button>
          <ThemeSwitcher />
        </header>

        <IntentBar />

        <AnimatePresence>{stage !== 'idle' && stage !== 'error' && <StagePulse />}</AnimatePresence>

        {(doc || arcMode === 'draw') && (
          <motion.section
            className="panel panel-pad"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <span className="label">{arcMode === 'draw' ? 'draw your journey' : 'energy arc'}</span>
              {doc && <h2 style={{ fontSize: 16 }}>{doc.name}</h2>}
            </div>
            <EnergyArc
              doc={doc}
              activeOptionId={activeOptionId}
              mode={arcMode}
              draftCurve={arcMode === 'draw' ? draft.targetCurve : null}
              onCurveChange={(pts) => updateDraft({ targetCurve: pts })}
              onNodeTap={(id) => selectTrack(id)}
              onNodeLongPress={(id) => selectTrack(id)}
            />
          </motion.section>
        )}

        {doc && (
          <div className="options-row">
            {doc.options
              .filter((o) => o.id !== 'final' || activeOptionId === 'final')
              .map((opt) => (
                <OptionColumn key={opt.id} doc={doc} option={opt} />
              ))}
          </div>
        )}

        {doc && <CurationTray />}
      </div>

      <SettingsDrawer />
      <TrackCardOverlay />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  );
}
