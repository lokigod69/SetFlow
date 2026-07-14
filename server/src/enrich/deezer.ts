/**
 * Deezer public API (no auth). Two facts matter, learned the hard way:
 * - the advanced `artist:"X" track:"Y"` syntax returns 0 results these days —
 *   use a plain text query and score the hits ourselves;
 * - search hits rarely carry `bpm`; the per-track endpoint does.
 */

interface DeezerHit {
  id: number;
  title: string;
  duration?: number;
  artist?: { name?: string };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function score(hit: DeezerHit, artist: string, title: string): number {
  const ha = norm(hit.artist?.name ?? '');
  const ht = norm(hit.title);
  const a = norm(artist);
  const t = norm(title);
  let s = 0;
  if (ha === a) s += 2;
  else if (ha.includes(a) || a.includes(ha)) s += 1;
  if (ht === t) s += 2;
  else if (ht.includes(t) || t.includes(ht)) s += 1;
  return s;
}

export async function deezerLookup(
  artist: string,
  title: string,
): Promise<{ bpm: number | null; durationMs: number | null }> {
  const none = { bpm: null, durationMs: null };
  try {
    const q = new URLSearchParams({ q: `${artist} ${title}` });
    const r = await fetch(`https://api.deezer.com/search?${q}`);
    if (!r.ok) return none;
    const j = (await r.json()) as { data?: DeezerHit[] };
    const hits = (j.data ?? []).slice(0, 8);
    const best = hits
      .map((h) => ({ h, s: score(h, artist, title) }))
      .sort((x, y) => y.s - x.s)[0];
    if (!best || best.s < 2) return none;
    const durationMs = best.h.duration ? best.h.duration * 1000 : null;
    // bpm lives on the track endpoint, not the search hit
    const tr = await fetch(`https://api.deezer.com/track/${best.h.id}`);
    if (!tr.ok) return { bpm: null, durationMs };
    const track = (await tr.json()) as { bpm?: number; duration?: number };
    return {
      bpm: track.bpm && track.bpm > 0 ? track.bpm : null,
      durationMs: track.duration ? track.duration * 1000 : durationMs,
    };
  } catch {
    return none;
  }
}
