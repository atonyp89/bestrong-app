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
}

export interface TemplateItem {
  ex: string;
  sets: number;
}

export interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
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
