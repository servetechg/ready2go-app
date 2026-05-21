import { STORAGE_KEYS } from '@/constants/storage';
import { safePersistStorage } from '@/utils/persistStorage';

const MIGRATION_KEY = 'ready2go_storage_version';
const CURRENT_VERSION = '6';

const KEYS_TO_CLEAR = [
  `persist:${STORAGE_KEYS.AUTH}`,
  `persist:${STORAGE_KEYS.REGISTRATION}`,
  STORAGE_KEYS.AUTH,
  STORAGE_KEYS.REGISTRATION,
  MIGRATION_KEY,
];

/** Clears corrupted persist blobs that cause native boolean cast crashes */
export async function runStorageMigration(): Promise<void> {
  try {
    const version = await safePersistStorage.getItem(MIGRATION_KEY);
    if (version === CURRENT_VERSION) return;

    await Promise.all(KEYS_TO_CLEAR.map((key) => safePersistStorage.removeItem(key)));
    await safePersistStorage.setItem(MIGRATION_KEY, CURRENT_VERSION);
  } catch {
    // ignore migration errors
  }
}
