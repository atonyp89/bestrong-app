/* Tab routing and top-level rendering. */
import { S } from '../state';
import { $ } from '../util';
import { actions } from './actions';
import { viewExercises } from './exercises';
import { viewHistory } from './history';
import { renderLive } from './live';
import { sheets } from './shell';
import { tick } from './timer';
import { viewWorkout } from './workoutTab';

export type Tab = 'history' | 'workout' | 'exercises';
const TABS: Tab[] = ['history', 'workout', 'exercises'];

let tab: Tab = 'workout';
try { const saved = localStorage.getItem('ironlog.tab') as Tab | null; if (saved && TABS.includes(saved)) tab = saved; } catch { /* storage unavailable */ }

export const view = $('#view');

export function setTab(next: Tab) {
  tab = next;
  try { localStorage.setItem('ironlog.tab', tab); } catch { /* storage unavailable */ }
  renderView();
  view.scrollTop = 0;
}

export function renderView() {
  for (const t of TABS) $('#tab-' + t).setAttribute('aria-current', t === tab ? 'page' : 'false');
  view.innerHTML = tab === 'history' ? viewHistory() : tab === 'exercises' ? viewExercises() : viewWorkout();
}

export function renderResume() {
  const liveOpen = sheets.live.classList.contains('open');
  $('#resume').classList.toggle('on', !!S.active.w && !liveOpen);
  // The full rest bar shows only inside the workout; minimized, the pill carries the countdown.
  document.body.classList.toggle('live-open', liveOpen);
  tick();
}

export function renderAll() {
  renderView();
  if (sheets.live.classList.contains('open')) renderLive();
  renderResume();
}

export function installTabs() {
  document.addEventListener('click', ev => {
    const btn = (ev.target as Element).closest<HTMLElement>('[data-tab]');
    if (btn) setTab(btn.dataset.tab as Tab);
  });
}

actions({
  'go-workout': () => setTab('workout'),
});
