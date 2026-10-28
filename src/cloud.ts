/* Per-person, private sync through the artifact `db` capability. Each section and each finished
   workout is one document under data/users/<id>/, stored as JSON with a last-modified time. */
import { S, isWorkoutKey, persistLocal, setSyncHook } from './state';
import type { DocKey, SectionKey, State } from './types';

interface DocSnap { id: string; data(): Record<string, unknown> | undefined }
interface DocRef { set(data: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
interface Collection { doc(id: string): DocRef; get(): Promise<{ docs: DocSnap[] }> }
interface Db { collection(path: string): Collection }
interface User { id(): Promise<string | null> }
interface RemoteDoc { json: string; t: number }

const SECTIONS: SectionKey[] = ['settings', 'custom', 'templates', 'active'];

export const Cloud = {
  col: null as Collection | null,
  dirty: new Set<DocKey>(),
  timer: 0 as ReturnType<typeof setTimeout> | 0,
  state: 'local' as 'local' | 'ok',

  async init(onMerged: () => void) {
    try {
      const claude = window.claude;
      if (!claude?.use) return;
      const [user, db] = await Promise.all([claude.use('user') as Promise<User | null>, claude.use('db') as Promise<Db | null>]);
      if (!user || !db) return;
      const id = await user.id();
      if (!id) return;
      this.col = db.collection('data/users/' + id);
      const snap = await this.col.get();
      this.merge(snap.docs);
      this.state = 'ok';
      onMerged();
    } catch { this.col = null; }
  },

  merge(docs: DocSnap[]) {
    const remote = new Map(docs.map(d => [d.id, d.data() as unknown as RemoteDoc]));
    for (const key of SECTIONS) {
      const r = remote.get(key);
      if (r && r.t > (S[key].t || 0)) {
        try { (S as unknown as Record<SectionKey, unknown>)[key] = { ...JSON.parse(r.json), t: r.t } as State[typeof key]; } catch { /* bad doc */ }
      } else if (S[key].t) this.dirty.add(key);
    }
    const local = new Map(S.workouts.map(w => ['w-' + w.id, w]));
    for (const [id, r] of remote) {
      if (!isWorkoutKey(id) || S.deleted.includes(id)) continue;
      const l = local.get(id);
      if (!l || r.t > (l.updatedAt || 0)) {
        try { const w = JSON.parse(r.json); w.updatedAt = r.t; if (l) Object.assign(l, w); else S.workouts.push(w); } catch { /* bad doc */ }
      }
    }
    for (const [id, l] of local) { const r = remote.get(id); if (!r || (l.updatedAt || 0) > r.t) this.dirty.add(id as DocKey); }
    for (const id of S.deleted) this.dirty.add(id as DocKey);
    S.workouts.sort((a, b) => b.start - a.start);
    persistLocal();
    this.flushSoon();
  },

  queue(key: DocKey) { this.dirty.add(key); this.flushSoon(); },
  flushSoon() { clearTimeout(this.timer || undefined); this.timer = setTimeout(() => this.flush(), 1200); },

  async flush() {
    if (!this.col) return;
    const keys = [...this.dirty];
    this.dirty.clear();
    for (const key of keys) {
      try {
        const ref = this.col.doc(key);
        if (S.deleted.includes(key)) { await ref.delete(); S.deleted = S.deleted.filter(k => k !== key); persistLocal(); continue; }
        let val: unknown, t: number;
        if (isWorkoutKey(key)) {
          const w = S.workouts.find(x => 'w-' + x.id === key);
          if (!w) continue;
          val = w; t = w.updatedAt || Date.now();
        } else { val = S[key]; t = S[key].t || Date.now(); }
        await ref.set({ json: JSON.stringify(val), t });
      } catch { this.dirty.add(key); }
    }
    if (this.dirty.size) this.timer = setTimeout(() => this.flush(), 8000);
  },
};

setSyncHook(key => Cloud.queue(key));
window.addEventListener('pagehide', () => { void Cloud.flush(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) void Cloud.flush(); });
