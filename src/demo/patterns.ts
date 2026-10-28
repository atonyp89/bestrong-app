/* Form demos. Each movement is two key poses (A and B) looped A→B→A. Side views face right; angles
   are degrees with 0 pointing down and 90 pointing forward. Hands and feet are targets solved with
   two-bone IK, so grips and planted feet stay put while the body moves.
   Units: 160×120 viewBox, floor at y=111. */

export type Pt = [number, number];
/** ['l', x1, y1, x2, y2, width] is a line; ['c', x, y, r] is a filled circle. */
export type Prop = ['l', number, number, number, number, number] | ['c', number, number, number];
export type Item = '' | 'bar' | 'db' | 'handle' | 'latbar' | 'wheel' | 'plate' | 'pad' | 'platform';

export interface Pose {
  /* side view */
  hip?: Pt;
  /** Torso angle, hip → shoulder. */
  t?: number;
  /** Explicit shoulder point, used instead of `t`. */
  sh?: Pt;
  /** Near and far hand targets (far defaults to near). */
  h?: Pt;
  h2?: Pt;
  /** Near and far ankle targets. */
  f?: Pt;
  f2?: Pt;
  toe?: Pt;
  /** Shoulder elevation (shrug). */
  sy?: number;
  /* front view */
  hy?: number;
  lean?: number;
  hR?: Pt;
  hL?: Pt;
}

export interface Pattern {
  view?: 'side' | 'front';
  item?: Item;
  /** Elbow and knee bend sides for the IK solve. */
  eb?: number;
  kb?: number;
  /** Draw arms straight (foreshortened) instead of solving elbows. */
  straight?: boolean;
  noFloor?: boolean;
  props?: Prop[];
  /** Cable pulley position. */
  anchor?: Pt;
  legs?: 'stand' | 'seat';
  dur?: number;
  a: Pose;
  b: Pose;
  muscles: string;
  cues: string[];
  note?: string;
}

const BAR: Prop[] = [['l', 40, 14, 124, 14, 4]];
const BENCH: Prop[] = [['l', 50, 85, 112, 85, 6], ['l', 58, 85, 58, 111, 4], ['l', 104, 85, 104, 111, 4]];
const SEAT = (x1: number, x2: number, y: number, back?: number): Prop[] =>
  ([['l', x1, y, x2, y, 6], ['l', x1 + 4, y, x1 + 4, 111, 4]] as Prop[]).concat(back ? [['l', back, y, back + 2, y - 40, 6]] : []);
const STAND: Pose = { hip: [80, 67], t: 180, f: [80, 108] };

