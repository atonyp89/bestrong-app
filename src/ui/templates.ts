import { S, exById, touch } from '../state';
import { bestSet, lastPerformance, setLabel } from '../stats';
import type { Template } from '../types';
import { $, esc, ic, uid } from '../util';
import { actions } from './actions';
import { renderView } from './app';
import { itemFor, newWorkout, startWorkout } from './live';
import { openPicker } from './picker';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';

let draft: Template | null = null;

function openTemplate(id: string) {
  const t = S.templates.list.find(x => x.id === id);
  if (!t) return;
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>${esc(t.name)}</b></div><button class="btn plain sm" data-act="tpl-edit" data-id="${t.id}">Edit</button></div>
    <div class="sheet-body"><div class="wrap">
      ${t.sample ? '<div class="muted small">Example template. Edit it to make it yours, or delete it.</div>' : ''}
      <div>${t.items.map(i => {
        const last = lastPerformance(i.ex), b = last && bestSet(last.sets, last.w.unit);
        return `<div class="tplitem"><span class="nm">${i.sets} × ${esc(exById(i.ex).name)}</span><span class="muted small num">${b && last ? 'Last ' + setLabel(b, last.w.unit) : ''}</span></div>`;
      }).join('')}</div>
      <button class="btn primary block" data-act="tpl-start" data-id="${t.id}">Start workout</button>
    </div></div>`);
}

export function openTplEditor(t: Template | null) {
  draft = t ? structuredClone(t) : { id: 't-' + uid(), name: '', items: [] };
  renderTplEditor();
  requestAnimationFrame(() => sheets.s2.classList.add('open'));
}

function renderTplEditor() {
  const d = draft!;
  const isNew = !S.templates.list.some(x => x.id === d.id);
  sheets.s2.innerHTML = `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>${isNew ? 'New template' : 'Edit template'}</b></div><button class="btn primary sm" data-act="tpl-save">Save</button></div>
    <div class="sheet-body"><div class="wrap">
      <div class="field"><label for="tplName">Name</label><input class="text" id="tplName" value="${esc(d.name)}" placeholder="e.g. Upper A" autocomplete="off"></div>
      <div>${d.items.map((i, k) => `<div class="tplitem"><span class="nm">${esc(exById(i.ex).name)}</span>
        <span class="stepper"><button data-act="tpl-sets" data-k="${k}" data-d="-1" aria-label="Fewer sets">−</button><span class="num">${i.sets} sets</span><button data-act="tpl-sets" data-k="${k}" data-d="1" aria-label="More sets">+</button></span>
        <button class="del" data-act="tpl-rm" data-k="${k}" aria-label="Remove">${ic('x')}</button></div>`).join('') || '<div class="muted">No exercises yet.</div>'}</div>
      <button class="btn soft block" data-act="tpl-add">${ic('plus')}Add exercises</button>
      ${isNew ? '' : `<button class="btn danger block" data-act="tpl-del">${ic('trash')}Delete template</button>`}
    </div></div>`;
}

/** Keep the typed name when the editor re-renders. */
const keepName = () => { const el = $<HTMLInputElement>('#tplName'); if (el && draft) draft.name = el.value; };

function saveTemplate() {
  const d = draft!;
  d.name = $<HTMLInputElement>('#tplName').value.trim();
  if (!d.name) { $<HTMLInputElement>('#tplName').focus(); toast('Give the template a name'); return; }
  if (!d.items.length) { toast('Add at least one exercise'); return; }
  delete d.sample;
  const list = S.templates.list, k = list.findIndex(x => x.id === d.id);
  if (k >= 0) list[k] = d; else list.push(d);
  touch('templates');
  closeSheet(sheets.s2);
  renderView();
  toast('Template saved');
}

actions({
  'tpl-open': el => openTemplate(el.dataset.id!),
  'tpl-start': el => {
    const t = S.templates.list.find(x => x.id === el.dataset.id);
    if (!t) return;
    closeSheet(sheets.s2);
    startWorkout(newWorkout(t.name, t.items.map(i => itemFor(i.ex, i.sets))));
  },
  'tpl-new': () => openTplEditor(null),
  'tpl-edit': el => openTplEditor(S.templates.list.find(x => x.id === el.dataset.id) || null),
  'tpl-sets': el => {
    keepName();
    const i = draft!.items[Number(el.dataset.k)];
    i.sets = Math.max(1, Math.min(12, i.sets + Number(el.dataset.d)));
    renderTplEditor();
  },
  'tpl-rm': el => { keepName(); draft!.items.splice(Number(el.dataset.k), 1); renderTplEditor(); },
  'tpl-add': () => {
    keepName();
    openPicker(ids => {
      ids.forEach(x => draft!.items.push({ ex: x, sets: 3 }));
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
});
