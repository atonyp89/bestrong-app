/* Queries over finished workouts: previous sets, volume, best sets and personal records. */
import { S, conv, unit } from './state';
import type { SetEntry, Unit, Workout, WorkoutItem } from './types';
import { e1rm, fmtNum } from './util';

export const finished = () => S.workouts.filter(w => w.end).sort((a, b) => b.start - a.start);
/** Completed sets that count toward volume and records (warm-ups excluded). */
export const workSets = (it: WorkoutItem) => it.sets.filter(s => s.done && s.type !== 'w');

export function lastPerformance(exId: string, beforeTs = Infinity): { w: Workout; sets: SetEntry[] } | null {
  for (const w of finished()) {
    if (w.start >= beforeTs) continue;
    const it = w.items.find(i => i.ex === exId);
    if (it && it.sets.some(s => s.done)) return { w, sets: it.sets.filter(s => s.done) };
  }
  return null;
}

export function volume(w: Workout) {
  let v = 0;
  for (const it of w.items) for (const s of workSets(it)) v += (conv(s.w || 0, w.unit) ?? 0) * (s.r || 0);
  return v;
}

export const setRm = (s: SetEntry, wUnit: Unit) => e1rm(conv(s.w || 0, wUnit) ?? 0, s.r || 0);

export function bestSet(sets: SetEntry[], wUnit: Unit): SetEntry | null {
  let best: SetEntry | null = null, score = -1;
  for (const s of sets) { const sc = setRm(s, wUnit) || (s.r || 0) / 1000; if (sc > score) { score = sc; best = s; } }
  return best;
}

export function setLabel(s: SetEntry, wUnit: Unit) {
  const w = conv(s.w, wUnit);
  return (w ? `${fmtNum(w)} ${unit()} × ` : '') + `${s.r || 0}`;
}

/** Exercises in `w` whose best estimated 1RM beats every earlier workout. */
export function prsFor(w: Workout): string[] {
  const out: string[] = [];
  for (const it of w.items) {
    const sets = workSets(it);
    if (!sets.length) continue;
    const mine = Math.max(...sets.map(s => setRm(s, w.unit)));
    if (!mine) continue;
    let prior = 0, had = false;
    for (const o of finished()) {
      if (o.start >= w.start) continue;
      const oi = o.items.find(i => i.ex === it.ex);
      if (!oi) continue;
      for (const s of workSets(oi)) { had = true; prior = Math.max(prior, setRm(s, o.unit)); }
    }
    if (had && mine > prior + 0.01) out.push(it.ex);
  }
  return out;
}
