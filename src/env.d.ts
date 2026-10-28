/// <reference types="vite/client" />

/** The Claude artifact runtime. Absent when the page runs outside an artifact viewer. */
interface ClaudeRuntime {
  use(name: string): Promise<unknown>;
}

interface Window {
  claude?: ClaudeRuntime;
  webkitAudioContext?: typeof AudioContext;
}
