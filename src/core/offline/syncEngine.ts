import { SyncError } from './types';
import type {
  FailureKind,
  NewOutboxItem,
  OutboxItem,
  OutboxStore,
  SyncHandler,
  SyncSnapshot,
} from './types';

export const BACKOFF_BASE_MS = 2_000;
export const BACKOFF_CAP_MS = 5 * 60_000;

/** Exponential backoff with "equal jitter": between half and the full delay. */
export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts - 1));
  return Math.round(exp / 2 + random() * (exp / 2));
}

/**
 * Decides what a failed request means. Expects errors with a numeric `status`
 * (your ApiError). Anything without a status (fetch TypeError, timeout) is a
 * network problem and is retried.
 * 401 = session problem (stop the loop, do not burn attempts).
 * 403 is NOT treated as a session problem: it fails that one item visibly.
 */
export function classifyError(err: unknown): FailureKind {
  const status = (err as { status?: unknown } | null)?.status;
  if (typeof status === 'number') {
    if (status === 401) return 'auth';
    if (status === 409) return 'conflict';
    if (status === 408 || status === 425 || status === 429 || status >= 500) return 'retry';
    if (status >= 400) return 'fatal';
  }
  return 'retry';
}

export interface EngineOptions {
  store: OutboxStore;
  now?: () => number;
  isOnline?: () => boolean;
  random?: () => number;
  maxAttempts?: number;
  classify?: (err: unknown) => FailureKind;
  /** Start draining right after enqueue. Default true. */
  autoDrain?: boolean;
}

type Outcome = 'done' | 'retry' | 'fatal' | 'conflict' | 'auth';

export function createSyncEngine(opts: EngineOptions) {
  const store = opts.store;
  const now = opts.now ?? Date.now;
  const isOnline = opts.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine);
  const random = opts.random ?? Math.random;
  const maxAttempts = opts.maxAttempts ?? 8;
  const classify = opts.classify ?? classifyError;
  const autoDrain = opts.autoDrain ?? true;

  const handlers = new Map<string, SyncHandler>();
  const listeners = new Set<() => void>();
  let snapshot: SyncSnapshot = {
    pending: 0, syncing: 0, failed: 0, needsReview: 0,
    online: true, running: false, paused: false, lastSyncAt: null,
  };
  let running: Promise<void> | null = null;
  let paused = false;
  let started = false;
  let lastSyncAt: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  let cleanup: (() => void) | null = null;

  const same = (a: SyncSnapshot, b: SyncSnapshot) =>
    (Object.keys(a) as (keyof SyncSnapshot)[]).every((k) => a[k] === b[k]);

  async function refresh() {
    const c = await store.counts();
    const next: SyncSnapshot = { ...c, online: isOnline(), running: running !== null, paused, lastSyncAt };
    if (!same(next, snapshot)) {
      snapshot = next;
      listeners.forEach((l) => l());
    }
  }

  async function schedule() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!started) return;
    const at = await store.nextDueAt();
    if (at === null) return;
    const delay = Math.min(BACKOFF_CAP_MS, Math.max(1_000, at - now()));
    timer = setTimeout(() => { void drain(); }, delay);
  }

  async function runOne(item: OutboxItem): Promise<Outcome> {
    const handler = handlers.get(item.type);
    if (!handler) {
      await store.patch(item.id, { status: 'failed', lastError: `No handler registered for "${item.type}"` });
      return 'fatal';
    }
    await store.patch(item.id, { status: 'syncing' });
    try {
      await handler(item, { getBlob: store.getBlob });
      await store.remove(item.id);
      lastSyncAt = now();
      return 'done';
    } catch (err) {
      const kind = err instanceof SyncError ? err.kind : classify(err);
      const message = err instanceof Error ? err.message : String(err);
      const attempts = item.attempts + 1;
      if (kind === 'auth') {
        await store.patch(item.id, { status: 'pending', lastError: message });
        return 'auth';
      }
      if (kind === 'conflict') {
        await store.patch(item.id, { status: 'needs_review', attempts, lastError: message });
        return 'conflict';
      }
      if (kind === 'fatal' || attempts >= maxAttempts) {
        await store.patch(item.id, { status: 'failed', attempts, lastError: message });
        return 'fatal';
      }
      await store.patch(item.id, {
        status: 'pending', attempts, lastError: message,
        nextAttemptAt: now() + backoffMs(attempts, random),
      });
      return 'retry';
    }
  }

  /** Single-flight: concurrent callers share one run. */
  function drain(): Promise<void> {
    if (running) return running;
    paused = false;
    running = (async () => {
      try {
        await store.recoverStuck();
        await refresh();
        while (isOnline()) {
          const item = await store.nextDue(now());
          if (!item) break;
          if ((await runOne(item)) === 'auth') { paused = true; break; }
        }
      } finally {
        running = null;
        await refresh();
        await schedule();
      }
    })();
    return running;
  }

  async function enqueue(input: NewOutboxItem): Promise<OutboxItem> {
    const blobs = input.blobs ?? [];
    const t = now();
    const item: OutboxItem = {
      id: input.id ?? crypto.randomUUID(),
      type: input.type,
      payload: input.payload,
      blobIds: blobs.map((b) => b.id),
      status: 'pending',
      attempts: 0,
      nextAttemptAt: t,
      createdAt: t,
    };
    const saved = await store.add(item, blobs);
    await refresh();
    if (autoDrain) void drain().catch(() => undefined);
    return saved;
  }

  async function retry(id: string) {
    await store.patch(id, { status: 'pending', attempts: 0, nextAttemptAt: now(), lastError: undefined });
    void drain().catch(() => undefined);
  }

  async function retryAllFailed() {
    const n = await store.resetFailed(now());
    if (n > 0) void drain().catch(() => undefined);
    return n;
  }

  async function discard(id: string) {
    await store.remove(id);
    await refresh();
  }

  async function hasUnsynced() {
    const c = await store.counts();
    return c.pending + c.syncing + c.failed + c.needsReview > 0;
  }

  /** Call once after handlers are registered (e.g. in main.tsx). Returns a stop function. */
  function start(): () => void {
    if (started) return stop;
    started = true;
    const kick = () => { void refresh(); void drain().catch(() => undefined); };
    const onVisible = () => { if (document.visibilityState === 'visible') kick(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', kick);
      window.addEventListener('offline', kick);
      document.addEventListener('visibilitychange', onVisible);
      cleanup = () => {
        window.removeEventListener('online', kick);
        window.removeEventListener('offline', kick);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
    // Fallback poll: iOS Safari has no Background Sync, so we cannot rely on the SW.
    interval = setInterval(kick, 30_000);
    kick();
    return stop;
  }

  function stop() {
    started = false;
    if (timer) clearTimeout(timer);
    if (interval) clearInterval(interval);
    timer = null; interval = null;
    cleanup?.(); cleanup = null;
  }

  return {
    registerHandler(type: string, fn: SyncHandler) { handlers.set(type, fn); },
    enqueue, drain, retry, retryAllFailed, discard, hasUnsynced, start, stop, refresh,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
    getSnapshot: () => snapshot,
  };
}

export type SyncEngine = ReturnType<typeof createSyncEngine>;
