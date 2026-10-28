/* Sheets, toasts and the in-page confirm dialog (the artifact viewer blocks window.confirm). */
import { $, esc } from '../util';
import { actions } from './actions';

export const sheets = {
  live: $('#live'),
  s2: $('#sheet2'),
  s3: $('#sheet3'),
};

export function openSheet(el: HTMLElement, html: string) {
  el.innerHTML = html;
  requestAnimationFrame(() => el.classList.add('open'));
}
export const closeSheet = (el: HTMLElement) => el.classList.remove('open');

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

let confirmCb: (() => void) | null = null;
export function ask(title: string, body: string, okLabel: string, cb: () => void, danger = true) {
  $('#confirmBox').innerHTML = `<b>${esc(title)}</b><div class="muted">${esc(body)}</div>
    <div class="acts"><button class="btn plain" data-act="confirm-no">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" data-act="confirm-yes">${esc(okLabel)}</button></div>`;
  confirmCb = cb;
  $('#confirm').classList.add('on');
}

actions({
  'confirm-no': () => $('#confirm').classList.remove('on'),
  'confirm-yes': () => { $('#confirm').classList.remove('on'); confirmCb?.(); },
  'close2': () => closeSheet(sheets.s2),
  'close3': () => closeSheet(sheets.s3),
});
