/* Share a template as a link, and open a shared link to preview and save the template. */
import { decodeTemplate, encodeTemplate, findShareToken, shareLink, shareToken, type SharedTemplate } from '../share';
import { S, touch, unit } from '../state';
import type { Exercise } from '../types';
import { $, esc, ic, uid } from '../util';
import { actions, onInput } from './actions';
import { renderView, setTab } from './app';
import { closeSheet, openSheet, sheets, toast } from './shell';
import { plansSummary } from './templates';

let link = '';
/** In the artifact viewer the share menu is refused, so offer it only in a normal browser. */
const canNativeShare = () => !window.claude && typeof navigator.share === 'function';

async function openShare(id: string) {
  const t = S.templates.list.find(x => x.id === id);
  if (!t) return;
  try { link = shareLink(await encodeTemplate(t, unit())); } catch { toast('Could not create a link for this routine'); return; }
  openSheet(sheets.s3, `
    <div class="sheet-head"><button class="iconbtn" data-act="close3" aria-label="Close">${ic('x')}</button><div class="mid"><b>Share routine</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap">
      <div><h1>${esc(t.name)}</h1><div class="muted small">${t.items.length} exercise${t.items.length === 1 ? '' : 's'}, with planned weights and reps</div></div>
      <p class="muted" style="margin:0">Send this link in any messaging app. Whoever opens it can preview the routine and save a copy. The whole routine is inside the link, so later edits on your side don't change their copy.</p>
      <div class="field"><label for="shareLink">Link</label><input class="text" id="shareLink" readonly value="${esc(link)}"></div>
      <div class="list">
        <button class="btn primary block" data-act="share-copy">Copy link</button>
        ${canNativeShare() ? '<button class="btn soft block" data-act="share-native">Share…</button>' : ''}
      </div>
      ${window.claude ? '<p class="muted small" style="margin:0">The person you send it to needs access to Ironlog to open the link.</p>' : ''}
    </div></div>`);
}

function selectLink() {
  const el = $<HTMLInputElement>('#shareLink');
  el.focus();
  el.select();
}

/* ---------- receiving ---------- */

let incoming: SharedTemplate | null = null;

