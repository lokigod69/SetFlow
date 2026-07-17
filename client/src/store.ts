import { create } from 'zustand';
import type { Constraints, Intent, IntentMode, SetDocument, CurvePoint } from '@setflow/shared';
import { DEFAULT_CONSTRAINTS } from '@setflow/shared';
import { api, awaitJob, type Job, type SetSummary } from './api';
import type { ThemeId } from './theme/tokens';

export type Stage = 'idle' | 'proposing' | 'resolving' | 'enriching' | 'validating' | 'error';

interface IntentDraft {
  mode: IntentMode;
  seedTrack: string;
  startTrack: string;
  endTrack: string;
  vibeText: string;
  artists: string[];
  targetCurve: CurvePoint[] | null;
}

interface SetflowState {
  // theme
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;

  // intent authoring
  draft: IntentDraft;
  constraints: Constraints;
  updateDraft: (patch: Partial<IntentDraft>) => void;
  updateConstraints: (patch: Partial<Constraints>) => void;

  // generation
  stage: Stage;
  stageDetail: string;
  progress: number;
  error: string | null;
  generate: () => Promise<void>;
  remix: (setId: string, flavor: string) => Promise<void>;

  // current set
  currentSet: SetDocument | null;
  activeOptionId: string;
  setActiveOption: (id: string) => void;
  loadSet: (id: string) => Promise<void>;
  toggleStar: (trackId: string) => Promise<void>;
  reorderOption: (optionId: string, trackIds: string[]) => Promise<void>;
  finalize: () => Promise<void>;
  fixTransition: (optionId: string, transitionIndex: number) => Promise<void>;
  renameSet: (name: string) => Promise<void>;
  applySetDoc: (doc: SetDocument) => void;

  // history
  history: SetSummary[];
  refreshHistory: () => Promise<void>;

  // ui
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  selectedTrackId: string | null;
  selectTrack: (id: string | null) => void;
}

const THEME_KEY = 'setflow.theme';

// Monotonic tokens so a slow async completion can't clobber fresher state.
// `setSeq` guards every op that REPLACES currentSet (generate/remix/finalize/
// fixTransition/loadSet); `starSeq` and `reorderSeq` order their optimistic edits.
let setSeq = 0;
let starSeq = 0;
let reorderSeq = 0;
// FIFO chain so reorder HTTP requests hit the server in dispatch order.
let reorderChain: Promise<unknown> = Promise.resolve();

const initialDraft: IntentDraft = {
  mode: 'vibe',
  seedTrack: '',
  startTrack: '',
  endTrack: '',
  vibeText: '',
  artists: [],
  targetCurve: null,
};

function draftToIntent(d: IntentDraft): Intent {
  return {
    mode: d.mode,
    seedTrack: d.seedTrack || undefined,
    startTrack: d.startTrack || undefined,
    endTrack: d.endTrack || undefined,
    vibeText: d.vibeText || undefined,
    artists: d.artists.length ? d.artists : undefined,
    targetCurve: d.targetCurve ?? undefined,
  };
}

function stageFromJob(j: Job): { stage: Stage; detail: string } {
  const s = j.stage.toLowerCase();
  if (s.includes('resolv')) return { stage: 'resolving', detail: j.stage };
  if (s.includes('enrich')) return { stage: 'enriching', detail: j.stage };
  if (s.includes('valid')) return { stage: 'validating', detail: j.stage };
  return { stage: 'proposing', detail: j.stage };
}

