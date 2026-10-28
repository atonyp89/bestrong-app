export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** querySelector for elements the markup guarantees exist. */
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
export const ic = (name: string, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;

export const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });
export const toNum = (v: unknown): number | null => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
/** Estimated one-rep max (Epley). */
export const e1rm = (w: number, r: number) => (w > 0 && r > 0) ? (r === 1 ? w : w * (1 + r / 30)) : 0;

export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
}
export function dur(ms: number) { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; }
export function dateLabel(ts: number) { return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
export function defaultName(ts = Date.now()) {
  const h = new Date(ts).getHours();
  return h < 11 ? 'Morning Workout' : h < 16 ? 'Afternoon Workout' : 'Evening Workout';
}
