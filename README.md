# Ironlog

A distraction-free, mobile-first workout tracker.

- Log sets with weight, reps and the previous session's numbers, with a rest timer after each set
- Templates (Push / Pull / Legs examples included), history with duration, volume and PRs
- 60 built-in exercises with animated form demos and cues, plus custom exercises
- kg / lb, light and dark themes

Vanilla TypeScript with Vite. No UI framework: screens render HTML strings and controls use `data-act` attributes.

## Develop

```bash
npm install
npm run dev
```

`npm run typecheck` runs the TypeScript compiler. `npm run build` typechecks, bundles everything into one file (`dist/index.html`), and writes `dist/ironlog.html`, the same page in the shape the Claude artifact host publishes.

## Layout

```
index.html            page markup: shell, sheets, icon sprite
src/
  main.ts             entry: wires events and boots
  styles.css          design tokens (light and dark) and all styles
  types.ts            data model
  state.ts            app state, local persistence, unit conversion
  cloud.ts            per-person sync through the artifact `db` capability
  stats.ts            previous sets, volume, best sets, PRs
  data/exercises.ts   exercise library and example templates
  demo/               form demos: movement patterns, stick-figure renderer, player
  ui/
    actions.ts        data-act click and input delegation
    shell.ts          sheets, toasts, confirm dialog
    app.ts            tabs and top-level rendering
    live.ts           in-progress workout
    history.ts, exercises.ts, templates.ts, picker.ts, settings.ts, workoutTab.ts
    timer.ts, wake.ts rest timer, workout clock, screen wake lock
scripts/artifact.mjs  converts the build to the artifact page shape
```

### Adding a feature

1. Render a control with `data-act="my-action"` (and any `data-*` it needs).
2. Register the handler in that screen's module: `actions({ 'my-action': el => { ... } })`.
3. Change state through `S`, then call `touch(key)` so it saves locally and syncs.

### Adding an exercise demo

Add a pose pair to `PAT` in `src/demo/patterns.ts` (or reuse one), then map the exercise id to it in `DEMO`.

## Data

Data is saved in the browser's local storage. When the page runs as a Claude artifact it also syncs to the viewer's account, privately under `data/users/<id>/`.