export const PAT: Record<string, Pattern> = {
  squat: { item: 'bar', eb: -1, a: { ...STAND, h: [73, 40] }, b: { hip: [64, 92], t: 148, h: [72, 71] },
    muscles: 'Quads, glutes, adductors', cues: ['Bar on your upper back, feet about shoulder-width, toes slightly out.', 'Brace, then sit down and back until your hips reach knee height or lower.', 'Keep knees tracking over your toes and drive up through the whole foot.'] },
  frontsquat: { item: 'bar', eb: -1, a: { ...STAND, h: [86, 38] }, b: { hip: [66, 93], t: 160, h: [82, 66] },
    muscles: 'Quads, glutes, upper back', cues: ['Bar rests on the front of your shoulders, elbows high.', 'Sit straight down, keeping your torso upright.', 'Drive up, leading with the elbows.'] },
  goblet: { item: 'db', a: { ...STAND, h: [88, 46] }, b: { hip: [66, 93], t: 160, h: [84, 72] },
    muscles: 'Quads, glutes', cues: ['Hold one dumbbell against your chest, elbows pointing down.', 'Sit down between your knees with your chest up.', 'Push through your heels to stand.'] },
  deadlift: { item: 'bar', a: { hip: [64, 83], t: 118, h: [86, 99], f: [80, 108] }, b: { ...STAND, h: [81, 68] },
    muscles: 'Glutes, hamstrings, back', cues: ['Bar over mid-foot, shins close, grip just outside your legs.', 'Flatten your back and pull the slack out of the bar before it leaves the floor.', 'Push the floor away, keep the bar against your legs, and finish with hips through.'] },
  rackpull: { item: 'bar', a: { hip: [72, 74], t: 150, h: [86, 80], f: [80, 108] }, b: { ...STAND, h: [81, 68] },
    muscles: 'Upper back, glutes, grip', cues: ['Set the bar at knee height in the rack.', 'Hinge with a flat back and grip just outside your legs.', 'Stand up tall, squeezing shoulder blades and glutes at the top.'] },
  rdl: { item: 'bar', a: { ...STAND, h: [81, 68] }, b: { hip: [70, 70], t: 105, h: [90, 90] },
    muscles: 'Hamstrings, glutes', cues: ['Start standing tall with soft knees.', 'Push your hips back and slide the bar down your thighs until you feel a hamstring stretch.', 'Keep your back flat and squeeze your glutes to stand.'] },
  bench: { item: 'bar', props: BENCH, a: { hip: [100, 79], t: -90, h: [72, 48], f: [122, 108] }, b: { h: [80, 72] },
    muscles: 'Chest, front delts, triceps', cues: ['Eyes under the bar, shoulder blades pinched, feet planted.', 'Lower under control to your lower chest, elbows about 45° from your body.', 'Press up and slightly back until your arms are straight.'] },
  incline: { item: 'bar', props: [['l', 99, 85, 72, 66, 6], ['l', 96, 86, 114, 86, 6], ['l', 100, 86, 100, 111, 4]],
    a: { hip: [102, 80], t: -125, h: [84, 32], f: [124, 108] }, b: { h: [90, 56] },
    muscles: 'Upper chest, front delts', cues: ['Set the bench to 30–45°.', 'Lower to your upper chest with wrists stacked over elbows.', 'Press up over your shoulders without lifting off the pad.'] },
  fly: { item: 'db', straight: true, props: BENCH, a: { hip: [100, 79], t: -90, h: [71, 47], f: [122, 108] }, b: { h: [72, 73] },
    muscles: 'Chest', cues: ['Start with the weights over your chest, elbows slightly bent.', 'Open your arms out to the sides in a wide arc until you feel a chest stretch.', 'Hug the weights back together, keeping the elbow angle fixed.'] },
  mpress: { item: 'handle', props: SEAT(50, 80, 87, 54), a: { hip: [66, 84], t: 180, h: [80, 56], f: [90, 108] }, b: { h: [98, 54] },
    muscles: 'Chest, triceps', cues: ['Set the seat so the handles line up with mid-chest.', 'Press forward until your arms are straight.', 'Return slowly until you feel a stretch across your chest.'] },
  pushup: { a: { hip: [69, 90], t: 115, h: [96, 106], f: [28, 107] }, b: { hip: [72.6, 100], t: 98 },
    muscles: 'Chest, triceps, core', cues: ['Hands under your shoulders, body in one straight line.', 'Lower until your chest is just above the floor, elbows angled back.', 'Push the floor away without letting your hips sag.'] },
  dip: { props: [['l', 66, 58, 100, 58, 4], ['l', 96, 58, 96, 111, 4]], a: { hip: [77.4, 57], t: 175, h: [80, 58], f: [64, 94] }, b: { hip: [72.7, 73.2], t: 160, f: [60, 106] },
    muscles: 'Chest, triceps', cues: ['Start locked out on the bars, shoulders pulled down.', 'Lean slightly forward and lower until your upper arms are about level with the floor.', 'Press back up to straight arms.'] },
  row: { item: 'bar', a: { hip: [66, 72], t: 112, h: [92, 92], f: [80, 108] }, b: { h: [84, 72] },
    muscles: 'Upper back, lats', cues: ['Hinge forward with a flat back, knees soft.', 'Pull the weight to your lower ribs, driving the elbows back.', 'Pause, then lower until your arms are straight.'] },
  reardelt: { item: 'db', straight: true, a: { hip: [66, 72], t: 112, h: [94, 90], f: [80, 108] }, b: { h: [95, 64] },
    muscles: 'Rear delts, upper back', cues: ['Hinge forward with a flat back, weights hanging under your shoulders.', 'Raise the weights out to your sides, leading with the elbows.', 'Lower under control.'] },
  pullup: { noFloor: true, props: BAR, a: { hip: [79, 76], t: 178, h: [82, 15], f: [75, 114] }, b: { hip: [77, 52], f: [73, 90] },
    muscles: 'Lats, biceps', cues: ['Hang with straight arms and your shoulders engaged.', 'Pull your chest toward the bar, driving your elbows down.', 'Get your chin over the bar, then lower all the way.'] },
  legraise: { noFloor: true, props: BAR, a: { hip: [79, 76], t: 178, h: [82, 15], f: [79, 118] }, b: { f: [121, 72] },
    muscles: 'Lower abs, hip flexors', cues: ['Hang from the bar without swinging.', 'Raise straight legs to hip height or higher.', 'Lower slowly. Avoid using momentum.'] },
  pulldown: { item: 'latbar', anchor: [80, 0], props: SEAT(56, 88, 88).concat([['c', 92, 80, 4]]), a: { hip: [72, 84], t: 172, h: [80, 24], f: [98, 108] }, b: { h: [84, 50] },
    muscles: 'Lats', cues: ['Lock your thighs under the pad, grip a little wider than your shoulders.', 'Pull the bar to your upper chest, leaning back slightly.', 'Let it rise under control until your arms are straight.'] },
  cablerow: { item: 'handle', anchor: [134, 96], props: [['l', 36, 98, 72, 98, 6], ['l', 104, 88, 104, 111, 4]],
    a: { hip: [58, 92], t: 150, h: [102, 78], f: [100, 100] }, b: { t: 180, h: [76, 78] },
    muscles: 'Mid back, lats', cues: ['Sit tall with knees soft and reach forward to the handle.', 'Pull to your stomach, squeezing your shoulder blades together.', 'Return slowly, letting your shoulders stretch forward.'] },
  facepull: { item: 'handle', anchor: [140, 30], eb: -1, a: { ...STAND, t: 176, h: [110, 34] }, b: { h: [90, 27] },
    muscles: 'Rear delts, upper back', cues: ['Set the rope at head height and step back to tension.', 'Pull toward your face, splitting the rope and driving your elbows high and back.', 'Return slowly without letting the stack drop.'] },
  backext: { props: [['l', 60, 80, 84, 80, 6], ['l', 72, 80, 72, 111, 4], ['c', 30, 97, 4], ['l', 30, 100, 30, 111, 3]],
    a: { hip: [72, 74], t: 45, h: [88, 90], f: [32, 92] }, b: { t: 100, h: [96, 72] },
    muscles: 'Lower back, glutes', cues: ['Pad just below your hips, ankles locked in.', 'Lower your torso with a neutral spine.', 'Rise until your body forms a straight line. Avoid over-arching.'] },
  lunge: { item: 'db', a: { hip: [78, 72], t: 180, h: [79, 73], f: [96, 108], f2: [56, 108] }, b: { hip: [76, 88], h: [77, 89] },
    muscles: 'Quads, glutes', cues: ['Step forward into a long stance, torso upright.', 'Lower until your back knee nearly touches the floor.', 'Drive through the front heel to rise, then step through.'] },
  bulgarian: { item: 'db', props: [['l', 30, 88, 58, 88, 6], ['l', 40, 88, 40, 111, 4]], a: { hip: [80, 70], t: 180, h: [81, 71], f: [94, 108], f2: [50, 86] }, b: { hip: [78, 86], h: [79, 87] },
    muscles: 'Quads, glutes', cues: ['Rear foot on a bench, front foot far enough ahead that the shin stays near vertical.', 'Lower straight down until your front thigh is about level.', 'Drive through the front foot to stand.'] },
  legext: { item: 'pad', props: SEAT(50, 86, 87, 54), a: { hip: [70, 82], t: 177, h: [72, 88], f: [90, 103] }, b: { f: [112, 78] },
    muscles: 'Quads', cues: ['Line your knees up with the machine pivot, pad on your lower shins.', 'Straighten your legs fully and squeeze.', 'Lower slowly to about 90°.'] },
  seatedcurl: { item: 'pad', props: SEAT(50, 86, 87, 54), a: { hip: [70, 82], t: 177, h: [72, 88], f: [112, 80] }, b: { f: [88, 104] },
    muscles: 'Hamstrings', cues: ['Pad just above your heels, thigh pad snug.', 'Curl your heels down and back under the seat.', 'Return slowly to straight legs.'] },
  lyingcurl: { item: 'pad', props: [['l', 20, 87, 104, 87, 6], ['l', 30, 87, 30, 111, 4], ['l', 96, 87, 96, 111, 4]],
    a: { hip: [60, 81], t: 90, h: [102, 92], f: [17, 81] }, b: { f: [46, 58] }, kb: -1,
    muscles: 'Hamstrings', cues: ['Lie face down, pad just above your heels, knees at the bench edge.', 'Curl your heels toward your glutes, keeping your hips down.', 'Lower slowly to straight legs.'] },
  hipthrust: { item: 'bar', props: [['l', 18, 88, 50, 88, 6], ['l', 28, 88, 28, 111, 4]],
    a: { hip: [60, 104], sh: [48, 84], h: [62, 98], f: [94, 108] }, b: { hip: [70, 84], sh: [42, 80], h: [72, 78] },
    muscles: 'Glutes', cues: ['Upper back on a bench, bar over your hips, feet flat.', 'Drive your hips up until thighs and torso are level.', 'Keep your chin tucked, squeeze at the top, and lower under control.'] },
  calf: { item: 'db', a: { ...STAND, h: [81, 68], f: [82, 108], toe: [90, 110] }, b: { hip: [80, 61], h: [81, 62], f: [82, 102] },
    muscles: 'Calves', cues: ['Balls of your feet on an edge, heels free.', 'Rise as high as you can and pause.', 'Lower slowly into a full stretch.'] },
  seatedcalf: { props: SEAT(50, 80, 88), a: { hip: [66, 85], t: 180, h: [88, 82], f: [94, 108], toe: [102, 110] }, b: { f: [94, 102] },
    muscles: 'Calves (soleus)', cues: ['Pad snug on your lower thighs, balls of your feet on the platform.', 'Push up onto your toes as high as you can.', 'Lower slowly until your heels drop below the platform.'] },
  legpress: { item: 'platform', props: [['l', 74, 92, 130, 36, 3], ['l', 30, 66, 58, 96, 6], ['l', 56, 96, 76, 96, 6]],
    a: { hip: [60, 90], t: -130, h: [66, 94], f: [80, 69] }, b: { f: [90, 59] },
    muscles: 'Quads, glutes', cues: ['Back flat on the pad, feet shoulder-width on the platform.', 'Lower until your knees reach about 90° without your hips lifting.', 'Press back up without locking your knees hard.'] },
  ohp: { item: 'bar', a: { ...STAND, h: [87, 37] }, b: { h: [81, 6] },
    muscles: 'Shoulders, triceps', cues: ['Bar at collarbone height, grip just outside your shoulders.', 'Brace your glutes and core, then press straight up, moving your head back out of the way.', 'Finish with the bar over mid-foot and arms locked.'] },
  seatedpress: { item: 'db', props: SEAT(54, 84, 88, 58), a: { hip: [68, 85], t: 180, h: [75, 54], f: [92, 108] }, b: { h: [69, 24] },
    muscles: 'Shoulders, triceps', cues: ['Sit tall with your back against the pad, weights at shoulder height.', 'Press up until your arms are straight overhead.', 'Lower to ear level under control.'] },
  uprightrow: { item: 'bar', eb: -1, a: { ...STAND, h: [81, 68] }, b: { h: [84, 42] },
    muscles: 'Side delts, traps', cues: ['Hold the bar with a shoulder-width grip.', 'Pull it up along your body, leading with the elbows.', 'Stop around chest height and lower slowly.'] },
  shrug: { item: 'db', a: { ...STAND, h: [81, 68], sy: 0 }, b: { h: [81, 63], sy: 5 },
    muscles: 'Traps', cues: ['Stand tall with the weights at your sides.', 'Lift your shoulders straight up toward your ears.', 'Hold briefly, then lower without rolling.'] },
  curl: { item: 'bar', a: { ...STAND, h: [82, 68] }, b: { h: [92, 44] },
    muscles: 'Biceps', cues: ['Stand tall with your elbows pinned at your sides.', 'Curl the weight up without swinging your torso.', 'Squeeze at the top, then lower all the way down.'] },
  preacher: { item: 'bar', props: SEAT(46, 74, 88).concat([['l', 60, 66, 80, 86, 6]]), a: { hip: [58, 86], t: 180, h: [76, 80], f: [84, 108] }, b: { h: [74, 53] },
    muscles: 'Biceps', cues: ['Rest the backs of your upper arms flat on the pad.', 'Curl up until your forearms are near vertical.', 'Lower until your arms are almost straight.'] },
  pushdown: { item: 'handle', anchor: [100, 0], a: { ...STAND, t: 172, h: [96, 46] }, b: { h: [87, 68] },
    muscles: 'Triceps', cues: ['Elbows tucked at your sides, slight forward lean.', 'Push down until your arms are straight.', 'Let your hands rise to about chest height while your elbows stay still.'] },
  skull: { item: 'bar', props: BENCH, a: { hip: [100, 79], t: -90, h: [72, 48], f: [122, 108] }, b: { h: [60, 58] },
    muscles: 'Triceps', cues: ['Lie on the bench with your arms straight over your shoulders.', 'Bend only at the elbows, lowering the bar toward your forehead.', 'Extend back up without letting your elbows flare.'] },
  ohext: { item: 'db', a: { ...STAND, h: [81, 6] }, b: { h: [72, 32] },
    muscles: 'Triceps (long head)', cues: ['Arms overhead, elbows pointing forward.', 'Lower the weight behind your head.', 'Extend to straight arms while your upper arms stay still.'] },
  crunch: { a: { hip: [70, 104], t: -90, h: [34, 100], f: [96, 108] }, b: { t: -118, h: [38, 80] },
    muscles: 'Abs', cues: ['Lie with knees bent, hands lightly behind your head.', 'Curl your shoulders off the floor by shortening your abs.', 'Lower without letting your head drop.'] },
  cablecrunch: { item: 'handle', anchor: [96, 0], a: { hip: [70, 80], t: 170, h: [80, 42], f: [50, 108], toe: [40, 110] }, b: { t: 110, h: [100, 64] },
    muscles: 'Abs', cues: ['Kneel facing the stack with the rope beside your head.', 'Crunch down by bringing your ribs toward your hips.', 'Keep your hips still and return slowly.'] },
  rollout: { item: 'wheel', a: { hip: [60, 82], t: 120, h: [88, 100], f: [40, 108], toe: [30, 110] }, b: { hip: [74, 96], t: 95, h: [132, 100] },
    muscles: 'Abs, core', cues: ['Kneel with your hands on the wheel under your shoulders.', 'Roll forward while keeping your back flat.', 'Go only as far as you can control, then pull back with your abs.'] },
  pallof: { item: 'handle', a: { ...STAND, h: [86, 52] }, b: { h: [110, 50] },
    muscles: 'Core (anti-rotation)', cues: ['Stand side-on to the cable with the handle at your chest.', 'Press straight out and hold without letting the cable turn you.', 'Bring it back to your chest and repeat.'] },
  latraise: { view: 'front', item: 'db', eb: -1, a: { hy: 67, hR: [93, 68] }, b: { hR: [121, 41] },
    muscles: 'Side delts', cues: ['Weights at your sides, slight bend in the elbows.', 'Raise out to the sides until your arms are level with your shoulders.', 'Lower slowly, without shrugging.'] },
  crossover: { view: 'front', item: 'handle', anchor: [152, 6], eb: -1, a: { hy: 67, hR: [118, 26] }, b: { hR: [84, 62] },
    muscles: 'Chest', cues: ['Set the handles high and step forward into a split stance.', 'Bring your hands down and together in front of your chest.', 'Return slowly to a stretch, elbows slightly bent.'] },
  twist: { view: 'front', legs: 'seat', item: 'plate', eb: -1, a: { hy: 102, lean: -4, hR: [70, 80], hL: [56, 80] }, b: { lean: 4, hR: [104, 80], hL: [90, 80] },
    muscles: 'Obliques', cues: ['Sit leaning back slightly, feet lifted or resting on the floor.', 'Rotate your torso to bring the weight beside one hip.', 'Twist to the other side, moving from your ribs, not just your arms.'] },
};

