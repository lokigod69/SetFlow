import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export class CacheDb {
  readonly db: Database.Database;
  constructor(path = resolve(process.cwd(), 'server/data/cache.db')) {
    mkdirSync(resolve(path, '..'), { recursive: true }); this.db = new Database(path); this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS track_cache (spotify_track_id TEXT PRIMARY KEY, metadata TEXT NOT NULL, fetched_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS enrichment_cache (spotify_track_id TEXT NOT NULL, source TEXT NOT NULL, bpm REAL, key TEXT, fetched_at TEXT NOT NULL, PRIMARY KEY(spotify_track_id,source));
      CREATE TABLE IF NOT EXISTS sets (id TEXT PRIMARY KEY, doc TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS search_cache (query_hash TEXT PRIMARY KEY, result TEXT NOT NULL, fetched_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS library (path TEXT PRIMARY KEY, artist TEXT, title TEXT, bpm REAL, key TEXT, duration_ms INTEGER, analyzed_at TEXT NOT NULL);`);
  }
  getJson<T>(table: 'track_cache'|'search_cache', key: string, column: 'spotify_track_id'|'query_hash'): T | null { const row = this.db.prepare(`SELECT ${table === 'track_cache' ? 'metadata' : 'result'} AS value FROM ${table} WHERE ${column}=?`).get(key) as { value?: string } | undefined; return row?.value ? JSON.parse(row.value) as T : null; }
  setTrack(id: string, metadata: unknown) { this.db.prepare('INSERT OR REPLACE INTO track_cache VALUES (?,?,?)').run(id, JSON.stringify(metadata), new Date().toISOString()); }
  enrichment(id: string, source: string) { return this.db.prepare('SELECT bpm,key FROM enrichment_cache WHERE spotify_track_id=? AND source=?').get(id, source) as { bpm:number|null; key:string|null }|undefined; }
  setEnrichment(id:string,source:string,bpm:number|null,key:string|null) { this.db.prepare('INSERT OR REPLACE INTO enrichment_cache VALUES (?,?,?,?,?)').run(id,source,bpm,key,new Date().toISOString()); }
  search(key:string) { return this.getJson<unknown>('search_cache',key,'query_hash'); }
  setSearch(key:string,result:unknown) { this.db.prepare('INSERT OR REPLACE INTO search_cache VALUES (?,?,?)').run(key,JSON.stringify(result),new Date().toISOString()); }
  set(doc: {id:string;createdAt:string;updatedAt:string}) { this.db.prepare('INSERT OR REPLACE INTO sets VALUES (?,?,?,?)').run(doc.id,JSON.stringify(doc),doc.createdAt,doc.updatedAt); }
  get<T>(id:string) { const row=this.db.prepare('SELECT doc FROM sets WHERE id=?').get(id) as {doc:string}|undefined; return row ? JSON.parse(row.doc) as T : null; }
  all<T>() { return (this.db.prepare('SELECT doc FROM sets ORDER BY updated_at DESC').all() as {doc:string}[]).map(x=>JSON.parse(x.doc) as T); }
  delete(id:string) { this.db.prepare('DELETE FROM sets WHERE id=?').run(id); }
}
export const cacheDb = new CacheDb();