/** A home-screen web app keeps its own storage, so a link opened in the browser saves there instead. */
const isStandalone = () => {
  try { return (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia('(display-mode: standalone)').matches; }
  catch { return false; }
};

/* Links can't open a home-screen web app on iOS; they always open the browser.
   Pasting the link into the app is the way in. */
function openPasteSheet() {
  openSheet(sheets.s3, `
    <div class="sheet-head"><button class="iconbtn" data-act="close3" aria-label="Close">${ic('x')}</button><div class="mid"><b>Add from link</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap">
      <p class="muted" style="margin:0">Copy a routine link someone sent you (long-press it in your messaging app and choose Copy), then paste it here.</p>
      <div class="field"><label for="importLink">Routine link</label>
        <input class="text" id="importLink" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste link"></div>
      <button class="btn primary block" data-act="import-paste">Show routine</button>
    </div></div>`);
  setTimeout(() => $<HTMLInputElement>('#importLink')?.focus(), 300);
}

async function importFromText(text: string, quiet = false) {
  const token = findShareToken(text);
  if (!token) { if (!quiet) toast('That isn’t an Ironlog routine link'); return; }
  try { openImport(await decodeTemplate(token), token); }
  catch { if (!quiet) toast('This routine link is incomplete or damaged. Ask for a new one.'); }
}

function openImport(t: SharedTemplate, token: string) {
  incoming = t;
  link = shareLink(token);
  const custom = t.items.filter(i => i.custom).length;
  openSheet(sheets.s3, `
    <div class="sheet-head"><button class="iconbtn" data-act="import-dismiss" aria-label="Close">${ic('x')}</button><div class="mid"><b>Shared routine</b></div><span style="width:44px"></span></div>
    <div class="sheet-body"><div class="wrap">
      <div><span class="tag">Someone shared this with you</span><h1>${esc(t.name)}</h1></div>
      <div>${t.items.map(i => {
        const plan = i.sets.some(s => s.w != null || s.r != null) ? `${plansSummary(i.sets, t.unit, unit())} ${unit()}` : '';
        return `<div class="tplitem"><span class="nm">${i.sets.length} × ${esc(i.ex.name)}${i.custom ? ' <span class="tag">Custom</span>' : ''}</span><span class="muted small num">${esc(plan)}</span></div>`;
      }).join('')}</div>
      ${custom ? `<p class="muted small" style="margin:0">Saving also adds ${custom} custom exercise${custom === 1 ? '' : 's'} to your list.</p>` : ''}
      ${t.skipped ? `<p class="muted small" style="margin:0">${t.skipped} exercise${t.skipped === 1 ? '' : 's'} could not be read and ${t.skipped === 1 ? 'was' : 'were'} left out.</p>` : ''}
      <div class="list">
        <button class="btn primary block" data-act="import-save">Save routine</button>
        <button class="btn plain block" data-act="import-dismiss">Not now</button>
      </div>
      ${isStandalone() ? '' : `<div class="card" style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
        <span class="small"><b>Use Ironlog from your home screen?</b> Links open in the browser, which keeps separate data. Copy this link, open Ironlog from your home screen, and tap <b>Add from link</b>.</span>
        <button class="btn plain sm" data-act="share-copy" style="align-self:flex-start">Copy link</button>
      </div>`}
    </div></div>`);
}

/** Custom exercises match an existing one by name, otherwise they are created. */
function resolveCustom(ex: Exercise): string {
  const found = S.custom.list.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
  if (found) return found.id;
  const created = { ...ex, id: 'c-' + uid() };
  S.custom.list.push(created);
  return created.id;
}

function uniqueName(name: string) {
  const taken = new Set(S.templates.list.map(t => t.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; ; n++) if (!taken.has(`${name} ${n}`.toLowerCase())) return `${name} ${n}`;
}

function saveIncoming() {
  const t = incoming;
  if (!t) return;
  const hadCustom = t.items.some(i => i.custom);
  const name = uniqueName(t.name);
  S.templates.list.push({
    id: 't-' + uid(), name, unit: t.unit,
    items: t.items.map(i => ({ ex: i.custom ? resolveCustom(i.ex) : i.ex.id, sets: i.sets })),
  });
  if (hadCustom) touch('custom');
  touch('templates');
  incoming = null;
  closeSheet(sheets.s3);
  setTab('workout');
  toast(`Saved “${name}” to your routines`);
}

/** Drop the token from the address so a reload doesn't offer the same template again. */
function clearHash() {
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* not allowed */ }
}

export async function handleIncomingLink() {
  const token = shareToken(location.hash);
  if (!token) return;
  clearHash();
  try { openImport(await decodeTemplate(token), token); }
  catch { toast('This routine link is incomplete or damaged. Ask for a new one.'); }
}

// Pasting a link shows the template right away; the button covers typing it in.
onInput(t => {
  if (t.id !== 'importLink') return false;
  if (findShareToken(t.value)) void importFromText(t.value, true);
  return true;
});

window.addEventListener('hashchange', () => { void handleIncomingLink(); });

actions({
  'tpl-share': el => { void openShare(el.dataset.id!); },
  'share-copy': () => {
    // writeText must run inside the click; some app views refuse it, so fall back to selecting.
    Promise.resolve().then(() => navigator.clipboard.writeText(link)).then(() => toast('Link copied'))
      .catch(() => { selectLink(); toast('Select the link and copy it'); });
  },
  'share-native': () => {
    navigator.share({ title: 'Ironlog routine', url: link }).catch(err => {
      if ((err as DOMException)?.name !== 'AbortError') { selectLink(); toast('Sharing is unavailable here. Copy the link instead.'); }
    });
  },
  'import-link': () => openPasteSheet(),
  'import-paste': () => { void importFromText($<HTMLInputElement>('#importLink').value); },
  'import-save': () => saveIncoming(),
  'import-dismiss': () => { incoming = null; closeSheet(sheets.s3); renderView(); },
});
