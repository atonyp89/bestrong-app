import type { Exercise, Template } from '../types';
import { slug } from '../util';

export const PARTS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;

const RAW: [name: string, part: string, equip: string][] = [
  ['Bench Press', 'Chest', 'Barbell'], ['Incline Bench Press', 'Chest', 'Barbell'], ['Dumbbell Bench Press', 'Chest', 'Dumbbell'],
  ['Incline Dumbbell Press', 'Chest', 'Dumbbell'], ['Chest Fly', 'Chest', 'Dumbbell'], ['Cable Crossover', 'Chest', 'Cable'],
  ['Chest Dip', 'Chest', 'Bodyweight'], ['Push Up', 'Chest', 'Bodyweight'], ['Machine Chest Press', 'Chest', 'Machine'],
  ['Deadlift', 'Back', 'Barbell'], ['Bent Over Row', 'Back', 'Barbell'], ['Pull Up', 'Back', 'Bodyweight'], ['Chin Up', 'Back', 'Bodyweight'],
  ['Lat Pulldown', 'Back', 'Cable'], ['Seated Cable Row', 'Back', 'Cable'], ['Dumbbell Row', 'Back', 'Dumbbell'],
  ['T-Bar Row', 'Back', 'Barbell'], ['Face Pull', 'Back', 'Cable'], ['Rack Pull', 'Back', 'Barbell'], ['Back Extension', 'Back', 'Bodyweight'],
  ['Squat', 'Legs', 'Barbell'], ['Front Squat', 'Legs', 'Barbell'], ['Romanian Deadlift', 'Legs', 'Barbell'], ['Leg Press', 'Legs', 'Machine'],
  ['Bulgarian Split Squat', 'Legs', 'Dumbbell'], ['Walking Lunge', 'Legs', 'Dumbbell'], ['Leg Extension', 'Legs', 'Machine'],
  ['Lying Leg Curl', 'Legs', 'Machine'], ['Seated Leg Curl', 'Legs', 'Machine'], ['Hip Thrust', 'Legs', 'Barbell'],
  ['Goblet Squat', 'Legs', 'Dumbbell'], ['Standing Calf Raise', 'Legs', 'Machine'], ['Seated Calf Raise', 'Legs', 'Machine'], ['Hack Squat', 'Legs', 'Machine'],
  ['Overhead Press', 'Shoulders', 'Barbell'], ['Seated Dumbbell Press', 'Shoulders', 'Dumbbell'], ['Lateral Raise', 'Shoulders', 'Dumbbell'],
  ['Cable Lateral Raise', 'Shoulders', 'Cable'], ['Rear Delt Fly', 'Shoulders', 'Dumbbell'], ['Arnold Press', 'Shoulders', 'Dumbbell'],
  ['Upright Row', 'Shoulders', 'Barbell'], ['Shrug', 'Shoulders', 'Dumbbell'],
  ['Barbell Curl', 'Arms', 'Barbell'], ['Dumbbell Curl', 'Arms', 'Dumbbell'], ['Hammer Curl', 'Arms', 'Dumbbell'], ['Preacher Curl', 'Arms', 'EZ Bar'],
  ['Cable Curl', 'Arms', 'Cable'], ['Triceps Pushdown', 'Arms', 'Cable'], ['Skull Crusher', 'Arms', 'EZ Bar'],
  ['Overhead Triceps Extension', 'Arms', 'Cable'], ['Close Grip Bench Press', 'Arms', 'Barbell'], ['Triceps Dip', 'Arms', 'Bodyweight'],
  ['Hanging Leg Raise', 'Core', 'Bodyweight'], ['Cable Crunch', 'Core', 'Cable'], ['Ab Wheel Rollout', 'Core', 'Bodyweight'],
  ['Russian Twist', 'Core', 'Bodyweight'], ['Crunch', 'Core', 'Bodyweight'], ['Pallof Press', 'Core', 'Cable'],
];

export const LIB: Exercise[] = RAW.map(([name, part, equip]) => ({ id: slug(name), name, part, equip }));

/** Example templates, shown until the user edits or deletes them. */
export const SAMPLE_TEMPLATES: Template[] = ([
  ['t-push', 'Push', [['bench-press', 4], ['overhead-press', 3], ['incline-dumbbell-press', 3], ['lateral-raise', 3], ['triceps-pushdown', 3]]],
  ['t-pull', 'Pull', [['deadlift', 3], ['pull-up', 3], ['bent-over-row', 3], ['face-pull', 3], ['dumbbell-curl', 3]]],
  ['t-legs', 'Legs', [['squat', 4], ['romanian-deadlift', 3], ['leg-press', 3], ['lying-leg-curl', 3], ['standing-calf-raise', 4]]],
] as [string, string, [string, number][]][]).map(([id, name, items]) => ({
  id, name, sample: true, updatedAt: 0, items: items.map(([ex, sets]) => ({ ex, sets })),
}));
