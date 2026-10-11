import { describe, expect, it } from 'vitest';
import { BACKOFF_BASE_MS, BACKOFF_CAP_MS, backoffMs, classifyError, createSyncEngine } from '../../../src/core/offline/syncEngine';
import { SyncError } from '../../../src/core/offline/types';
import { createMemoryStore } from '../helpers/memoryStore';

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

function setup(over: { maxAttempts?: number } = {}) {
  const store = createMemoryStore();
  let t = 1_000_000;
  let online = true;
  const engine = createSyncEngine({
    store,
    now: () => t,
    isOnline: () => online,
    random: () => 0.5,
    autoDrain: false,
    maxAttempts: over.maxAttempts,
  });
  return {
    store,
    engine,
    advance: (ms: number) => { t += ms; },
    setOnline: (v: boolean) => { online = v; },
  };
}

describe('backoffMs', () => {
  it('stays within half..full of the exponential delay', () => {
    expect(backoffMs(1, () => 0)).toBe(BACKOFF_BASE_MS / 2);
    expect(backoffMs(1, () => 1)).toBe(BACKOFF_BASE_MS);
    expect(backoffMs(2, () => 1)).toBe(BACKOFF_BASE_MS * 2);
  });
  it('is capped', () => {
    expect(backoffMs(50, () => 1)).toBe(BACKOFF_CAP_MS);
  });
});

describe('classifyError', () => {
  it('maps statuses to outcomes', () => {
    expect(classifyError(httpError(401))).toBe('auth');
    expect(classifyError(httpError(403))).toBe('fatal');
    expect(classifyError(httpError(409))).toBe('conflict');
    expect(classifyError(httpError(400))).toBe('fatal');
    expect(classifyError(httpError(429))).toBe('retry');
    expect(classifyError(httpError(503))).toBe('retry');
    expect(classifyError(new TypeError('fetch failed'))).toBe('retry');
  });
});

