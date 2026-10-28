import { Cloud } from '../cloud';
import { S, normalizeTemplates, touch, unit } from '../state';
import type { State, Unit, Workout } from '../types';
import { $, clock, ic } from '../util';
import { actions } from './actions';
import { renderAll, renderView } from './app';
import { renderLive } from './live';
import { ask, closeSheet, openSheet, sheets, toast } from './shell';

const restLabel = () => S.settings.rest ? clock(S.settings.rest * 1000) : 'Off';

function openSettings() {
  openSheet(sheets.s2, `
    <div class="sheet-head"><button class="iconbtn" data-act="close2" aria-label="Close">${ic('x')}</button><div class="mid"><b>Settings</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap" style="gap:4px">
      <div class="setting"><span>Weight unit</span><span class="seg">${(['kg', 'lb'] as Unit[]).map(u => `<button data-act="unit" data-u="${u}" aria-pressed="${unit() === u}">${u}</button>`).join('')}</span></div>
      <div class="setting"><span>Rest timer</span><span class="stepper"><button data-act="rest-def" data-d="-15" aria-label="Shorter rest">−</button><span class="num" id="restDef">${restLabel()}</span><button data-act="rest-def" data-d="15" aria-label="Longer rest">+</button></span></div>
      <div class="setting"><span class="sync ${Cloud.state === 'ok' ? 'ok' : ''}"><i></i>${Cloud.state === 'ok' ? 'Saved to your account' : 'Saved in this browser only'}</span></div>
      <div style="height:16px"></div>
      <h2>Backup</h2>
      <p class="muted small" style="margin:4px 0 8px">Copy your full log as text, or paste a backup to restore it.</p>
      <div class="row"><button class="btn plain sm" data-act="backup-copy">Copy backup</button><button class="btn plain sm" data-act="backup-load">Restore from text</button></div>
      <textarea class="text" id="backupText" placeholder="Paste a backup here, then tap Restore from text" style="margin-top:10px"></textarea>
    </div></div>`);
}

interface Backup { ironlog: 1; settings: State['settings']; custom: State['custom']; templates: State['templates']; workouts: Workout[] }

function restore(d: Backup) {
  S.settings = d.settings;
  S.custom = d.custom;
  S.templates = { ...d.templates, list: normalizeTemplates(d.templates.list) };
  S.deleted.push(...S.workouts.filter(o => !d.workouts.some(x => x.id === o.id)).map(o => 'w-' + o.id));
  S.workouts = d.workouts;
  touch('settings'); touch('custom'); touch('templates');
  S.workouts.forEach(x => touch(`w-${x.id}`));
  S.deleted.forEach(k => Cloud.queue(k as `w-${string}`));
  closeSheet(sheets.s2);
  renderAll();
  toast('Backup restored');
}

actions({
  'settings': () => openSettings(),
  'unit': el => {
    S.settings.unit = el.dataset.u as Unit;
    touch('settings');
    openSettings();
    renderView();
    if (S.active.w) renderLive();
  },
  'rest-def': el => {
    S.settings.rest = Math.max(0, Math.min(600, S.settings.rest + Number(el.dataset.d)));
    touch('settings');
    $('#restDef').textContent = restLabel();
  },
  'backup-copy': () => {
    const txt = JSON.stringify({ ironlog: 1, settings: S.settings, custom: S.custom, templates: S.templates, workouts: S.workouts });
    const ta = $<HTMLTextAreaElement>('#backupText');
    // Call writeText inside the click handler; some app views refuse it, so fall back to selecting the text.
    Promise.resolve().then(() => navigator.clipboard.writeText(txt)).then(() => toast('Backup copied'))
      .catch(() => { ta.value = txt; ta.select(); toast('Select all and copy the text below'); });
  },
  'backup-load': () => {
    let d: Backup;
    try {
      d = JSON.parse($<HTMLTextAreaElement>('#backupText').value);
      if (!d || d.ironlog !== 1 || !Array.isArray(d.workouts)) throw new Error('not a backup');
    } catch { toast('That text is not an Ironlog backup'); return; }
    ask('Restore backup?', `This replaces your log with ${d.workouts.length} workouts from the backup.`, 'Restore', () => restore(d), false);
  },
});
