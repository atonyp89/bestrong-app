/* Workout clock and rest timer, both driven by one 1-second tick. */
import { S } from '../state';
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

export function tick() {
  const w = S.active.w;
  if (w) { const t = clock(Date.now() - w.start); $$('[data-elapsed]').forEach(e => { e.textContent = t; }); }
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
