import type { Recipe, RecipeCollection } from "@/src/types/recipe";

export const OFFLINE_RECIPE_SCHEMA_VERSION = 1;

const DATABASE_NAME = "keep-and-cook-offline";
const DATABASE_VERSION = 1;
const SNAPSHOT_STORE = "recipe-snapshots";

export type OfflineRecipeSnapshot = {
  schemaVersion: typeof OFFLINE_RECIPE_SCHEMA_VERSION;
  userId: string;
  recipes: Recipe[];
  collections: RecipeCollection[];
  favoriteRecipeIds: string[];
  cachedAt: string;
};

function openOfflineDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Offline storage could not open."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE, { keyPath: "userId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runSnapshotTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openOfflineDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(SNAPSHOT_STORE, mode);
        const request = operation(transaction.objectStore(SNAPSHOT_STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Offline storage failed."));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error("Offline storage failed."));
        };
      }),
  );
}

export async function saveOfflineRecipeSnapshot(
  snapshot: Omit<OfflineRecipeSnapshot, "schemaVersion" | "cachedAt">,
) {
  const value: OfflineRecipeSnapshot = {
    ...snapshot,
    schemaVersion: OFFLINE_RECIPE_SCHEMA_VERSION,
    cachedAt: new Date().toISOString(),
  };

  await runSnapshotTransaction("readwrite", (store) => store.put(value));
}

export async function getOfflineRecipeSnapshot(userId: string) {
  const snapshot = await runSnapshotTransaction<OfflineRecipeSnapshot | undefined>(
    "readonly",
    (store) => store.get(userId),
  );

  if (!snapshot || snapshot.schemaVersion !== OFFLINE_RECIPE_SCHEMA_VERSION) return null;
  return snapshot;
}

async function clearPrivateServiceWorkerCaches() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: "CLEAR_PRIVATE_CACHES" });
  navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_PRIVATE_CACHES" });
}

export async function clearOfflineRecipeData() {
  if (typeof indexedDB !== "undefined") {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(DATABASE_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }

  await clearPrivateServiceWorkerCaches();
}