export const useSetflow = create<SetflowState>((set, get) => ({
  themeId: (localStorage.getItem(THEME_KEY) as ThemeId) || 'horizon',
  setTheme: (id) => {
    localStorage.setItem(THEME_KEY, id);
    set({ themeId: id });
  },

  draft: initialDraft,
  constraints: DEFAULT_CONSTRAINTS,
  updateDraft: (patch) => set((st) => ({ draft: { ...st.draft, ...patch } })),
  updateConstraints: (patch) => set((st) => ({ constraints: { ...st.constraints, ...patch } })),

  stage: 'idle',
  stageDetail: '',
  progress: 0,
  error: null,

  generate: async () => {
    const { draft, constraints } = get();
    const my = ++setSeq;
    set({ stage: 'proposing', stageDetail: 'asking the brain', progress: 0, error: null });
    try {
      const { jobId } = await api.propose(draftToIntent(draft), constraints);
      const doc = await awaitJob<SetDocument>(jobId, (j) => {
        if (my !== setSeq) return;
        const { stage, detail } = stageFromJob(j);
        set({ stage, stageDetail: detail, progress: j.progress });
      });
      if (my !== setSeq) return;
      set({ currentSet: doc, stage: 'idle', progress: 1, activeOptionId: doc.options[0]?.id ?? 'A' });
      void get().refreshHistory();
    } catch (e) {
      if (my !== setSeq) return;
      set({ stage: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  remix: async (setId, flavor) => {
    const my = ++setSeq;
    set({ stage: 'proposing', stageDetail: 'remixing', progress: 0, error: null });
    try {
      const { jobId } = await api.remix(setId, flavor);
      const doc = await awaitJob<SetDocument>(jobId, (j) => {
        if (my !== setSeq) return;
        const { stage, detail } = stageFromJob(j);
        set({ stage, stageDetail: detail, progress: j.progress });
      });
      if (my !== setSeq) return;
      set({ currentSet: doc, stage: 'idle', activeOptionId: doc.options[0]?.id ?? 'A' });
      void get().refreshHistory();
    } catch (e) {
      if (my !== setSeq) return;
      set({ stage: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  currentSet: null,
  activeOptionId: 'A',
  setActiveOption: (id) => set({ activeOptionId: id }),

  loadSet: async (id) => {
    const my = ++setSeq;
    const doc = await api.getSet(id);
    if (my !== setSeq) return;
    set({ currentSet: doc, activeOptionId: doc.options[0]?.id ?? 'A', selectedTrackId: null });
  },

  applySetDoc: (doc) => set({ currentSet: doc }),

  toggleStar: async (trackId) => {
    const doc = get().currentSet;
    if (!doc) return;
    const prev = doc.starredTrackIds;
    const starred = prev.includes(trackId)
      ? prev.filter((t) => t !== trackId)
      : [...prev, trackId];
    const my = ++starSeq;
    set({ currentSet: { ...doc, starredTrackIds: starred } }); // optimistic
    try {
      const saved = await api.patchSet(doc.id, { starredTrackIds: starred });
      if (my !== starSeq) return; // a newer toggle already superseded this response
      const cur = get().currentSet;
      if (cur && cur.id === saved.id) set({ currentSet: saved });
    } catch {
      if (my !== starSeq) return;
      const cur = get().currentSet;
      if (cur && cur.id === doc.id) set({ currentSet: { ...cur, starredTrackIds: prev } }); // roll back
    }
  },

  reorderOption: async (optionId, trackIds) => {
    const doc = get().currentSet;
    if (!doc) return;
    const option = doc.options.find((o) => o.id === optionId);
    if (!option) return;
    const prev = option.trackIds;
    const options = doc.options.map((o) => o.id === optionId ? { ...o, trackIds } : o);
    const my = ++reorderSeq;
    set({ currentSet: { ...doc, options } }); // optimistic; transitions update with the server doc
    try {
      // Serialize requests: two quick drags must reach the server in order, or the
      // older write could persist last while the UI shows the newer one.
      const send = reorderChain.then(() => api.reorder(doc.id, optionId, trackIds));
      reorderChain = send.then(() => undefined, () => undefined);
      const saved = await send;
      if (my !== reorderSeq) return; // a newer reorder already superseded this response
      const cur = get().currentSet;
      if (cur && cur.id === saved.id) set({ currentSet: saved });
    } catch {
      if (my !== reorderSeq) return;
      const cur = get().currentSet;
      if (cur && cur.id === doc.id) set({ currentSet: { ...cur, options: cur.options.map((o) => o.id === optionId ? { ...o, trackIds: prev } : o) } }); // roll back
    }
  },

  finalize: async () => {
    const doc = get().currentSet;
    if (!doc || doc.starredTrackIds.length < 2) return;
    const my = ++setSeq;
    set({ stage: 'proposing', stageDetail: 'building final set', progress: 0, error: null });
    try {
      const { jobId } = await api.finalize(doc.id, doc.starredTrackIds);
      const updated = await awaitJob<SetDocument>(jobId, (j) => {
        if (my !== setSeq) return;
        const { stage, detail } = stageFromJob(j);
        set({ stage, stageDetail: detail, progress: j.progress });
      });
      if (my !== setSeq) return;
      set({ currentSet: updated, stage: 'idle', activeOptionId: 'final' });
    } catch (e) {
      if (my !== setSeq) return;
      set({ stage: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  fixTransition: async (optionId, transitionIndex) => {
    const doc = get().currentSet;
    if (!doc) return;
    const my = ++setSeq;
    set({ stage: 'validating', stageDetail: 'fixing transition', error: null });
    try {
      const { jobId } = await api.fixTransition(doc.id, optionId, transitionIndex);
      const updated = await awaitJob<SetDocument>(jobId);
      if (my !== setSeq) return;
      set({ currentSet: updated, stage: 'idle' });
    } catch (e) {
      if (my !== setSeq) return;
      set({ stage: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  renameSet: async (name) => {
    const doc = get().currentSet;
    if (!doc) return;
    const saved = await api.patchSet(doc.id, { name });
    const cur = get().currentSet;
    if (cur && cur.id === saved.id) set({ currentSet: saved });
    void get().refreshHistory();
  },

  history: [],
  refreshHistory: async () => {
    try {
      set({ history: await api.listSets() });
    } catch {
      /* server not up yet — harmless */
    }
  },

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  selectedTrackId: null,
  selectTrack: (id) => set({ selectedTrackId: id }),
}));
