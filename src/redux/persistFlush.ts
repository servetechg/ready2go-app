import type { Persistor } from 'redux-persist';

let persistorRef: Persistor | null = null;

/** Called once from store setup so auth updates can flush to disk before kill. */
export function bindPersistor(persistor: Persistor): void {
  persistorRef = persistor;
}

/** Force-write redux-persist to AsyncStorage (await before background/kill if possible). */
export async function flushPersistedState(): Promise<void> {
  if (!persistorRef) return;
  try {
    await persistorRef.flush();
  } catch {
    // Best-effort — never block UX on storage errors
  }
}
