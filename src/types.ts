export type Unit = 'kg' | 'lb';

export interface Exercise {
  id: string;
  name: string;
  part: string;
  equip: string;
}

export interface SetEntry {
  w: number | null;
  r: number | null;
  done: boolean;
  /** '' for a working set, 'w' for a warm-up. */
  type: '' | 'w';
  /** Template targets in the workout's unit, shown as placeholders. */
  tw?: number | null;
  tr?: number | null;
}

export interface WorkoutItem {
  ex: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  name: string;
  start: number;
  end: number | null;
  /** Unit the weights were entered in. */
  unit: Unit;
  items: WorkoutItem[];
  updatedAt: number;
  /** Template this workout was started from, for the update offer on finish. */
  templateId?: string;
}

/** A planned set. Blank weight or reps follow the lifter's history instead. */
export interface TemplateSet {
  w: number | null;
  r: number | null;
  type: '' | 'w';
}

export interface TemplateItem {
  ex: string;
  sets: TemplateSet[];
}

export interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
  /** Unit the planned weights are stored in. */
  unit?: Unit;
  sample?: boolean;
  updatedAt?: number;
}

/** `t` is the last-modified time, used to resolve sync conflicts. */
interface Stamped {
  t: number;
}

export interface State {
  settings: { unit: Unit; rest: number } & Stamped;
  custom: { list: Exercise[] } & Stamped;
  templates: { list: Template[] } & Stamped;
  workouts: Workout[];
  active: { w: Workout | null } & Stamped;
  /** Workout doc keys deleted locally and not yet removed from the account. */
  deleted: string[];
}

export type SectionKey = 'settings' | 'custom' | 'templates' | 'active';
export type WorkoutKey = `w-${string}`;
export type DocKey = SectionKey | WorkoutKey;
