import { formatCamelot, parseMusicalKey } from '@setflow/shared';

type GsbSong = { title?: string; tempo?: string | number; key_of?: string; artist?: { name?: string } };

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/** Strip "(Remastered)", "[Radio Edit]", " - Live at …" suffixes — the API only matches clean titles. */
const cleanTitle = (t: string) => t.replace(/\s*[([][^)\]]*[)\]]/g, '').replace(/\s+-\s+.*$/, '').trim() || t.trim();

// Live host is api.getsong.co (api.getsongbpm.com sits behind Cloudflare and 403s scripted calls).
// The documented `type=both` lookup returns {"error":"Bad query."} in practice, so: search by title
// only, then match the artist ourselves — exact first, then substring. No artist match → no data;
// a wrong track's BPM/key is worse than none.
export async function getSongBpmLookup(artist: string, title: string, key: string): Promise<{ bpm: number | null; key: string | null }> {
  const none = { bpm: null, key: null };
  let j: { search?: GsbSong[] | { error?: string } };
  try {
    const u = new URL('https://api.getsong.co/search/');
    u.search = new URLSearchParams({ type: 'song', lookup: cleanTitle(title), limit: '30' }).toString();
    const r = await fetch(u, { headers: { 'X-API-KEY': key }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return none;
    j = (await r.json()) as { search?: GsbSong[] | { error?: string } };
  } catch {
    return none; // network stall, or a 200 with a non-JSON (Cloudflare interstitial) body — degrade, never fail the set
  }
  if (!Array.isArray(j.search)) return none; // no-result shape: {search:{error:"no result"}}
  const want = norm(artist);
  const hit =
    j.search.find((s) => norm(s.artist?.name ?? '') === want) ??
    j.search.find((s) => { const got = norm(s.artist?.name ?? ''); return got.length > 2 && (got.includes(want) || want.includes(got)); });
  if (!hit) return { bpm: null, key: null };
  const bpm = Number(hit.tempo); // serialized as a string, e.g. "124"
  const parsed = parseMusicalKey(hit.key_of); // key_of is musical notation ("F#m"), not Camelot
  return { bpm: Number.isFinite(bpm) && bpm >= 40 && bpm <= 250 ? bpm : null, key: parsed ? formatCamelot(parsed) : null };
}
