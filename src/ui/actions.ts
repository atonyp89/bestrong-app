/* Event delegation. Markup marks controls with data-act="name"; modules register what each name does.
   Adding a feature means rendering a data-act control and registering its handler next to it. */

export type ActionHandler = (el: HTMLElement, ev: MouseEvent) => void;
/** Return true when the handler consumed the input event. */
export type InputHandler = (t: HTMLInputElement) => boolean;

const handlers = new Map<string, ActionHandler>();
const inputHandlers: InputHandler[] = [];

export function actions(map: Record<string, ActionHandler>) {
  for (const [name, fn] of Object.entries(map)) {
    if (handlers.has(name)) throw new Error(`Duplicate action: ${name}`);
    handlers.set(name, fn);
  }
}

export const onInput = (fn: InputHandler) => { inputHandlers.push(fn); };

export function installDelegation() {
  document.addEventListener('click', ev => {
    const el = (ev.target as Element).closest<HTMLElement>('[data-act]');
    if (el) handlers.get(el.dataset.act!)?.(el, ev);
  });
  document.addEventListener('input', ev => {
    const t = ev.target as HTMLInputElement;
    for (const fn of inputHandlers) if (fn(t)) return;
  });
}
