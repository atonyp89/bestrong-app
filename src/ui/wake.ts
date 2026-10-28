/* Keeps the screen on during a workout where the browser allows it. */
import { S } from '../state';

let lock: WakeLockSentinel | null = null;

export async function wake(on: boolean) {
  try {
    if (on && !lock && navigator.wakeLock && !document.hidden) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch { lock = null; }
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && S.active.w) void wake(true); });
