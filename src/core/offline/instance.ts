import { createDexieStore } from './dexieStore';
import { createSyncEngine } from './syncEngine';

/** The app-wide outbox and engine. Modules register handlers on `syncEngine`. */
export const outboxStore = createDexieStore();
export const syncEngine = createSyncEngine({ store: outboxStore });
