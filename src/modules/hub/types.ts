export interface HubBadges {
  /** Items awaiting this user's action (Phase 3+). */
  pendingActions: Record<string, number>
  /** Unsynced outbox items (Phase 2+). */
  unsynced: number
}
