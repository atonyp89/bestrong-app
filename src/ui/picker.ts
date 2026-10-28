/* Multi-select exercise picker, used by the live workout and the template editor. */
import { $, $$, ic } from '../util';
import { actions, onInput } from './actions';
import { chipsHtml, exListHtml, filteredEx } from './exlist';
import { closeSheet, openSheet, sheets } from './shell';

let pick: { sel: string[]; q: string; part: string; onDone: ((ids: string[]) => void) | null } = { sel: [], q: '', part: '', onDone: null };

export function openPicker(onDone: (ids: string[]) => void) {
  pick = { sel: [], q: '', part: '', onDone };
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>Add exercises</b></div><button class="btn primary sm" id="pickAdd" data-act="pick-done" disabled>Add</button></div>
    <div class="sheet-body" style="padding-top:12px"><div class="wrap" style="gap:12px">
      <label class="search">${ic('search')}<input id="pickSearch" type="search" placeholder="Search exercises" autocomplete="off"></label>
      <div class="row between">${chipsHtml('', 'pick-part')}</div>
      <button class="btn soft sm" data-act="ex-new-pick" style="align-self:flex-start">${ic('plus')}Create custom exercise</button>
      <div id="pickList">${exListHtml(filteredEx('', ''), pick.sel)}</div>
    </div></div>`);
}

function refreshPicker() {
  $('#pickList').innerHTML = exListHtml(filteredEx(pick.q, pick.part), pick.sel);
  const b = $<HTMLButtonElement>('#pickAdd');
  b.disabled = !pick.sel.length;
  b.textContent = pick.sel.length ? `Add (${pick.sel.length})` : 'Add';
  $$('[data-act="pick-part"]', sheets.s2).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.part === pick.part)));
}

/** Select a just-created custom exercise in the open picker. */
export function addToPick(id: string) { pick.sel.push(id); refreshPicker(); }

actions({
  'pick-toggle': el => {
    const id = el.dataset.id!, k = pick.sel.indexOf(id);
    if (k >= 0) pick.sel.splice(k, 1); else pick.sel.push(id);
    refreshPicker();
  },
  'pick-part': el => { pick.part = el.dataset.part!; refreshPicker(); },
  'pick-done': () => { const ids = pick.sel.slice(); closeSheet(sheets.s2); pick.onDone?.(ids); },
});

onInput(t => {
  if (t.id !== 'pickSearch') return false;
  pick.q = t.value;
  refreshPicker();
  return true;
});
