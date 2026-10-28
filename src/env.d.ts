/// <reference types="vite/client" />

/** ISO time of the build, injected by Vite. */
declare const __BUILD_TIME__: string;

/** The Claude artifact runtime. Absent when the page runs outside an artifact viewer. */
interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

interface Window {
  claude?: ClaudeRuntime;
  webkitAudioContext?: typeof AudioContext;
}
