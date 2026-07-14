/** Cheap probe: Codex CLI subprocess + output-parsing path (no big proposal). */
import { CodexCliAdapter } from '../server/src/brain/adapters/codexCli.js';
import { extractJsonObject } from '../server/src/brain/jsonExtract.js';

const adapter = new CodexCliAdapter(undefined);
const raw = await adapter.complete(
  'Respond with ONLY this exact JSON object and nothing else: {"ok":true,"who":"codex"}',
  { timeoutMs: 120000 },
);
const parsed = extractJsonObject(raw);
console.log('codex-cli adapter OK:', JSON.stringify(parsed));
