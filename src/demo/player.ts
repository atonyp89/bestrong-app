import { $, esc } from '../util';
import { drawFront, drawSide, lerpPose } from './draw';
import { demoFor } from './patterns';

/** Demo card markup for an exercise, or '' when it has no demo (custom exercises). */
export function demoHtml(exId: string) {
  const P = demoFor(exId);
  if (!P) return '';
  return `<div class="card demo">
    <div class="stage" data-act="demo-toggle" role="button" tabindex="0" aria-label="Pause or play the demo">
      <svg id="demoSvg" viewBox="0 0 160 120" role="img" aria-label="Animated demonstration of the movement"></svg>
      <span class="state" id="demoState"></span>
    </div>
    <div class="muscles">Works <b>${esc(P.muscles)}</b></div>
    <ol>${P.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
    ${P.note ? `<div class="muted small">${esc(P.note)}</div>` : ''}
  </div>`;
}

const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

let demo: { phase: number; last: number; paused: boolean; raf: number } | null = null;

/** Animate the demo rendered by demoHtml. Stops by itself once `sheet` closes or is re-rendered. */
export function startDemo(exId: string, sheet: HTMLElement) {
  if (demo) cancelAnimationFrame(demo.raf);
  const P = demoFor(exId), svg = $<SVGSVGElement>('#demoSvg');
  if (!P || !svg) { demo = null; return; }
  const draw = P.view === 'front' ? drawFront : drawSide;
  const b = { ...P.a, ...P.b };
  const d = demo = { phase: 0, last: performance.now(), paused: reduceMotion, raf: 0 };
  const frame = (now: number) => {
    if (demo !== d || !svg.isConnected || !sheet.classList.contains('open')) { if (demo === d) demo = null; return; }
    const dt = Math.min(100, now - d.last);
    d.last = now;
    if (!d.paused) d.phase = (d.phase + dt / (P.dur || 2600)) % 1;
    svg.innerHTML = draw(P, lerpPose(P.a, b, 0.5 - 0.5 * Math.cos(2 * Math.PI * d.phase)));
    d.raf = requestAnimationFrame(frame);
  };
  renderState();
  svg.innerHTML = draw(P, P.a);
  // The sheet opens on the next frame, so wait a beat before the open check runs.
  setTimeout(() => { if (demo === d) d.raf = requestAnimationFrame(frame); }, 50);
}

function renderState() {
  const el = $('#demoState');
  if (el && demo) el.textContent = demo.paused ? 'Tap to play' : '';
}

export function toggleDemo() {
  if (!demo) return;
  demo.paused = !demo.paused;
  renderState();
}
