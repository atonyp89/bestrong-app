/* Pull to refresh on the main tabs. A home-screen web app has no reload button, and iOS resumes
   it from memory rather than reloading, so this is how a new version gets picked up.
   Everything is saved as it changes, so a reload loses nothing but a running rest countdown. */
import { $ } from '../util';

const THRESHOLD = 70; // px of indicator travel needed to reload
const MAX = 110;
const RESISTANCE = 0.5; // indicator moves at half the finger's speed

export function installPullRefresh() {
  const view = $('#view'), ind = $('#ptr');
  let startY = -1, pull = 0;

  const render = () => {
    ind.style.setProperty('--pull', `${pull}px`);
    ind.style.setProperty('--turn', `${Math.min(1, pull / THRESHOLD) * 270}deg`);
    ind.classList.toggle('on', pull > 4);
    ind.classList.toggle('ready', pull >= THRESHOLD);
  };
  const reset = () => { startY = -1; pull = 0; ind.classList.remove('on', 'ready'); ind.style.setProperty('--pull', '0px'); };

  view.addEventListener('touchstart', e => {
    // Only from the very top of the page, with one finger.
    startY = e.touches.length === 1 && view.scrollTop <= 0 ? e.touches[0].clientY : -1;
    pull = 0;
  }, { passive: true });

  view.addEventListener('touchmove', e => {
    if (startY < 0) return;
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0 || view.scrollTop > 0) { reset(); return; }
    pull = Math.min(MAX, dy * RESISTANCE);
    render();
  }, { passive: true });

  view.addEventListener('touchend', () => {
    if (startY < 0) return;
    if (pull >= THRESHOLD) {
      ind.classList.add('loading');
      setTimeout(() => location.reload(), 120);
    } else reset();
  });
  view.addEventListener('touchcancel', reset);
}
