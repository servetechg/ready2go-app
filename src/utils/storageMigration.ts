import { STORAGE_KEYS } from '@/constants/storage';
import { safePersistStorage } from '@/utils/persistStorage';

const MIGRATION_KEY = 'ready2go_storage_version';
/** v8: clear corrupt token backup keys; still never wipe redux auth persist. */
const CURRENT_VERSION = '8';

/** Registration + corrupt token backups. Auth redux-persist keys must survive. */
const KEYS_TO_CLEAR = [
  `persist:${STORAGE_KEYS.REGISTRATION}`,
  STORAGE_KEYS.REGISTRATION,
  'ready2go_access_token_v1',
  'ready2go_refresh_token_v1',
];

/** Clears corrupted registration / token-backup blobs; preserves auth session. */
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
