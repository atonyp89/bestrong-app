/* The in-progress workout sheet: set table, exercise reordering, finishing and cancelling. */
import { S, conv, exById, touch, unit } from '../state';
import { lastPerformance, prsFor, volume, workSets } from '../stats';
import type { SetEntry, Workout, WorkoutItem } from '../types';
import { $, $$, dateLabel, defaultName, dur, esc, fmtNum, ic, toNum, uid } from '../util';
import { actions, onInput } from './actions';
import { renderResume, renderView, setTab } from './app';
import { openPicker } from './picker';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';
import { startRest, stopRest, tick } from './timer';
import { wake } from './wake';

export function newWorkout(name: string, items: WorkoutItem[]): Workout {
  return { id: uid(), name: name || defaultName(), start: Date.now(), end: null, unit: unit(), items, updatedAt: Date.now() };
}

/** A fresh exercise entry, sized from last time unless `count` is given. */
export function itemFor(exId: string, count?: number): WorkoutItem {
  const last = lastPerformance(exId);
  const n = count || (last ? last.sets.length : 3);
  return { ex: exId, sets: Array.from({ length: n }, (_, i) => ({ w: null, r: null, done: false, type: last?.sets[i]?.type === 'w' ? 'w' : '' })) };
}

export function startWorkout(w: Workout) {
  if (S.active.w) { toast('Finish or cancel the current workout first'); openLive(); return; }
  S.active.w = w;
  touch('active');
  openLive();
}

export function openLive() { sheets.live.classList.add('open'); renderLive(); renderResume(); void wake(true); }
function minimizeLive() { closeSheet(sheets.live); renderResume(); renderView(); }

let openMenu = -1;

export function renderLive() {
  const w = S.active.w;
  if (!w) { closeSheet(sheets.live); return; }
  const body = sheets.live.querySelector('.sheet-body');
  const scroll = body ? body.scrollTop : 0;
  sheets.live.innerHTML = `
    <div class="sheet-head">
      <button class="iconbtn" data-act="minimize" aria-label="Minimize">${ic('down')}</button>
      <div class="mid"><span class="clock" data-elapsed>0:00</span></div>
      <button class="btn primary sm" data-act="finish">Finish</button>
    </div>
    <div class="sheet-body"><div class="wrap">
      <div><input class="wname" id="wname" value="${esc(w.name)}" aria-label="Workout name" autocomplete="off"><div class="muted small">${dateLabel(w.start)}</div></div>
      ${w.items.map((it, ii) => exBlock(it, ii, w)).join('')}
      <div class="list">
        <button class="btn soft block" data-act="add-ex">${ic('plus')}Add exercises</button>
        <button class="btn danger block" data-act="cancel-workout">Cancel workout</button>
      </div>
    </div></div>`;
  sheets.live.querySelector('.sheet-body')!.scrollTop = scroll;
  tick();
}

type Ghost = { w: string; r: string };

/** Grey placeholder values per set. Blank fields copy the nearest set above of the same kind
    (working or warm-up), so entering set 1 pre-fills the rest; otherwise last session's set. */
function ghosts(it: WorkoutItem, last: ReturnType<typeof lastPerformance>): Ghost[] {
  return it.sets.map((s, si) => {
    let w: number | null = null, r: number | null = null;
    for (let j = si - 1; j >= 0 && (w == null || r == null); j--) {
      const above = it.sets[j];
      if (above.type !== s.type) continue;
      w ??= above.w;
      r ??= above.r;
    }
    const p = last?.sets[si];
    w ??= p && last ? conv(p.w, last.w.unit) : null;
    r ??= p?.r ?? null;
    return { w: w != null ? fmtNum(w) : '', r: r != null ? String(r) : '' };
  });
}

/** Refresh placeholders in place while typing, so focus and the keyboard stay put. */
function refreshGhosts(tr: HTMLTableRowElement, it: WorkoutItem) {
  const g = ghosts(it, lastPerformance(it.ex, S.active.w!.start));
  $$<HTMLTableRowElement>('tr[data-si]', tr.closest('tbody')!).forEach(row => {
    const c = cells(row), gi = g[Number(row.dataset.si)];
    c.w.placeholder = gi.w;
    c.r.placeholder = gi.r;
  });
}

