/* Template share links. The template travels in the link's #fragment as compact JSON,
   deflate-compressed and base64url-encoded, so it is never sent to a server and needs no account.
   The fragment uses only letters, digits, '-' and '_', the characters the artifact viewer passes
   through to the page. */
import { ARTIFACT_URL } from './config';
import { LIB } from './data/exercises';
import { exById } from './state';
import type { Exercise, Template, TemplateSet, Unit } from './types';

/** Wire format, version 1. Built-in exercises travel by id; custom ones carry their definition. */
type WireEx = string | [name: string, part: string, equip: string];
type WireSet = [w: number | null, r: number | null, warmup?: 1];
interface Wire { v: 1; n: string; u: Unit; i: [WireEx, WireSet[]][] }

export interface SharedItem { ex: Exercise; custom: boolean; sets: TemplateSet[] }
export interface SharedTemplate { name: string; unit: Unit; items: SharedItem[]; skipped: number }

const PREFIX = 'tpl-';
const LIMITS = { name: 60, items: 30, sets: 20, weight: 2000, reps: 1000 };

export const shareToken = (hash: string) => {
  const h = hash.replace(/^#/, '');
  return h.startsWith(PREFIX) ? h : null;
};

/** Find a share token in pasted text: a full link, a link inside a message, or the bare token. */
export const findShareToken = (text: string) => text.match(/(?:^|[#\s])(tpl-[A-Za-z0-9_-]{4,})/)?.[1] ?? null;

/* ---------- bytes ---------- */

function toB64url(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

/* ---------- encode ---------- */

export async function encodeTemplate(t: Template, unit: Unit): Promise<string> {
  const wire: Wire = {
    v: 1, n: t.name, u: t.unit ?? unit,
    i: t.items.map(it => {
      const e = exById(it.ex);
      const ex: WireEx = it.ex.startsWith('c-') ? [e.name, e.part, e.equip] : it.ex;
      return [ex, it.sets.map(s => (s.type === 'w' ? [s.w, s.r, 1] : [s.w, s.r]) as WireSet)];
    }),
  };
  const json = new TextEncoder().encode(JSON.stringify(wire));
  // 'z' marks compressed data; 'j' is the fallback for browsers without CompressionStream.
  if (typeof CompressionStream === 'function') return PREFIX + 'z' + toB64url(await pipe(json, new CompressionStream('deflate-raw')));
  return PREFIX + 'j' + toB64url(json);
}

/** Link to open this app with the template attached. */
export function shareLink(token: string) {
  const base = window.claude ? ARTIFACT_URL : location.origin + location.pathname;
  return `${base}#${token}`;
}

/* ---------- decode (input is untrusted) ---------- */

const str = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const num = (v: unknown, max: number, int = false): number | null => {
  if (typeof v !== 'number' || !isFinite(v) || v < 0) return null;
  const n = Math.min(v, max);
  return int ? Math.round(n) : Math.round(n * 100) / 100;
};

export async function decodeTemplate(token: string): Promise<SharedTemplate> {
  const body = token.slice(PREFIX.length);
  const kind = body[0], bytes = fromB64url(body.slice(1));
  let json: Uint8Array;
  if (kind === 'z') json = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (kind === 'j') json = bytes;
  else throw new Error('unknown encoding');

  const w = JSON.parse(new TextDecoder().decode(json)) as Partial<Wire>;
  if (!w || w.v !== 1 || !Array.isArray(w.i)) throw new Error('not a template');

  const items: SharedItem[] = [];
  let skipped = 0;
  for (const entry of w.i.slice(0, LIMITS.items)) {
    if (!Array.isArray(entry) || !Array.isArray(entry[1])) { skipped++; continue; }
    const [rawEx, rawSets] = entry;
    let ex: Exercise | undefined, custom = false;
    if (typeof rawEx === 'string') ex = LIB.find(e => e.id === rawEx);
    else if (Array.isArray(rawEx) && str(rawEx[0], LIMITS.name)) {
      ex = { id: '', name: str(rawEx[0], LIMITS.name), part: str(rawEx[1], 20) || 'Core', equip: str(rawEx[2], 30) };
      custom = true;
    }
    const sets: TemplateSet[] = rawSets.slice(0, LIMITS.sets).filter(Array.isArray).map(s => ({
      w: num(s[0], LIMITS.weight), r: num(s[1], LIMITS.reps, true), type: s[2] === 1 ? 'w' : '',
    }));
    // Unknown ids come from a newer app version; leave them out rather than fail the whole link.
    if (!ex || !sets.length) { skipped++; continue; }
    items.push({ ex, custom, sets });
  }
  if (!items.length) throw new Error('empty template');
  return { name: str(w.n, LIMITS.name) || 'Shared template', unit: w.u === 'lb' ? 'lb' : 'kg', items, skipped };
}
