/* Workout clock and rest timer, both driven by one 1-second tick. */
import { S, exById } from '../state';
import { $, $$, clock } from '../util';
import { actions } from './actions';
import { toast } from './shell';

let rest: { end: number; total: number; beeped: boolean } | null = null;

export function startRest(sec: number) { rest = { end: Date.now() + sec * 1000, total: sec, beeped: false }; tick(); }
export function stopRest() { rest = null; $('#rest').classList.remove('on'); }

let audioCtx: AudioContext | null = null;
function beep() {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* unsupported */ }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.5);
  } catch { /* audio unavailable */ }
}

function renderRest() {
  const el = $('#rest');
  if (!rest) { el.classList.remove('on'); return; }
  const left = rest.end - Date.now();
  if (left <= 0) {
    if (!rest.beeped) { rest.beeped = true; beep(); toast('Rest over'); }
    stopRest();
    return;
  }
  if (!el.classList.contains('on')) {
    el.innerHTML = `<div class="bar" id="restBar"></div><div class="inner"><div class="t"><small>Rest</small><span id="restT">0:00</span></div>
      <button data-act="rest-adj" data-d="-15">−15</button><button data-act="rest-adj" data-d="15">+15</button><button data-act="rest-skip">Skip</button></div>`;
    el.classList.add('on');
  }
  $('#restT').textContent = clock(left + 999);
  $('#restBar').style.width = (100 * left / (rest.total * 1000)) + '%';
}

/** "13s", "4m 12s", "1h 05m" for the compact workout pill. */
function shortClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

/** Second line of the minimized workout pill: the rest countdown, else the exercise you're on. */
function pillSubtitle() {
  const w = S.active.w!;
  if (rest && rest.end > Date.now()) return `Rest ${clock(rest.end - Date.now() + 999)}`;
  const current = w.items.find(it => it.sets.some(s => !s.done)) ?? w.items[w.items.length - 1];
  return current ? exById(current.ex).name : 'No exercises yet';
}

export function tick() {
  const w = S.active.w;
  if (w) {
    const ms = Date.now() - w.start, t = clock(ms), short = shortClock(ms);
    $$('[data-elapsed]').forEach(e => { e.textContent = t; });
    $$('[data-elapsed-short]').forEach(e => { e.textContent = short; });
    $('#resumeSub').textContent = pillSubtitle();
  }
  renderRest();
}
setInterval(tick, 1000);

actions({
  'rest-adj': el => {
    if (!rest) return;
    rest.end += Number(el.dataset.d) * 1000;
    rest.total = Math.max(rest.total, Math.ceil((rest.end - Date.now()) / 1000));
    tick();
  },
  'rest-skip': () => stopRest(),
});
