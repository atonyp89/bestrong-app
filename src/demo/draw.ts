import type { Item, Pattern, Pose, Pt } from './patterns';

const D2R = Math.PI / 180;
const dirv = (a: number): Pt => [Math.sin(a * D2R), Math.cos(a * D2R)];
const addv = (p: Pt, v: Pt, s = 1): Pt => [p[0] + v[0] * s, p[1] + v[1] * s];
const unitv = (p: Pt, q: Pt): Pt => { const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };

/** Two-bone IK from root a toward target t; bend picks which side the middle joint falls on. */
function ik(a: Pt, t: Pt, l1: number, l2: number, bend: number): [Pt, Pt] {
  const dx = t[0] - a[0], dy = t[1] - a[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const ux = dx / d, uy = dy / d;
  if (d >= l1 + l2) { const j: Pt = [a[0] + ux * l1, a[1] + uy * l1]; return [j, [j[0] + ux * l2, j[1] + uy * l2]]; }
  d = Math.max(d, Math.abs(l1 - l2) + 0.5);
  const x = (d * d + l1 * l1 - l2 * l2) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  return [[a[0] + ux * x - uy * h * bend, a[1] + uy * x + ux * h * bend], t];
}

export function lerpPose(a: Pose, b: Pose, u: number): Pose {
  const out: Record<string, unknown> = {};
  const A = a as Record<string, number | Pt | undefined>, B = b as Record<string, number | Pt | undefined>;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = A[k] ?? B[k], vb = B[k] ?? A[k];
    out[k] = Array.isArray(va) ? va.map((v, i) => v + ((vb as Pt)[i] - v) * u)
      : typeof va === 'number' ? va + ((vb as number) - va) * u : va;
  }
  return out as Pose;
}