function exBlock(it: WorkoutItem, ii: number, w: Workout) {
  const e = exById(it.ex);
  const last = lastPerformance(it.ex, w.start);
  const g = ghosts(it, last);
  let n = 0;
  const rows = it.sets.map((s, si) => {
    if (s.type !== 'w') n++;
    const p = last?.sets[si];
    const pw = p && last ? conv(p.w, last.w.unit) : null;
    return `<tr class="${s.done ? 'done' : ''}" data-ii="${ii}" data-si="${si}">
      <td><button class="setno ${s.type === 'w' ? 'w' : ''}" data-act="set-type" aria-label="Toggle warm-up set">${s.type === 'w' ? 'W' : n}</button></td>
      <td class="prev">${p ? `<button data-act="set-fill" data-w="${pw ?? ''}" data-r="${p.r ?? ''}">${pw ? fmtNum(pw) + ' × ' : ''}${p.r || 0}</button>` : '<span>–</span>'}</td>
      <td><input class="cell" inputmode="decimal" enterkeyhint="next" data-f="w" value="${s.w ?? ''}" placeholder="${g[si].w}" aria-label="Weight"></td>
      <td><input class="cell" inputmode="numeric" enterkeyhint="done" data-f="r" value="${s.r ?? ''}" placeholder="${g[si].r}" aria-label="Reps"></td>
      <td><button class="chk" data-act="set-done" aria-label="Complete set">${ic('check')}</button></td>
      <td><button class="del" data-act="set-del" aria-label="Remove set">${ic('x')}</button></td>
    </tr>`;
  }).join('');
  return `<div class="exblock">
    <div class="exhead"><button class="name" data-act="ex-open" data-id="${it.ex}">${esc(e.name)}</button>
      <button class="iconbtn" data-act="ex-menu" data-ii="${ii}" aria-label="Exercise options">${ic('dots')}</button></div>
    ${openMenu === ii ? `<div class="exmenu">
      ${ii > 0 ? `<button class="btn plain sm" data-act="ex-up" data-ii="${ii}">Move up</button>` : ''}
      ${ii < w.items.length - 1 ? `<button class="btn plain sm" data-act="ex-down" data-ii="${ii}">Move down</button>` : ''}
      <button class="btn danger sm" data-act="ex-remove" data-ii="${ii}">Remove</button></div>` : ''}
    <table class="sets"><thead><tr><th style="width:42px">Set</th><th class="l">Previous</th><th>${unit()}</th><th>Reps</th><th style="width:46px"></th><th style="width:30px"></th></tr></thead>
    <tbody>${rows}</tbody></table>
    <button class="addset" data-act="set-add" data-ii="${ii}">${ic('plus')} Add set</button>
  </div>`;
}

function rowRef(el: Element): { tr: HTMLTableRowElement; it: WorkoutItem; s: SetEntry; si: number } | null {
  const tr = el.closest<HTMLTableRowElement>('tr[data-ii]');
  const w = S.active.w;
  if (!tr || !w) return null;
  const it = w.items[Number(tr.dataset.ii)], si = Number(tr.dataset.si);
  return { tr, it, s: it.sets[si], si };
}
const cells = (tr: HTMLElement) => ({ w: $<HTMLInputElement>('[data-f="w"]', tr), r: $<HTMLInputElement>('[data-f="r"]', tr) });

function finishWorkout() {
  const w = S.active.w!;
  const doneCount = w.items.reduce((a, it) => a + it.sets.filter(s => s.done).length, 0);
  if (!doneCount) { ask('No completed sets', 'Tick off at least one set to save this workout, or cancel it.', 'Cancel workout', discardWorkout); return; }
  const pending = w.items.reduce((a, it) => a + it.sets.filter(s => !s.done).length, 0);
  const commit = () => {
    w.items = w.items.map(it => ({ ...it, sets: it.sets.filter(s => s.done) })).filter(it => it.sets.length);
    w.end = Date.now();
    w.name = w.name.trim() || defaultName(w.start);
    S.workouts.unshift(w);
    S.active.w = null;
    touch(`w-${w.id}`);
    touch('active');
    stopRest();
    void wake(false);
    closeSheet(sheets.live);
    setTab('history');
    renderResume();
    showSummary(w);
  };
  if (pending) ask('Finish workout?', `${pending} unfinished set${pending > 1 ? 's' : ''} will be dropped.`, 'Finish', commit, false);
  else commit();
}

function discardWorkout() {
  S.active.w = null;
  touch('active');
  stopRest();
  void wake(false);
  closeSheet(sheets.live);
  renderView();
  renderResume();
}

