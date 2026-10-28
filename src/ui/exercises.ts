/* Exercises tab, exercise detail (demo, records, history) and custom exercise creation. */
import { PARTS } from '../data/exercises';
import { demoHtml, startDemo, toggleDemo } from '../demo/player';
import { S, allEx, conv, exById, touch, unit } from '../state';
import { bestSet, finished, setLabel, setRm, workSets } from '../stats';
import type { SetEntry, Workout } from '../types';
import { $, $$, dateLabel, esc, fmtNum, ic, uid } from '../util';
import { actions, onInput } from './actions';
import { renderView } from './app';
import { chipsHtml, exListHtml, filteredEx } from './exlist';
import { addToPick } from './picker';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';

let exQuery = '', exPart = '';

export function viewExercises() {
  return `<div class="wrap">
    <div class="topbar"><h1>Exercises</h1><button class="btn soft sm" data-act="ex-new">${ic('plus')}New</button></div>
    <label class="search">${ic('search')}<input id="exSearch" type="search" placeholder="Search exercises" value="${esc(exQuery)}" autocomplete="off"></label>
    ${chipsHtml(exPart, 'ex-part')}
    <div id="exList">${exListHtml(filteredEx(exQuery, exPart))}</div>
  </div>`;
}

interface HistRow { w: Workout; sets: SetEntry[]; rm: number }

function openExercise(id: string) {
  const e = exById(id);
  const hist: HistRow[] = [];
  for (const w of finished().slice().reverse()) {
    const it = w.items.find(i => i.ex === id);
    if (!it) continue;
    const sets = workSets(it);
    if (!sets.length) continue;
    const b = bestSet(sets, w.unit)!;
    hist.push({ w, sets, rm: setRm(b, w.unit) });
  }
  const bestRm = Math.max(0, ...hist.map(h => h.rm));
  const heaviest = Math.max(0, ...hist.flatMap(h => h.sets.map(s => conv(s.w || 0, h.w.unit) ?? 0)));
  const bestReps = Math.max(0, ...hist.flatMap(h => h.sets.map(s => s.r || 0)));
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('back')}</button><div class="mid"><b>${esc(e.name)}</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap">
      <div class="muted">${esc(e.part)}${e.equip ? ' · ' + esc(e.equip) : ''}</div>
      ${demoHtml(id)}
      ${hist.length ? `
        <div class="big"><div><b>${bestRm ? fmtNum(bestRm) : '–'}</b><span>Est. 1RM</span></div><div><b>${heaviest ? fmtNum(heaviest) : '–'}</b><span>Top ${unit()}</span></div><div><b>${bestReps}</b><span>Most reps</span></div></div>
        ${hist.length > 1 && bestRm ? `<div class="card" style="padding:12px"><h2 style="margin-bottom:6px">Est. 1RM over time</h2>${spark(hist.map(h => h.rm))}</div>` : ''}
        <h2>History</h2>
        <div class="list">${hist.slice().reverse().map(h => `<div class="card" style="padding:12px 14px"><div class="row between"><b>${dateLabel(h.w.start)}</b><span class="muted small">${esc(h.w.name)}</span></div>
          <div class="dsets" style="margin-top:6px">${h.sets.map((s, i) => { const rm = setRm(s, h.w.unit); return `<span class="n">${i + 1}</span><span>${setLabel(s, h.w.unit)}</span><span class="muted small">${rm ? fmtNum(rm) : ''}</span>`; }).join('')}</div></div>`).join('')}</div>`
        : `<div class="card empty"><b>Not logged yet</b>Your sets, best lifts and estimated one-rep max appear here once you log this exercise.</div>`}
      ${id.startsWith('c-') ? `<button class="btn danger block" data-act="ex-del" data-id="${id}">${ic('trash')}Delete custom exercise</button>` : ''}
    </div></div>`);
  startDemo(id, sheets.s2);
}

function spark(vals: number[]) {
  const W = 320, H = 110, p = 10, min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const pts = vals.map((v, i) => [p + i * (W - 2 * p) / (vals.length - 1), H - p - (v - min) / span * (H - 2 * p - 14)]);
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Estimated one-rep max trend">
    <line x1="${p}" x2="${W - p}" y1="${H - p}" y2="${H - p}" stroke="var(--line)" stroke-width="1"/>
    <path d="${d} L ${last[0]} ${H - p} L ${p} ${H - p} Z" fill="var(--accent-soft)" stroke="none"/>
    <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(--accent)"/>
    <text x="${W - p}" y="${Math.max(12, last[1] - 8)}" text-anchor="end" font-size="12" font-weight="600" fill="var(--fg)">${fmtNum(vals[vals.length - 1])} ${unit()}</text>
  </svg>`;
}

let newExAfter: ((id: string) => void) | null = null;

function openNewExercise(after: ((id: string) => void) | null) {
  newExAfter = after;
  openSheet(sheets.s3, `
    <div class="sheet-head"><button class="iconbtn" data-act="close3" aria-label="Close">${ic('x')}</button><div class="mid"><b>New exercise</b></div><button class="btn primary sm" data-act="ex-save">Save</button></div>
    <div class="sheet-body"><div class="wrap">
      <div class="field"><label for="nxName">Name</label><input class="text" id="nxName" placeholder="e.g. Landmine Press" autocomplete="off"></div>
      <div class="field"><label>Body part</label><div class="chips" id="nxPart">${PARTS.map((p, i) => `<button class="chip" data-act="nx-part" data-part="${p}" aria-pressed="${i === 0}">${p}</button>`).join('')}</div></div>
      <div class="field"><label for="nxEquip">Equipment</label><input class="text" id="nxEquip" placeholder="Barbell, Dumbbell, Machine…" autocomplete="off"></div>
    </div></div>`);
  setTimeout(() => $<HTMLInputElement>('#nxName')?.focus(), 300);
}

function saveNewExercise() {
  const nameEl = $<HTMLInputElement>('#nxName'), name = nameEl.value.trim();
  if (!name) { nameEl.focus(); toast('Enter a name'); return; }
  if (allEx().some(e => e.name.toLowerCase() === name.toLowerCase())) { toast('That exercise already exists'); return; }
  const part = sheets.s3.querySelector<HTMLElement>('[data-act="nx-part"][aria-pressed="true"]')?.dataset.part || 'Core';
  const ex = { id: 'c-' + uid(), name, part, equip: $<HTMLInputElement>('#nxEquip').value.trim() };
  S.custom.list.push(ex);
  touch('custom');
  closeSheet(sheets.s3);
  if (newExAfter) newExAfter(ex.id); else renderView();
  toast('Exercise added');
}

actions({
  'ex-open': el => openExercise(el.dataset.id!),
  'demo-toggle': () => toggleDemo(),
  'ex-part': el => { exPart = el.dataset.part!; renderView(); },
  'ex-new': () => openNewExercise(null),
  'ex-new-pick': () => openNewExercise(addToPick),
  'nx-part': el => $$('[data-act="nx-part"]', sheets.s3).forEach(c => c.setAttribute('aria-pressed', String(c === el))),
  'ex-save': () => saveNewExercise(),
  'ex-del': el => {
    const id = el.dataset.id!;
    ask('Delete exercise?', 'It disappears from the list. Past workouts keep their sets.', 'Delete', () => {
      S.custom.list = S.custom.list.filter(e => e.id !== id);
      touch('custom');
      closeSheet(sheets.s2);
      renderView();
    });
  },
});

onInput(t => {
  if (t.id !== 'exSearch') return false;
  exQuery = t.value;
  $('#exList').innerHTML = exListHtml(filteredEx(exQuery, exPart));
  return true;
});
