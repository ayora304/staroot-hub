// Shared types for the offline outbox and sync engine (Phase 2).
// Keep this file free of runtime imports so it can be used anywhere.

export type OutboxStatus = 'pending' | 'syncing' | 'failed' | 'needs_review';

export interface OutboxItem {
  /** Local autoincrement, defines FIFO order. Assigned by the store. */
  seq?: number;
  /** Client UUID. This is the idempotency key sent to the server as `client_id`. */
  id: string;
  /** Account that created the local write; the sync engine only drains it for this account. */
  userId: string;
  type: string;
  payload: unknown;
  /** IDs of blobs (photos) held in the blob store for this item. */
  blobIds: string[];
  status: OutboxStatus;
  attempts: number;
  /** Epoch ms. The item is not retried before this time. */
  nextAttemptAt: number;
  createdAt: number;
  lastError?: string;
}

export interface BlobInput {
  id: string;
  blob: Blob;
}

export interface NewOutboxItem {
  /** Optional: pass your own UUID so a re-submit of the same form is deduplicated. */
  id?: string;
  userId: string;
  type: string;
  payload: unknown;
  blobs?: BlobInput[];
}

export interface OutboxCounts {
  pending: number;
  syncing: number;
  failed: number;
  needsReview: number;
}

export interface OutboxStore {
  /** Idempotent: if an item with the same id exists, it is returned and nothing is written. */
  add(item: OutboxItem, blobs: BlobInput[]): Promise<OutboxItem>;
  get(id: string): Promise<OutboxItem | undefined>;
  list(): Promise<OutboxItem[]>;
  /** Oldest pending item for this account whose nextAttemptAt <= now. */
  nextDue(now: number, userId: string): Promise<OutboxItem | undefined>;
  /** Earliest nextAttemptAt among pending items, or null. */
  nextDueAt(userId: string): Promise<number | null>;
  patch(id: string, patch: Partial<OutboxItem>): Promise<void>;
  /** Deletes the item and its blobs. */
  remove(id: string): Promise<void>;
  /** Items left in 'syncing' by a crash or closed tab go back to 'pending'. */
  recoverStuck(userId: string): Promise<void>;
  /** failed -> pending (attempts reset). Returns how many were reset. */
  resetFailed(now: number, userId: string): Promise<number>;
  counts(userId: string): Promise<OutboxCounts>;
  getBlob(id: string): Promise<Blob | undefined>;
  /** Removes everything. Only for a deliberate wipe. */
  clear(): Promise<void>;
}

export type FailureKind = 'retry' | 'fatal' | 'conflict' | 'auth';

/** Throw from a handler to force a specific outcome. */
export class SyncError extends Error {
  kind: FailureKind;
  constructor(kind: FailureKind, message: string) {
    super(message);
    this.name = 'SyncError';
    this.kind = kind;
  }
}

export interface HandlerContext {
  getBlob: (id: string) => Promise<Blob | undefined>;
}

/**
 * Sends one outbox item to the server. Must be idempotent on the server side
 * (use item.id as client_id). Resolve = success. Throw = failure.
 * For photos: upload the files first, then write the metadata.
 */
export type SyncHandler = (item: OutboxItem, ctx: HandlerContext) => Promise<void>;

export interface SyncSnapshot extends OutboxCounts {
  online: boolean;
  running: boolean;
  /** True after a 401: the loop stopped until the next trigger. */
  paused: boolean;
  lastSyncAt: number | null;
}
