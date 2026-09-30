export interface AuditEntryData {
  actorUserId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  reference?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
}

export interface AuditLogger {
  log(entry: AuditEntryData, transaction?: FirebaseFirestore.Transaction): Promise<void>;
}
