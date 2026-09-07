import type { OutboxItem } from '@/lib/offline/types';

const DATABASE_NAME = 'ruralcare-offline';
const DATABASE_VERSION = 1;

export const OFFLINE_STORES = {
  outbox: 'outbox',
} as const;

export type OfflineStoreName = (typeof OFFLINE_STORES)[keyof typeof OFFLINE_STORES];

const STORE_KEY_PATHS: Record<OfflineStoreName, string> = {
  outbox: 'localOperationId',
};

export class IndexedDbUnavailableError extends Error {
  constructor() {
    super('IndexedDB is not available in this environment.');
    this.name = 'IndexedDbUnavailableError';
  }
}

let databasePromise: Promise<IDBDatabase> | null = null;

function getIndexedDb(): IDBFactory {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new IndexedDbUnavailableError();
  }

  return window.indexedDB;
}

function toError(error: DOMException | null | unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('IndexedDB operation failed.');
}

export function openOfflineDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;

    try {
      request = getIndexedDb().open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(toError(error));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;

      (Object.values(OFFLINE_STORES) as OfflineStoreName[]).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, {
            keyPath: STORE_KEY_PATHS[storeName],
          });
        }
      });
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(toError(request.error));
    };

    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('IndexedDB upgrade is blocked by another open connection.'));
    };
  });

  return databasePromise;
}

async function runRequest<TResult>(
  storeName: OfflineStoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<TResult>
): Promise<TResult> {
  const database = await openOfflineDatabase();

  return new Promise<TResult>((resolve, reject) => {
    let result: TResult;
    let settled = false;

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(toError(error));
    };

    try {
      const transaction = database.transaction(storeName, mode);
      const request = operation(transaction.objectStore(storeName));

      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => fail(request.error);
      transaction.onerror = () => fail(transaction.error);
      transaction.onabort = () => fail(transaction.error);
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
    } catch (error) {
      fail(error);
    }
  });
}

export function saveRecord<T extends object>(
  storeName: OfflineStoreName,
  record: T
): Promise<void> {
  return runRequest(storeName, 'readwrite', (store) => {
    return store.put(record);
  }).then(() => undefined);
}

export function getRecord<T>(
  storeName: OfflineStoreName,
  key: IDBValidKey
): Promise<T | undefined> {
  return runRequest<T | undefined>(storeName, 'readonly', (store) => store.get(key));
}

export function getAllRecords<T>(storeName: OfflineStoreName): Promise<T[]> {
  return runRequest<T[]>(storeName, 'readonly', (store) => store.getAll());
}

export function deleteRecord(
  storeName: OfflineStoreName,
  key: IDBValidKey
): Promise<void> {
  return runRequest(storeName, 'readwrite', (store) => store.delete(key)).then(() => undefined);
}

export function clearStore(storeName: OfflineStoreName): Promise<void> {
  return runRequest(storeName, 'readwrite', (store) => store.clear()).then(() => undefined);
}

export function saveOutboxItem(item: OutboxItem): Promise<void> {
  return saveRecord(OFFLINE_STORES.outbox, item);
}

export function getOutboxItem(localOperationId: string): Promise<OutboxItem | undefined> {
  return getRecord<OutboxItem>(OFFLINE_STORES.outbox, localOperationId);
}

export function getAllOutboxItems(): Promise<OutboxItem[]> {
  return getAllRecords<OutboxItem>(OFFLINE_STORES.outbox);
}
