/**
 * AT10 live probe: one real brain call through the Claude Code CLI adapter.
 * Run: npm exec -w server tsx ../verify/live-brain.ts
 * Proves: prompt build → subprocess spawn → JSON extraction → zod validation.
 */
import { callBrain } from '../server/src/brain/index.js';
import { settingsStore } from '../server/src/config.js';
import { DEFAULT_CONSTRAINTS } from '@setflow/shared';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

delete process.env.SETFLOW_MOCK;

const settings = settingsStore.get();
settings.brain.adapterId = 'claude-cli';

const t0 = Date.now();
console.log('calling claude CLI (this uses your quota once, ~1–3 min)…');
const result = await callBrain(
  {
    kind: 'propose',
    context: {
      intent: { mode: 'vibe', vibeText: 'golden hour brazil beach party' },
      constraints: { ...DEFAULT_CONSTRAINTS, setSize: { type: 'count', value: 8 } },
      targetCurve: null,
    },
  },
  settings,
);

const secs = ((Date.now() - t0) / 1000).toFixed(0);
const dir = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(dir, 'artifacts', 'at10-live-claude-proposal.json'), JSON.stringify(result, null, 2));
console.log(`OK in ${secs}s — pool=${result.pool.length}, options=${result.options.map((o: { id: string }) => o.id).join(',')}`);
console.log('sample:', result.pool.slice(0, 3).map((t: { artist: string; title: string; mix: string; estKey: string; estBpm: number }) => `${t.artist} – ${t.title}${t.mix ? ` (${t.mix})` : ''} [${t.estKey} ${t.estBpm}]`).join(' | '));
