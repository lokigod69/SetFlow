import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { ConstraintsSchema, type Constraints } from '@setflow/shared';

const dataDir = process.env.SETFLOW_DATA_DIR ?? resolve(process.cwd(), 'server/data');
const settingsPath = resolve(dataDir, 'settings.json');

const SettingsSchema = z.object({
  brain: z.object({
    adapterId: z.enum(['claude-cli', 'codex-cli', 'anthropic-api']).default('claude-cli'),
    claudeCliPath: z.string().optional(), codexCliPath: z.string().optional(),
    anthropicApiKey: z.string().optional(), anthropicModel: z.string().default('claude-sonnet-5'),
    timeoutMs: z.number().int().min(1000).default(240000), promptOverrides: z.record(z.string()).default({}),
  }).default({}),
  spotify: z.object({
    clientId: z.string().optional(), redirectUri: z.string().default('http://127.0.0.1:8321/auth/spotify/callback'),
    tokens: z.object({ accessToken: z.string(), refreshToken: z.string(), expiresAt: z.number() }).optional(),
  }).default({}),
  sources: z.object({ deezer: z.boolean().default(true), getSongBpm: z.boolean().default(true), getSongBpmApiKey: z.string().optional(), youtubeApiKey: z.string().optional() }).default({}),
  defaults: z.object({ constraints: ConstraintsSchema.partial().default({}) }).default({}),
  analyzer: z.object({ url: z.string().default('http://127.0.0.1:8322'), musicFolder: z.string().optional() }).default({}),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const defaultSettings = (): Settings => SettingsSchema.parse({});

export class SettingsStore {
  constructor(private readonly path = settingsPath) { this.ensure(); }
  private ensure() { mkdirSync(dirname(this.path), { recursive: true }); try { readFileSync(this.path); } catch { this.save(defaultSettings()); } }
  get(): Settings {
    let raw: string;
    try { raw = readFileSync(this.path, 'utf8'); } catch { return defaultSettings(); } // missing file → defaults
    try { return SettingsSchema.parse(JSON.parse(raw)); } catch {
      // Present but invalid: preserve it before anyone save()s defaults over real secrets.
      try { writeFileSync(`${this.path}.corrupt-${Date.now()}.bak`, raw); } catch { /* best effort */ }
      return defaultSettings();
    }
  }
  save(value: Settings) { writeFileSync(this.path, JSON.stringify(SettingsSchema.parse(value), null, 2)); }
  update(value: Partial<Settings>): Settings {
    const current = this.get();
    const merged = {
      ...current, ...value,
      // tokens: an explicit `tokens` key (even undefined) wins — that's how disconnect clears them;
      // a patch that omits `spotify.tokens` entirely keeps the stored ones.
      brain: { ...current.brain, ...value.brain }, spotify: { ...current.spotify, ...value.spotify, tokens: value.spotify && 'tokens' in value.spotify ? value.spotify.tokens : current.spotify.tokens },
      sources: { ...current.sources, ...value.sources }, defaults: { ...current.defaults, ...value.defaults, constraints: { ...current.defaults.constraints, ...value.defaults?.constraints } },
      analyzer: { ...current.analyzer, ...value.analyzer },
    };
    const parsed = SettingsSchema.parse(merged); this.save(parsed); return parsed;
  }
}
export const settingsStore = new SettingsStore();
export function redactSettings(s: Settings) {
  return { ...s, brain: { ...s.brain, anthropicApiKey: undefined, hasAnthropicApiKey: Boolean(s.brain.anthropicApiKey) },
    spotify: { ...s.spotify, clientId: undefined, tokens: undefined, hasClientId: Boolean(s.spotify.clientId), connected: Boolean(s.spotify.tokens?.accessToken) },
    sources: { ...s.sources, getSongBpmApiKey: undefined, youtubeApiKey: undefined, hasGetSongBpmApiKey: Boolean(s.sources.getSongBpmApiKey), hasYoutubeApiKey: Boolean(s.sources.youtubeApiKey) } };
}
export function mergedConstraints(settings: Settings, supplied?: Partial<Constraints>): Constraints { return ConstraintsSchema.parse({ ...settings.defaults.constraints, ...supplied }); }
