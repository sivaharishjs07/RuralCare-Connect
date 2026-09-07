export type OutboxOperationType = 'insert' | 'update' | 'delete';

export type OutboxSyncStatus = 'pending' | 'syncing' | 'failed';

export type OutboxItem = {
  localOperationId: string;
  operationType: OutboxOperationType;
  resource: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
  syncStatus: OutboxSyncStatus;
};