const f1 = (n: number) => n.toFixed(1);
const ln = (p: Pt, q: Pt, w: number, c: string, extra = '') =>
  `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const FG = 'var(--fg)', FAR = 'var(--muted)', ACC = 'var(--accent)';

function drawProps(P: Pattern) {
  let s = P.noFloor ? '' : ln([0, 112], [160, 112], 2, 'var(--line)');
  for (const p of P.props || []) {
    s += p[0] === 'l' ? ln([p[1], p[2]], [p[3], p[4]], p[5], 'var(--muted)', 'opacity=".45"')
      : `<circle cx="${p[1]}" cy="${p[2]}" r="${p[3]}" fill="var(--muted)" opacity=".45"/>`;
  }
  return s;
}

function drawItem(item: Item | undefined, h: Pt) {
  switch (item) {
    case 'bar': return `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="10" fill="var(--surface)" stroke="${ACC}" stroke-width="3"/><circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="2" fill="${ACC}"/>`;
    case 'db': return `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="4.5" fill="${ACC}"/>`;
    case 'handle': return `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="2.8" fill="${ACC}"/>`;
    case 'latbar': return ln([h[0] - 14, h[1] + 1], [h[0] + 14, h[1] + 1], 3, ACC);
    case 'wheel': return `<circle cx="${f1(h[0])}" cy="${f1(h[1] + 4)}" r="5.5" fill="var(--surface)" stroke="${ACC}" stroke-width="3"/>`;
    case 'plate': return `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="7" fill="var(--surface)" stroke="${ACC}" stroke-width="3"/>`;
    default: return '';
  }
}

export function drawSide(P: Pattern, k: Pose) {
  const hip = k.hip!;
  const sh = k.sh || addv(hip, dirv(k.t!), 30 + (k.sy || 0));
  const u = unitv(hip, sh);
  const head = k.sh ? addv(sh, u, 9) : addv(hip, u, 39);
  const kb = P.kb ?? -1, eb = P.eb ?? 1;
  const leg = (f: Pt): [Pt, Pt, Pt] => {
    const [kn, an] = ik(hip, f, 22, 21, kb);
    const s = unitv(kn, an);
    return [kn, an, k.toe || addv(an, [s[1], -s[0]], 8)];
  };
  const arm = (h: Pt): [Pt, Pt] => P.straight ? [[(sh[0] + h[0]) / 2, (sh[1] + h[1]) / 2], h] : ik(sh, h, 16, 15, eb);
  const L1 = leg(k.f!), L2 = leg(k.f2 || k.f!), A1 = arm(k.h!), A2 = arm(k.h2 || k.h!);
  let s = drawProps(P);
  if (P.anchor) s += ln(P.anchor, A1[1], 1.5, ACC, 'opacity=".7"') + `<circle cx="${P.anchor[0]}" cy="${P.anchor[1]}" r="3" fill="var(--muted)"/>`;
  s += ln(hip, L2[0], 6, FAR) + ln(L2[0], L2[1], 6, FAR) + ln(L2[1], L2[2], 4.5, FAR);
  s += ln(sh, A2[0], 5.5, FAR) + ln(A2[0], A2[1], 5.5, FAR);
  s += ln(hip, sh, 10, FG) + ln(sh, addv(sh, u, 4), 6, FG) + `<circle cx="${f1(head[0])}" cy="${f1(head[1])}" r="6.5" fill="${FG}"/>`;
  s += ln(hip, L1[0], 7, FG) + ln(L1[0], L1[1], 6.5, FG) + ln(L1[1], L1[2], 4.5, FG);
  if (P.item === 'pad') s += `<circle cx="${f1(L1[1][0])}" cy="${f1(L1[1][1])}" r="4" fill="${ACC}"/>`;
  if (P.item === 'platform') s += ln(addv(L1[1], [-7, -7]), addv(L1[1], [7, 7]), 4, ACC);
  // Plates and the wheel sit behind the near arm; small items sit on top of the hand.
  const behind = P.item === 'bar' || P.item === 'wheel';
  if (behind) s += drawItem(P.item, A1[1]);
  s += ln(sh, A1[0], 6, FG) + ln(A1[0], A1[1], 6, FG);
  if (!behind) s += drawItem(P.item, A1[1]);
  return s;
}

export function drawFront(P: Pattern, k: Pose) {
  const hy = k.hy!, lean = k.lean || 0, cx = 80 + lean, shy = hy - 28 - (k.sy || 0);
  const hipL: Pt = [74, hy], hipR: Pt = [86, hy], shL: Pt = [cx - 11, shy], shR: Pt = [cx + 11, shy];
  const eb = P.eb ?? -1;
  const hR = k.hR!, hL = k.hL || [160 - hR[0], hR[1]];
  const AR = ik(shR, hR, 16, 15, eb), AL = ik(shL, hL, 16, 15, -eb);
  let s = drawProps(P);
  if (P.anchor) {
    const aL: Pt = [160 - P.anchor[0], P.anchor[1]];
    s += ln(P.anchor, AR[1], 1.5, ACC, 'opacity=".7"') + ln(aL, AL[1], 1.5, ACC, 'opacity=".7"');
  }
  for (const sd of [-1, 1]) {
    const hp = sd < 0 ? hipL : hipR;
    if (P.legs === 'seat') {
      const kn: Pt = [80 + sd * 13, hy - 10], ft: Pt = [80 + sd * 9, hy + 3];
      s += ln(hp, kn, 7, FG) + ln(kn, ft, 6.5, FG);
    } else {
      const an: Pt = [80 + sd * 9, 109], kn: Pt = [(hp[0] + an[0]) / 2, (hp[1] + an[1]) / 2];
      s += ln(hp, kn, 7, FG) + ln(kn, an, 6.5, FG) + ln(an, [an[0] + sd * 6, 110], 4.5, FG);
    }
  }
  s += `<path d="M${f1(shL[0])} ${f1(shL[1])}L${f1(shR[0])} ${f1(shR[1])}L${f1(hipR[0])} ${hy}L${f1(hipL[0])} ${hy}Z" fill="${FG}" stroke="${FG}" stroke-width="5" stroke-linejoin="round"/>`;
  s += ln([80 + lean * 1.1, shy], [80 + lean * 1.1, hy - 38], 6, FG) + `<circle cx="${f1(80 + lean * 1.2)}" cy="${hy - 41}" r="7" fill="${FG}"/>`;
  s += ln(shR, AR[0], 6, FG) + ln(AR[0], AR[1], 6, FG) + ln(shL, AL[0], 6, FG) + ln(AL[0], AL[1], 6, FG);
  if (P.item === 'plate') s += drawItem('plate', [(AR[1][0] + AL[1][0]) / 2, (AR[1][1] + AL[1][1]) / 2]);
  else s += drawItem(P.item, AR[1]) + drawItem(P.item, AL[1]);
  return s;
}
