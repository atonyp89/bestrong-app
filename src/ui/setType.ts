/* "Set type" bottom sheet, opened by tapping a set number. Uses the shared dialog overlay. */
import { SET_TYPES } from '../sets';
import type { SetType } from '../types';
import { $, ic } from '../util';
import { actions } from './actions';

let onPick: ((t: SetType) => void) | null = null;

export function pickSetType(current: SetType, cb: (t: SetType) => void) {
  onPick = cb;
  $('#confirmBox').innerHTML = `<b>Set type</b>
    <div class="typelist" role="list">${SET_TYPES.map(t => `
      <div class="typerow ${t.key === current ? 'on' : ''}" role="listitem">
        <button class="typepick" data-act="settype-pick" data-key="${t.key}" aria-pressed="${t.key === current}">
          <span class="glyph ${t.cls}">${t.glyph}</span><span class="nm">${t.name}</span>${t.key === current ? ic('check', 'cur') : ''}
        </button>
        <button class="typehelp" data-act="settype-help" aria-label="What is a ${t.name.toLowerCase()}?" aria-expanded="false">?</button>
        <p class="muted small" hidden>${t.help}</p>
      </div>`).join('')}
    </div>
    <button class="btn plain block" data-act="settype-close">Cancel</button>`;
  $('#confirm').classList.add('on');
}

const close = () => { onPick = null; $('#confirm').classList.remove('on'); };

// Tapping the dimmed backdrop closes the sheet.
$('#confirm').addEventListener('click', ev => { if (ev.target === ev.currentTarget && onPick) close(); });

actions({
  'settype-pick': el => { const cb = onPick; close(); cb?.(el.dataset.key as SetType); },
  'settype-help': el => {
    const p = el.parentElement!.querySelector('p')!;
    p.hidden = !p.hidden;
    el.setAttribute('aria-expanded', String(!p.hidden));
  },
  'settype-close': () => close(),
});
