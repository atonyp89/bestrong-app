/* Templates: preview, editor with planned sets, and the "update template?" offer after a workout. */
import { fromAbove, materialize } from '../sets';
import { S, convTo, exById, touch, unit } from '../state';
import { bestSet, lastPerformance, setLabel } from '../stats';
import type { Template, TemplateItem, TemplateSet, Unit, Workout } from '../types';
import { $, $$, esc, fmtNum, ic, toNum, uid } from '../util';
import { actions, onInput } from './actions';
import { renderView } from './app';
import { itemFromTemplate, newWorkout, startWorkout } from './live';
import { openPicker } from './picker';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';

const MAX_SETS = 20;
const blankSet = (): TemplateSet => ({ w: null, r: null, type: '' });

/** "60 × 8", "– × 8", or '' for a set with no plan. */
function planLabel(s: TemplateSet, from: Unit, to: Unit = unit()) {
  if (s.w == null && s.r == null) return '';
  const w = convTo(s.w, from, to);
  return `${w != null ? fmtNum(w) : '–'} × ${s.r ?? '–'}`;
}

/** Compress runs of equal sets: "60 × 8 (×3), 65 × 6". */
export function plansSummary(sets: TemplateSet[], from: Unit, to: Unit) {
  const labels = sets.filter(s => s.type !== 'w').map(s => planLabel(s, from, to) || '–');
  const runs: [string, number][] = [];
  for (const l of labels) { const last = runs[runs.length - 1]; if (last && last[0] === l) last[1]++; else runs.push([l, 1]); }
  return runs.map(([l, n]) => n > 1 ? `${l} (×${n})` : l).join(', ') || 'no sets';
}

/* ---------- Preview ---------- */

