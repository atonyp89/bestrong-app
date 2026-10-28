/* Exercise list rendering shared by the Exercises tab and the picker. */
import { PARTS } from '../data/exercises';
import { allEx } from '../state';
import { finished } from '../stats';
import type { Exercise } from '../types';
import { esc, ic } from '../util';

export function filteredEx(q: string, part: string): Exercise[] {
  q = q.trim().toLowerCase();
  return allEx()
    .filter(e => (!part || e.part === part) && (!q || e.name.toLowerCase().includes(q) || e.equip.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** With `selected`, rows toggle selection (picker); without, they open the exercise. */
export function exListHtml(list: Exercise[], selected?: string[]) {
  const counts: Record<string, number> = {};
  for (const w of finished()) for (const it of w.items) if (it.sets.some(s => s.done)) counts[it.ex] = (counts[it.ex] || 0) + 1;
  let html = '', letter = '';
  for (const e of list) {
    const L = e.name[0].toUpperCase();
    if (L !== letter) { letter = L; html += `<div class="letter">${L}</div>`; }
    const sel = !!selected && selected.includes(e.id);
    html += `<button class="exrow ${sel ? 'sel' : ''}" data-act="${selected ? 'pick-toggle' : 'ex-open'}" data-id="${e.id}">
      <span class="badge">${sel ? ic('check') : esc(e.name[0])}</span>
      <span class="meta"><div>${esc(e.name)}</div><div class="muted small">${esc(e.part)}${e.equip ? ' · ' + esc(e.equip) : ''}</div></span>
      ${counts[e.id] ? `<span class="muted small num">${counts[e.id]}×</span>` : ''}
    </button>`;
  }
  return html || `<div class="empty"><b>No match</b>Try another name, or create it as a custom exercise.</div>`;
}

export function chipsHtml(cur: string, act: string) {
  return `<div class="chips">${['', ...PARTS].map(p => `<button class="chip" data-act="${act}" data-part="${p}" aria-pressed="${cur === p}">${p || 'All'}</button>`).join('')}</div>`;
}
