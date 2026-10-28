import { LIB, SAMPLE_TEMPLATES } from './data/exercises';
import type { DocKey, Exercise, State, Template, TemplateSet, Unit, WorkoutKey } from './types';

const LS = 'ironlog.v1';

function blank(): State {
  return {
    settings: { unit: 'kg', rest: 90, t: 0 },
    custom: { list: [], t: 0 },
    templates: { list: SAMPLE_TEMPLATES, t: 0 },
    workouts: [],
    active: { w: null, t: 0 },
    deleted: [],
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const s: State = Object.assign(blank(), JSON.parse(raw));
      s.templates.list = normalizeTemplates(s.templates.list);
      return s;
    }
  } catch { /* storage unavailable */ }
  return blank();
}

/** Older templates stored a set count per exercise; expand those to blank planned sets. */
export function normalizeTemplates(list: Template[]): Template[] {
  return list.map(t => ({
    ...t,
    items: t.items.map(i => {
      const sets = i.sets as TemplateSet[] | number;
      return { ex: i.ex, sets: typeof sets === 'number' ? Array.from({ length: sets }, () => ({ w: null, r: null, type: '' as const })) : sets };
    }),
  }));
}

/** The whole app state. Mutate it in place, then call `touch` with the part that changed. */
export const S: State = load();

export function persistLocal() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch { /* storage unavailable */ }
}

let syncHook: (key: DocKey) => void = () => {};
/** Lets the sync layer hear about changes without state depending on it. */
export const setSyncHook = (fn: (key: DocKey) => void) => { syncHook = fn; };

export const isWorkoutKey = (k: string): k is WorkoutKey => k.startsWith('w-');

/** Mark a part of state changed: saves locally now, syncs to the account shortly after. */
export function touch(key: DocKey) {
  const now = Date.now();
  if (isWorkoutKey(key)) { const w = S.workouts.find(x => 'w-' + x.id === key); if (w) w.updatedAt = now; }
  else S[key].t = now;
  persistLocal();
  syncHook(key);
}

export const allEx = (): Exercise[] => LIB.concat(S.custom.list);
export const exById = (id: string): Exercise => allEx().find(e => e.id === id) || { id, name: id, part: '', equip: '' };
export const unit = (): Unit => S.settings.unit;

export function convTo(w: number | null, from: Unit, to: Unit): number | null {
  if (w == null || from === to) return w;
  return from === 'kg' ? Math.round(w * 2.20462 * 2) / 2 : Math.round(w / 2.20462 * 4) / 4;
}

/** Convert a weight entered in `from` to the current display unit. */
export const conv = (w: number | null, from: Unit) => convTo(w, from, unit());
