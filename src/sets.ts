/* Set types and the carry-down rules shared by the live workout and the routine editor. */
import type { SetType, TemplateItem, TemplateSet } from './types';

export interface SetTypeInfo { key: SetType; name: string; glyph: string; cls: string; help: string }

export const SET_TYPES: SetTypeInfo[] = [
  { key: 'w', name: 'Warm-up set', glyph: 'W', cls: 'w', help: 'A lighter set to get ready. Left out of volume and personal records, and no rest timer starts after it.' },
  { key: '', name: 'Normal set', glyph: '1', cls: '', help: 'A regular working set. Counts toward volume and personal records.' },
  { key: 'f', name: 'Failure set', glyph: 'F', cls: 'f', help: 'A working set taken until you can’t do another clean rep. Counts like a normal set.' },
  { key: 'd', name: 'Drop set', glyph: 'D', cls: 'd', help: 'Done straight after the set above with less weight. Counts toward volume; the rest timer is skipped.' },
];

/** The number shown for a set: normal sets are numbered among themselves, others show a letter. */
export function setGlyphs(sets: { type: SetType }[]): string[] {
  let n = 0;
  return sets.map(s => s.type === '' ? String(++n) : SET_TYPES.find(t => t.key === s.type)!.glyph);
}

/** Which sets share values when carrying down: normal and failure sets copy each other;
    warm-ups and drop sets only copy their own kind. */
export const carryGroup = (t: SetType) => t === 'f' ? '' : t;

type Carry = { w: number | null; r: number | null; type: SetType };

/** Per field, the value of the nearest set above in the same carry group. */
export function fromAbove(sets: Carry[], si: number): { w: number | null; r: number | null } {
  let w: number | null = null, r: number | null = null;
  const g = carryGroup(sets[si].type);
  for (let j = si - 1; j >= 0 && (w == null || r == null); j--) {
    const a = sets[j];
    if (carryGroup(a.type) !== g) continue;
    w ??= a.w;
    r ??= a.r;
  }
  return { w, r };
}

/** Fill blank planned fields from the sets above, so a template stores explicit targets. */
export function materialize(items: TemplateItem[]): TemplateItem[] {
  return items.map(it => {
    const sets: TemplateSet[] = [];
    for (const s of it.sets) {
      sets.push({ ...s });
      const a = fromAbove(sets, sets.length - 1), cur = sets[sets.length - 1];
      cur.w ??= a.w;
      cur.r ??= a.r;
    }
    return { ex: it.ex, sets };
  });
}

export const typeName = (t: SetType) => SET_TYPES.find(x => x.key === t)!.name.toLowerCase();
