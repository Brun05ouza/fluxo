// Local mutations refresh immediately; other devices refresh on focus / every 30s.
const listeners = new Map<string, Set<() => void>>();
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('fluxo-data');
function dispatch(table: string) { listeners.get(table)?.forEach(fn => fn()); }
if (channel) channel.onmessage = event => { if (typeof event.data === 'string') dispatch(event.data); };
export function notifyDataChange(table: string) { dispatch(table); channel?.postMessage(table); }
export function subscribeData(table: string, refresh: () => unknown) {
  let running = false;
  let disposed = false;
  const run = async () => {
    if (disposed || running || document.visibilityState === 'hidden') return;
    running = true;
    try { await refresh(); } finally { running = false; }
  };
  const callbacks = listeners.get(table) ?? new Set();
  callbacks.add(run);
  listeners.set(table, callbacks);
  const timer = window.setInterval(run, 30_000);
  window.addEventListener('focus', run);
  document.addEventListener('visibilitychange', run);
  return () => {
    disposed = true;
    callbacks.delete(run);
    if (!callbacks.size) listeners.delete(table);
    window.clearInterval(timer);
    window.removeEventListener('focus', run);
    document.removeEventListener('visibilitychange', run);
  };
}
