/* Carry-down rules shared by the live workout and the template editor. */
import type { TemplateItem, TemplateSet } from './types';

type Carry = { w: number | null; r: number | null; type: '' | 'w' };

/** Per field, the value of the nearest set above of the same kind (working or warm-up). */
export function fromAbove(sets: Carry[], si: number): { w: number | null; r: number | null } {
  let w: number | null = null, r: number | null = null;
  for (let j = si - 1; j >= 0 && (w == null || r == null); j--) {
    const a = sets[j];
    if (a.type !== sets[si].type) continue;
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