type Override = Partial<Pick<Pattern, 'item' | 'anchor' | 'note'>>;

/** Exercise id → [pattern, overrides]. */
const DEMO: Record<string, [string, Override?]> = {
  'bench-press': ['bench'], 'incline-bench-press': ['incline'], 'dumbbell-bench-press': ['bench', { item: 'db' }],
  'incline-dumbbell-press': ['incline', { item: 'db' }], 'chest-fly': ['fly'], 'cable-crossover': ['crossover'],
  'chest-dip': ['dip'], 'push-up': ['pushup'], 'machine-chest-press': ['mpress'],
  'deadlift': ['deadlift'], 'bent-over-row': ['row'], 'pull-up': ['pullup', { note: 'Overhand grip, a little wider than your shoulders.' }],
  'chin-up': ['pullup', { note: 'Palms facing you, hands about shoulder-width.' }], 'lat-pulldown': ['pulldown'], 'seated-cable-row': ['cablerow'],
  'dumbbell-row': ['row', { item: 'db', note: 'Often done one arm at a time with the other hand and knee on a bench.' }],
  't-bar-row': ['row'], 'face-pull': ['facepull'], 'rack-pull': ['rackpull'], 'back-extension': ['backext'],
  'squat': ['squat'], 'front-squat': ['frontsquat'], 'romanian-deadlift': ['rdl'], 'leg-press': ['legpress'],
  'bulgarian-split-squat': ['bulgarian'], 'walking-lunge': ['lunge'], 'leg-extension': ['legext'], 'lying-leg-curl': ['lyingcurl'],
  'seated-leg-curl': ['seatedcurl'], 'hip-thrust': ['hipthrust'], 'goblet-squat': ['goblet'], 'standing-calf-raise': ['calf'],
  'seated-calf-raise': ['seatedcalf'], 'hack-squat': ['squat', { item: '', note: 'On the machine your back stays against the pad.' }],
  'overhead-press': ['ohp'], 'seated-dumbbell-press': ['seatedpress'], 'lateral-raise': ['latraise'],
  'cable-lateral-raise': ['latraise', { item: 'handle', anchor: [70, 110] }], 'rear-delt-fly': ['reardelt'],
  'arnold-press': ['seatedpress', { note: 'Start with palms facing you and rotate them outward as you press.' }],
  'upright-row': ['uprightrow'], 'shrug': ['shrug'],
  'barbell-curl': ['curl'], 'dumbbell-curl': ['curl', { item: 'db' }], 'hammer-curl': ['curl', { item: 'db', note: 'Keep palms facing each other the whole time.' }],
  'preacher-curl': ['preacher'], 'cable-curl': ['curl', { item: 'handle', anchor: [104, 111] }], 'triceps-pushdown': ['pushdown'],
  'skull-crusher': ['skull'], 'overhead-triceps-extension': ['ohext'], 'close-grip-bench-press': ['bench', { note: 'Hands about shoulder-width, elbows tucked close.' }],
  'triceps-dip': ['dip', { note: 'Stay more upright than a chest dip to bias the triceps.' }],
  'hanging-leg-raise': ['legraise'], 'cable-crunch': ['cablecrunch'], 'ab-wheel-rollout': ['rollout'],
  'russian-twist': ['twist'], 'crunch': ['crunch'], 'pallof-press': ['pallof'],
};

export function demoFor(exId: string): Pattern | null {
  const d = DEMO[exId];
  return d ? { ...PAT[d[0]], ...(d[1] || {}) } : null;
}
