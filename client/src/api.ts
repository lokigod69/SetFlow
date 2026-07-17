import type { Constraints, Intent, SetDocument, BrainAdapterInfo, BrainTrack } from '@setflow/shared';

/** Typed client for the SETFLOW server API (proxied via /api in dev). */

export interface Job<T = unknown> {
  id: string;
  status: 'running' | 'done' | 'error';
  stage: string;
  progress: number;
  result?: T;
  error?: string;
}

export interface SetSummary {
  id: string;
  name: string;
  createdAt: string;
  mode: string;
  trackCount: number;
}

export interface SpotifyStatus {
  connected: boolean;
  displayName?: string;
  clientIdConfigured: boolean;
}

export interface AnalyzerStatus {
  connected: boolean;
  trackCount?: number;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const post = <T>(path: string, body?: unknown) =>
  http<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  health: () => http<{ ok: boolean }>('/api/health'),

  // settings
  getSettings: () => http<Record<string, unknown>>('/api/settings'),
  putSettings: (patch: Record<string, unknown>) =>
    http<Record<string, unknown>>('/api/settings', { method: 'PUT', body: JSON.stringify(patch) }),
  brainAdapters: () => http<{ current: string; adapters: BrainAdapterInfo[] }>('/api/brain/adapters'),

  // sets
  propose: (intent: Intent, constraints: Partial<Constraints>) =>
    post<{ jobId: string }>('/api/sets/propose', { intent, constraints }),
  job: <T>(id: string) => http<Job<T>>(`/api/jobs/${id}`),
  listSets: () => http<SetSummary[]>('/api/sets'),
  getSet: (id: string) => http<SetDocument>(`/api/sets/${id}`),
  patchSet: (id: string, patch: { name?: string; starredTrackIds?: string[] }) =>
    http<SetDocument>(`/api/sets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteSet: (id: string) => http<{ ok: boolean }>(`/api/sets/${id}`, { method: 'DELETE' }),
  remix: (id: string, flavor: string) => post<{ jobId: string }>(`/api/sets/${id}/remix`, { flavor }),
  finalize: (id: string, starredTrackIds: string[]) =>
    post<{ jobId: string }>(`/api/sets/${id}/finalize`, { starredTrackIds }),
  fixTransition: (id: string, optionId: string, transitionIndex: number) =>
    post<{ jobId: string }>(`/api/sets/${id}/fix-transition`, { optionId, transitionIndex }),
  alternatives: (id: string, trackId: string) =>
    post<{ jobId: string }>(`/api/sets/${id}/alternatives`, { trackId }),
  swap: (id: string, fromTrackId: string, toCandidate: BrainTrack, optionId?: string) =>
    post<SetDocument>(`/api/sets/${id}/swap`, { fromTrackId, toCandidate, optionId }),
  reorder: (id: string, optionId: string, trackIds: string[]) =>
    post<SetDocument>(`/api/sets/${id}/reorder`, { optionId, trackIds }),

  // exports
  exportSpotify: (id: string, optionId: string) =>
    post<{ url: string; playlistId: string }>(`/api/sets/${id}/export/spotify`, { optionId }),
  exportUrl: (id: string, format: 'm3u8' | 'csv' | 'txt' | 'youtube' | 'rekordbox', optionId: string) =>
    `/api/sets/${id}/export/${format}?optionId=${encodeURIComponent(optionId)}`,
  setSheet: (id: string, optionId: string) =>
    http<unknown>(`/api/sets/${id}/export/setsheet?optionId=${encodeURIComponent(optionId)}`),

  // spotify auth
  spotifyStatus: () => http<SpotifyStatus>('/api/spotify/status'),
  spotifyDisconnect: () => post<{ ok: boolean }>('/api/spotify/disconnect'),

  // analyzer
  analyzerStatus: () => http<AnalyzerStatus>('/api/analyzer/status'),
  analyzerScan: (folder: string) => post<{ jobId: string }>('/api/analyzer/scan', { folder }),
  library: () => http<unknown[]>('/api/library'),
};

/** Poll a job until terminal state; onProgress fires on every tick. */
export async function awaitJob<T>(
  jobId: string,
  onProgress?: (j: Job<T>) => void,
  intervalMs = 900,
): Promise<T> {
  for (;;) {
    const j = await api.job<T>(jobId);
    onProgress?.(j);
    if (j.status === 'done') return j.result as T;
    if (j.status === 'error') throw new ApiError(500, j.error ?? 'job failed');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