function showSummary(w: Workout) {
  const prs = prsFor(w);
  openSheet(sheets.s2, `
    <div class="sheet-head"><span style="width:44px"></span><div class="mid"><b>Workout complete</b></div><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button></div>
    <div class="sheet-body"><div class="wrap">
      <h1>${esc(w.name)}</h1>
      <div class="big"><div><b>${dur(w.end! - w.start)}</b><span>Time</span></div><div><b>${fmtNum(volume(w))}</b><span>Volume ${unit()}</span></div><div><b>${w.items.reduce((a, i) => a + workSets(i).length, 0)}</b><span>Sets</span></div></div>
      ${prs.length ? `<div class="card" style="padding:14px"><span class="pr" style="font-size:14px">${ic('trophy')}New personal records</span><div style="margin-top:6px">${prs.map(id => esc(exById(id).name)).join('<br>')}</div></div>` : ''}
      <button class="btn primary block" data-act="close2">Done</button>
    </div></div>`);
}

const changed = () => { touch('active'); renderLive(); };

actions({
  'start-empty': () => startWorkout(newWorkout('', [])),
  'resume': () => openLive(),
  'minimize': () => minimizeLive(),
  'finish': () => finishWorkout(),
  'cancel-workout': () => ask('Cancel workout?', 'Everything logged in this session will be discarded.', 'Discard', discardWorkout),
  'add-ex': () => openPicker(ids => { ids.forEach(x => S.active.w!.items.push(itemFor(x))); changed(); }),
  'ex-menu': el => { const ii = Number(el.dataset.ii); openMenu = openMenu === ii ? -1 : ii; renderLive(); },
  'ex-up': el => moveItem(Number(el.dataset.ii), -1),
  'ex-down': el => moveItem(Number(el.dataset.ii), 1),
  'ex-remove': el => { S.active.w!.items.splice(Number(el.dataset.ii), 1); openMenu = -1; changed(); },
  'set-add': el => {
    const it = S.active.w!.items[Number(el.dataset.ii)], prev = it.sets[it.sets.length - 1];
    it.sets.push({ w: prev ? prev.w : null, r: prev ? prev.r : null, done: false, type: '' });
    changed();
  },
  'set-del': el => { const r = rowRef(el); if (r) { r.it.sets.splice(r.si, 1); changed(); } },
  'set-type': el => { const r = rowRef(el); if (r) { r.s.type = r.s.type === 'w' ? '' : 'w'; changed(); } },
  'set-fill': el => {
    const r = rowRef(el);
    if (!r) return;
    // Copies last session's set; the button carries its values because placeholders may differ.
    r.s.w = toNum(el.dataset.w);
    r.s.r = toNum(el.dataset.r);
    touch('active');
    renderLive();
  },
  'set-done': el => {
    const r = rowRef(el);
    if (!r) return;
    if (!r.s.done) {
      // Blank fields log last session's numbers, shown as placeholders.
      const c = cells(r.tr);
      if (r.s.w == null && c.w.placeholder) r.s.w = toNum(c.w.placeholder);
      if (r.s.r == null && c.r.placeholder) r.s.r = toNum(c.r.placeholder);
      if (!r.s.r) { c.r.focus(); toast('Enter reps first'); return; }
      r.s.done = true;
      if (S.settings.rest && r.s.type !== 'w') startRest(S.settings.rest);
      try { navigator.vibrate?.(15); } catch { /* unsupported */ }
    } else r.s.done = false;
    changed();
  },
});

function moveItem(i: number, d: number) {
  const items = S.active.w!.items, j = i + d;
  [items[i], items[j]] = [items[j], items[i]];
  openMenu = -1;
  changed();
}

onInput(t => {
  if (t.id === 'wname' && S.active.w) { S.active.w.name = t.value; touch('active'); return true; }
  if (!t.classList.contains('cell')) return false;
  const r = rowRef(t);
  if (!r) return true;
  const n = toNum(t.value);
  if (t.dataset.f === 'r') r.s.r = n != null ? Math.round(n) : null;
  else r.s.w = n;
  touch('active');
  refreshGhosts(r.tr, r.it);
  return true;
});

export function installLiveKeys() {
  // Enter on weight jumps to reps; Enter on reps completes the set.
  document.addEventListener('keydown', ev => {
    const t = ev.target as HTMLInputElement;
    if (ev.key !== 'Enter' || !t.classList?.contains('cell')) return;
    ev.preventDefault();
    const tr = t.closest('tr')!;
    if (t.dataset.f === 'w') cells(tr).r.focus();
    else { t.blur(); $('[data-act="set-done"]', tr).click(); }
  });
  // Select field contents on focus so typing replaces the value.
  document.addEventListener('focusin', ev => {
    const t = ev.target as HTMLInputElement;
    if (t.classList?.contains('cell')) setTimeout(() => t.select(), 0);
  });
}
