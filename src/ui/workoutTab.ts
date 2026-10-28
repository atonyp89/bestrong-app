import { S, exById } from '../state';
import { finished } from '../stats';
import { dateLabel, esc, ic } from '../util';

export function viewWorkout() {
  const tpls = S.templates.list;
  const lastW = finished()[0];
  return `<div class="wrap">
    <div class="topbar"><h1>Start</h1><button class="iconbtn" data-act="settings" aria-label="Settings">${ic('gear')}</button></div>
    ${S.active.w
      ? `<button class="btn primary block" data-act="resume">Resume ${esc(S.active.w.name)}</button>`
      : `<button class="btn primary block" data-act="start-empty">${ic('plus')}Start an empty workout</button>`}
    ${lastW ? `<div class="muted small">Last workout: <b>${esc(lastW.name)}</b>, ${dateLabel(lastW.start)}</div>` : ''}
    <div class="row between"><h2>Routines</h2><div class="row" style="gap:8px">
      <button class="btn plain sm" data-act="import-link">Add from link</button>
      <button class="btn soft sm" data-act="tpl-new">${ic('plus')}Routine</button></div></div>
    ${tpls.length ? `<div class="tplgrid">${tpls.map(t => `
      <div class="card tpl">
        <button class="open" data-act="tpl-open" data-id="${t.id}" aria-label="${esc(t.name)}: view, edit or share">
          ${t.sample ? '<span class="tag">Example</span>' : ''}
          <b>${esc(t.name)}</b>
          <span class="lines">${t.items.map(i => esc(exById(i.ex).name)).join(', ')}</span>
        </button>
        <button class="btn primary block" data-act="tpl-start" data-id="${t.id}">Start routine</button>
      </div>`).join('')}</div>`
      : `<div class="card empty"><b>No routines yet</b>Save a workout you repeat, or turn a finished workout into one from History.</div>`}
  </div>`;
}