describe('sync engine', () => {
  it('is idempotent on enqueue with the same id', async () => {
    const { engine } = setup();
    await engine.enqueue({ id: 'a', type: 't', payload: 1 });
    await engine.enqueue({ id: 'a', type: 't', payload: 2 });
    expect(engine.getSnapshot().pending).toBe(1);
  });

  it('sends items in FIFO order and removes them on success', async () => {
    const { engine } = setup();
    const order: unknown[] = [];
    engine.registerHandler('t', async (i) => { order.push(i.payload); });
    await engine.enqueue({ type: 't', payload: 'first' });
    await engine.enqueue({ type: 't', payload: 'second' });
    await engine.drain();
    expect(order).toEqual(['first', 'second']);
    expect(engine.getSnapshot().pending).toBe(0);
    expect(engine.getSnapshot().lastSyncAt).not.toBeNull();
  });

  it('retries network failures with backoff and does not retry early', async () => {
    const { engine, store, advance } = setup();
    let calls = 0;
    engine.registerHandler('t', async () => {
      calls++;
      if (calls === 1) throw new TypeError('fetch failed');
    });
    const item = await engine.enqueue({ id: 'x', type: 't', payload: 0 });
    await engine.drain();
    expect(calls).toBe(1);
    const after = await store.get(item.id);
    expect(after?.status).toBe('pending');
    expect(after?.attempts).toBe(1);

    await engine.drain(); // not due yet
    expect(calls).toBe(1);

    advance(BACKOFF_BASE_MS + 1);
    await engine.drain();
    expect(calls).toBe(2);
    expect(await store.get('x')).toBeUndefined();
  });

  it('marks 4xx as failed without blocking later items', async () => {
    const { engine, store } = setup();
    const sent: unknown[] = [];
    engine.registerHandler('t', async (i) => {
      if (i.payload === 'bad') throw httpError(400);
      sent.push(i.payload);
    });
    await engine.enqueue({ id: 'bad', type: 't', payload: 'bad' });
    await engine.enqueue({ id: 'ok', type: 't', payload: 'ok' });
    await engine.drain();
    expect((await store.get('bad'))?.status).toBe('failed');
    expect(sent).toEqual(['ok']);
  });

  it('sends 409 to needs_review', async () => {
    const { engine, store } = setup();
    engine.registerHandler('t', async () => { throw httpError(409); });
    await engine.enqueue({ id: 'c', type: 't', payload: 0 });
    await engine.drain();
    expect((await store.get('c'))?.status).toBe('needs_review');
    expect(engine.getSnapshot().needsReview).toBe(1);
  });

  it('honours SyncError kinds thrown by a handler', async () => {
    const { engine, store } = setup();
    engine.registerHandler('t', async () => { throw new SyncError('fatal', 'nope'); });
    await engine.enqueue({ id: 's', type: 't', payload: 0 });
    await engine.drain();
    expect((await store.get('s'))?.lastError).toBe('nope');
    expect((await store.get('s'))?.status).toBe('failed');
  });

  it('stops on 401 without burning attempts or touching later items', async () => {
    const { engine, store } = setup();
    const called: unknown[] = [];
    engine.registerHandler('t', async (i) => {
      called.push(i.payload);
      if (i.payload === 'A') throw httpError(401);
    });
    await engine.enqueue({ id: 'A', type: 't', payload: 'A' });
    await engine.enqueue({ id: 'B', type: 't', payload: 'B' });
    await engine.drain();
    expect(called).toEqual(['A']);
    const a = await store.get('A');
    expect(a?.status).toBe('pending');
    expect(a?.attempts).toBe(0);
    expect(engine.getSnapshot().paused).toBe(true);
  });

  it('fails an item after maxAttempts', async () => {
    const { engine, store, advance } = setup({ maxAttempts: 2 });
    engine.registerHandler('t', async () => { throw httpError(500); });
    await engine.enqueue({ id: 'm', type: 't', payload: 0 });
    await engine.drain();
    expect((await store.get('m'))?.status).toBe('pending');
    advance(BACKOFF_CAP_MS);
    await engine.drain();
    expect((await store.get('m'))?.status).toBe('failed');
  });

  it('does nothing while offline', async () => {
    const { engine, setOnline } = setup();
    let calls = 0;
    engine.registerHandler('t', async () => { calls++; });
    await engine.enqueue({ type: 't', payload: 0 });
    setOnline(false);
    await engine.drain();
    expect(calls).toBe(0);
    expect(engine.getSnapshot().pending).toBe(1);
  });

  it('recovers items left in syncing by a crash', async () => {
    const { engine, store } = setup();
    let calls = 0;
    engine.registerHandler('t', async () => { calls++; });
    await engine.enqueue({ id: 'r', type: 't', payload: 0 });
    await store.patch('r', { status: 'syncing' });
    await engine.drain();
    expect(calls).toBe(1);
  });

  it('is single-flight: concurrent drains run the handler once', async () => {
    const { engine } = setup();
    let calls = 0;
    engine.registerHandler('t', async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 10));
    });
    await engine.enqueue({ type: 't', payload: 0 });
    await Promise.all([engine.drain(), engine.drain()]);
    expect(calls).toBe(1);
  });

  it('gives handlers their blobs and deletes them after success', async () => {
    const { engine, store } = setup();
    let size = -1;
    engine.registerHandler('t', async (item, ctx) => {
      size = (await ctx.getBlob(item.blobIds[0]))?.size ?? -1;
    });
    await engine.enqueue({ type: 't', payload: 0, blobs: [{ id: 'p1', blob: new Blob(['hello']) }] });
    await engine.drain();
    expect(size).toBe(5);
    expect(await store.getBlob('p1')).toBeUndefined();
  });

  it('fails items with no registered handler instead of looping forever', async () => {
    const { engine, store } = setup();
    await engine.enqueue({ id: 'u', type: 'unknown', payload: 0 });
    await engine.drain();
    expect((await store.get('u'))?.status).toBe('failed');
  });

  it('retryAllFailed puts failed items back in the queue', async () => {
    const { engine, store } = setup();
    let ok = false;
    engine.registerHandler('t', async () => { if (!ok) throw httpError(400); });
    await engine.enqueue({ id: 'f', type: 't', payload: 0 });
    await engine.drain();
    expect((await store.get('f'))?.status).toBe('failed');
    ok = true;
    expect(await engine.retryAllFailed()).toBe(1);
    await engine.drain();
    expect(await store.get('f')).toBeUndefined();
  });
});