function openTemplate(id: string) {
  const t = S.templates.list.find(x => x.id === id);
  if (!t) return;
  const tu = t.unit ?? unit();
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>${esc(t.name)}</b></div><button class="btn plain sm" data-act="tpl-edit" data-id="${t.id}">Edit</button></div>
    <div class="sheet-body"><div class="wrap">
      ${t.sample ? '<div class="muted small">Example template. Edit it to add your weights, or delete it.</div>' : ''}
      <div>${t.items.map(i => {
        const planned = i.sets.some(s => s.w != null || s.r != null);
        let right = '';
        if (planned) right = `${plansSummary(i.sets, tu, unit())} ${unit()}`;
        else { const last = lastPerformance(i.ex), b = last && bestSet(last.sets, last.w.unit); if (b && last) right = 'Last ' + setLabel(b, last.w.unit); }
        return `<div class="tplitem"><span class="nm">${i.sets.length} × ${esc(exById(i.ex).name)}</span><span class="muted small num">${esc(right)}</span></div>`;
      }).join('')}</div>
      <div class="list">
        <button class="btn primary block" data-act="tpl-start" data-id="${t.id}">Start workout</button>
        <button class="btn soft block" data-act="tpl-share" data-id="${t.id}">${ic('share')}Share template</button>
      </div>
    </div></div>`);
}

/* ---------- Editor ---------- */

let draft: Template | null = null;

/** Edit a copy in the current display unit; it is saved back in that unit. */
export function openTplEditor(t: Template | null) {
  if (t) {
    const from = t.unit ?? unit();
    draft = { ...structuredClone(t), unit: unit(), items: t.items.map(i => ({ ex: i.ex, sets: i.sets.map(s => ({ ...s, w: convTo(s.w, from, unit()) })) })) };
  } else draft = { id: 't-' + uid(), name: '', items: [], unit: unit() };
  renderTplEditor();
  requestAnimationFrame(() => sheets.s2.classList.add('open'));
}

function setRows(it: TemplateItem, k: number) {
  let n = 0;
  return it.sets.map((s, j) => {
    if (s.type !== 'w') n++;
    const g = fromAbove(it.sets, j);
    return `<tr data-k="${k}" data-j="${j}">
      <td><button class="setno ${s.type === 'w' ? 'w' : ''}" data-act="tpl-set-type" aria-label="Toggle warm-up set">${s.type === 'w' ? 'W' : n}</button></td>
      <td><input class="cell tcell" inputmode="decimal" enterkeyhint="next" data-f="w" value="${s.w ?? ''}" placeholder="${g.w != null ? fmtNum(g.w) : ''}" aria-label="Planned weight"></td>
      <td><input class="cell tcell" inputmode="numeric" enterkeyhint="done" data-f="r" value="${s.r ?? ''}" placeholder="${g.r ?? ''}" aria-label="Planned reps"></td>
      <td><button class="del" data-act="tpl-set-del" aria-label="Remove set">${ic('x')}</button></td>
    </tr>`;
  }).join('');
}

function renderTplEditor() {
  const d = draft!;
  const isNew = !S.templates.list.some(x => x.id === d.id);
  const body = sheets.s2.querySelector('.sheet-body');
  const scroll = body ? body.scrollTop : 0;
  sheets.s2.innerHTML = `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>${isNew ? 'New template' : 'Edit template'}</b></div><button class="btn primary sm" data-act="tpl-save">Save</button></div>
    <div class="sheet-body"><div class="wrap">
      <div class="field"><label for="tplName">Name</label><input class="text" id="tplName" value="${esc(d.name)}" placeholder="e.g. Upper A" autocomplete="off"></div>
      ${d.items.length ? '<p class="muted small" style="margin:0">Weights and reps are optional. Blank fields copy the set above, or use your last session.</p>' : ''}
      ${d.items.map((it, k) => `<div class="exblock">
        <div class="exhead"><span class="name">${esc(exById(it.ex).name)}</span>
          <button class="iconbtn" data-act="tpl-rm" data-k="${k}" aria-label="Remove exercise">${ic('trash')}</button></div>
        <table class="sets"><thead><tr><th style="width:42px">Set</th><th>${unit()}</th><th>Reps</th><th style="width:30px"></th></tr></thead>
        <tbody>${setRows(it, k)}</tbody></table>
        <button class="addset" data-act="tpl-set-add" data-k="${k}">${ic('plus')} Add set</button>
      </div>`).join('') || '<div class="muted">No exercises yet.</div>'}
      <button class="btn soft block" data-act="tpl-add">${ic('plus')}Add exercises</button>
      ${isNew ? '' : `<button class="btn danger block" data-act="tpl-del">${ic('trash')}Delete template</button>`}
    </div></div>`;
  sheets.s2.querySelector('.sheet-body')!.scrollTop = scroll;
}

/** Keep the typed name when the editor re-renders. */
const keepName = () => { const el = $<HTMLInputElement>('#tplName'); if (el && draft) draft.name = el.value; };

function rowOf(el: Element) {
  const tr = el.closest<HTMLTableRowElement>('tr[data-k]')!;
  const it = draft!.items[Number(tr.dataset.k)];
  return { tr, it, j: Number(tr.dataset.j) };
}

function saveTemplate() {
  const d = draft!;
  d.name = $<HTMLInputElement>('#tplName').value.trim();
  if (!d.name) { $<HTMLInputElement>('#tplName').focus(); toast('Give the template a name'); return; }
  if (!d.items.length) { toast('Add at least one exercise'); return; }
  delete d.sample;
  d.items = materialize(d.items);
  d.unit = unit();
  const list = S.templates.list, k = list.findIndex(x => x.id === d.id);
  if (k >= 0) list[k] = d; else list.push(d);
  touch('templates');
  closeSheet(sheets.s2);
  renderView();
  toast('Template saved');
}

/* ---------- Update after a workout ---------- */

/** The template a finished workout would save: its completed sets, in order. */
const planFromWorkout = (w: Workout): TemplateItem[] =>
  w.items.filter(i => i.sets.some(s => s.done)).map(i => ({ ex: i.ex, sets: i.sets.filter(s => s.done).map(s => ({ w: s.w, r: s.r, type: s.type })) }));

const sameSet = (a: TemplateSet, b: TemplateSet) =>
  a.type === b.type && a.r === b.r && (a.w == null ? b.w == null : b.w != null && Math.abs(a.w - b.w) < 0.01);

/** Human-readable changes between a template and a finished workout, in the workout's unit. */
function templateChanges(t: Template, w: Workout): string[] {
  const next = planFromWorkout(w), tu = t.unit ?? w.unit, name = (id: string) => exById(id).name;
  const oldIds = t.items.map(i => i.ex), newIds = next.map(i => i.ex);
  const lines: string[] = [];
  for (const i of next) if (!oldIds.includes(i.ex)) lines.push(`Add ${name(i.ex)}`);
  for (const i of t.items) if (!newIds.includes(i.ex)) lines.push(`Remove ${name(i.ex)}`);
  for (const ni of next) {
    const oi = t.items.find(i => i.ex === ni.ex);
    if (!oi) continue;
    const os = oi.sets.map(s => ({ ...s, w: convTo(s.w, tu, w.unit) }));
    if (os.length === ni.sets.length && os.every((s, j) => sameSet(s, ni.sets[j]))) continue;
    const count = os.length !== ni.sets.length ? ` (${os.length} → ${ni.sets.length} sets)` : '';
    lines.push(`${name(ni.ex)}: ${plansSummary(os, w.unit, w.unit)} → ${plansSummary(ni.sets, w.unit, w.unit)}${count}`);
  }
  if (!lines.length && oldIds.join() !== newIds.join()) lines.push('New exercise order');
  return lines;
}

/** Card for the finish summary, or '' when the workout has no template or matches it. */
export function templateUpdateCard(w: Workout) {
  const t = w.templateId ? S.templates.list.find(x => x.id === w.templateId) : undefined;
  if (!t) return '';
  const lines = templateChanges(t, w);
  if (!lines.length) return '';
  const shown = lines.slice(0, 6);
  return `<div class="card tplupd" id="tplUpd">
    <b>Update “${esc(t.name)}” template?</b>
    <ul>${shown.map(l => `<li>${esc(l)}</li>`).join('')}${lines.length > shown.length ? `<li>and ${lines.length - shown.length} more</li>` : ''}</ul>
    <div class="row"><button class="btn primary sm" data-act="tpl-update" data-id="${w.id}">Update template</button><button class="btn plain sm" data-act="tpl-keep">Keep original</button></div>
  </div>`;
}

/* ---------- Actions ---------- */

actions({
  'tpl-open': el => openTemplate(el.dataset.id!),
  'tpl-start': el => {
    const t = S.templates.list.find(x => x.id === el.dataset.id);
    if (!t) return;
    closeSheet(sheets.s2);
    startWorkout(newWorkout(t.name, t.items.map(i => itemFromTemplate(i, t.unit)), t.id));
  },
  'tpl-new': () => openTplEditor(null),
  'tpl-edit': el => openTplEditor(S.templates.list.find(x => x.id === el.dataset.id) || null),
  'tpl-rm': el => { keepName(); draft!.items.splice(Number(el.dataset.k), 1); renderTplEditor(); },
  'tpl-set-add': el => {
    keepName();
    const it = draft!.items[Number(el.dataset.k)];
    if (it.sets.length >= MAX_SETS) { toast(`Up to ${MAX_SETS} sets per exercise`); return; }
    it.sets.push(blankSet());
    renderTplEditor();
  },
  'tpl-set-del': el => {
    keepName();
    const { it, j } = rowOf(el);
    if (it.sets.length <= 1) { toast('Keep at least one set, or remove the exercise'); return; }
    it.sets.splice(j, 1);
    renderTplEditor();
  },
  'tpl-set-type': el => { keepName(); const { it, j } = rowOf(el); it.sets[j].type = it.sets[j].type === 'w' ? '' : 'w'; renderTplEditor(); },
  'tpl-add': () => {
    keepName();
    openPicker(ids => {
      ids.forEach(x => draft!.items.push({ ex: x, sets: [blankSet(), blankSet(), blankSet()] }));
      renderTplEditor();
      requestAnimationFrame(() => sheets.s2.classList.add('open'));
    });
  },
  'tpl-save': () => saveTemplate(),
  'tpl-del': () => {
    const d = draft!;
    ask('Delete template?', `“${d.name}” will be removed. Logged workouts stay.`, 'Delete', () => {
      S.templates.list = S.templates.list.filter(x => x.id !== d.id);
      touch('templates');
      closeSheet(sheets.s2);
      renderView();
      toast('Template deleted');
    });
  },
  'tpl-update': el => {
    const w = S.workouts.find(x => x.id === el.dataset.id);
    const t = w?.templateId ? S.templates.list.find(x => x.id === w.templateId) : undefined;
    if (!w || !t) return;
    t.items = planFromWorkout(w);
    t.unit = w.unit;
    delete t.sample;
    touch('templates');
    renderView();
    $('#tplUpd').outerHTML = `<div class="muted small">“${esc(t.name)}” now matches this workout.</div>`;
    toast('Template updated');
  },
  'tpl-keep': () => $('#tplUpd')?.remove(),
});

/* Typing a planned value updates the draft and the placeholders below, without re-rendering. */
onInput(t => {
  if (!t.classList.contains('tcell') || !draft) return false;
  const { tr, it, j } = rowOf(t);
  const n = toNum(t.value);
  if (t.dataset.f === 'r') it.sets[j].r = n != null ? Math.round(n) : null;
  else it.sets[j].w = n;
  $$<HTMLTableRowElement>('tr[data-j]', tr.closest('tbody')!).forEach(row => {
    const g = fromAbove(it.sets, Number(row.dataset.j));
    $<HTMLInputElement>('[data-f="w"]', row).placeholder = g.w != null ? fmtNum(g.w) : '';
    $<HTMLInputElement>('[data-f="r"]', row).placeholder = g.r != null ? String(g.r) : '';
  });
  return true;
});
