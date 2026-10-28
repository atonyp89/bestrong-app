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
    <div class="row between"><h2>Templates</h2><button class="btn soft sm" data-act="tpl-new">${ic('plus')}Template</button></div>
    ${tpls.length ? `<div class="tplgrid">${tpls.map(t => `
      <button class="card tpl" data-act="tpl-open" data-id="${t.id}">
        ${t.sample ? '<span class="tag">Example</span>' : ''}
        <b>${esc(t.name)}</b>
        <span class="lines">${t.items.map(i => esc(exById(i.ex).name)).join(', ')}</span>
      </button>`).join('')}</div>`
      : `<div class="card empty"><b>No templates yet</b>Save a routine you repeat, or turn a finished workout into one from History.</div>`}
  </div>`;
}
