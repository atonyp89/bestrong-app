import { S, exById, persistLocal, unit } from '../state';
import { Cloud } from '../cloud';
import { bestSet, finished, prsFor, setLabel, setRm, volume } from '../stats';
import type { Workout } from '../types';
import { dateLabel, dur, esc, fmtNum, ic, uid } from '../util';
import { actions } from './actions';
import { renderView } from './app';
import { itemFor, newWorkout, startWorkout } from './live';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';
import { openTplEditor } from './templates';

export function viewHistory() {
  const ws = finished();
  if (!ws.length) return `<div class="wrap"><div class="topbar"><h1>History</h1></div>
    <div class="card empty"><b>No workouts logged</b>Finish a workout and it shows up here with duration, volume and personal records.<button class="btn primary" data-act="go-workout">Start a workout</button></div></div>`;
  let html = `<div class="wrap"><div class="topbar"><h1>History</h1><span class="muted small num">${ws.length} workout${ws.length > 1 ? 's' : ''}</span></div><div class="list">`;
  let month = '';
  for (const w of ws) {
    const m = new Date(w.start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (m !== month) { month = m; html += `<h2 class="month">${esc(m)}</h2>`; }
    html += histCard(w);
  }
  return html + '</div></div>';
}

function histCard(w: Workout) {
  const prs = prsFor(w);
  const items = w.items.filter(i => i.sets.some(s => s.done));
  return `<button class="card hist" data-act="hist-open" data-id="${w.id}">
    <div class="row between"><span class="title">${esc(w.name)}</span>${prs.length ? `<span class="pr">${ic('trophy')}${prs.length} PR</span>` : ''}</div>
    <div class="stats"><span>${dateLabel(w.start)}</span><span>${ic('clock')}${dur(w.end! - w.start)}</span><span>${ic('weight')}<span class="num">${fmtNum(volume(w))} ${unit()}</span></span></div>
    <div class="exlines">${items.map(it => {
      const d = it.sets.filter(s => s.done), b = bestSet(d, w.unit);
      return `<span>${d.length} × ${esc(exById(it.ex).name)}</span><span class="best num">${b ? setLabel(b, w.unit) : ''}</span>`;
    }).join('')}</div>
  </button>`;
}

function openHistory(id: string) {
  const w = S.workouts.find(x => x.id === id);
  if (!w) return;
  const prs = prsFor(w);
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('back')}</button><div class="mid"><b>${esc(w.name)}</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap">
      <div class="muted">${new Date(w.start).toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
      <div class="big"><div><b>${dur(w.end! - w.start)}</b><span>Time</span></div><div><b>${fmtNum(volume(w))}</b><span>Volume ${unit()}</span></div><div><b>${prs.length}</b><span>PRs</span></div></div>
      ${w.items.filter(i => i.sets.some(s => s.done)).map(it => `<div class="exblock">
        <div class="row between"><b>${esc(exById(it.ex).name)}</b>${prs.includes(it.ex) ? `<span class="pr">${ic('trophy')}PR</span>` : ''}</div>
        <div class="dsets">${it.sets.filter(s => s.done).map((s, i) => {
          const rm = setRm(s, w.unit);
          return `<span class="n">${s.type === 'w' ? 'W' : i + 1}</span><span>${setLabel(s, w.unit)}</span><span class="muted small">${rm ? '1RM ' + fmtNum(rm) : ''}</span>`;
        }).join('')}</div>
      </div>`).join('')}
      <div class="list">
        <button class="btn primary block" data-act="hist-repeat" data-id="${w.id}">Repeat this workout</button>
        <button class="btn soft block" data-act="hist-tpl" data-id="${w.id}">Save as routine</button>
        <button class="btn danger block" data-act="hist-del" data-id="${w.id}">${ic('trash')}Delete workout</button>
      </div>
    </div></div>`);
}

const byId = (id?: string) => S.workouts.find(x => x.id === id);

actions({
  'hist-open': el => openHistory(el.dataset.id!),
  'hist-repeat': el => {
    const h = byId(el.dataset.id);
    if (!h) return;
    closeSheet(sheets.s2);
    startWorkout(newWorkout(h.name, h.items.map(i => itemFor(i.ex, i.sets.length))));
  },
  'hist-tpl': el => {
    const h = byId(el.dataset.id);
    if (!h) return;
    closeSheet(sheets.s2);
    const items = h.items.map(i => ({ ex: i.ex, sets: i.sets.map(s => ({ w: s.w, r: s.r, type: s.type })) }));
    setTimeout(() => openTplEditor({ id: 't-' + uid(), name: h.name, items, unit: h.unit }), 200);
  },
  'hist-del': el => {
    const id = el.dataset.id!;
    ask('Delete workout?', 'This removes it from your history and records.', 'Delete', () => {
      S.workouts = S.workouts.filter(x => x.id !== id);
      S.deleted.push('w-' + id);
      persistLocal();
      Cloud.queue(`w-${id}`);
      closeSheet(sheets.s2);
      renderView();
      toast('Workout deleted');
    });
  },
});
