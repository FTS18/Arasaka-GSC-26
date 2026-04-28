/**
 * 🛰️ Strategy 17: Tactical Sync Queue - High-Reliability Offline Persistence
 * Provides an IndexedDB-backed queue for mission actions performed in dead-zones.
 */

const DB_NAME = 'janrakshak-sync-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-sync';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const queueAction = async (action) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const item = {
            ...action,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        const request = store.add(item);
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const getPendingActions = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const removeAction = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const processSyncQueue = async (apiClient) => {
    const actions = await getPendingActions();
    if (actions.length === 0) return 0;

    let successCount = 0;
    for (const action of actions) {
        try {
            console.log(`🛰️ Attempting to sync action: ${action.type}`, action);
            if (action.type === 'MISSION_CLAIM') {
                await apiClient.post(`/needs/${action.nid}/claim`);
            } else if (action.type === 'MISSION_COMPLETE') {
                await apiClient.post(`/missions/${action.mid}/complete`, action.payload);
            } else if (action.type === 'STATUS_TOGGLE') {
                await apiClient.post(`/volunteers/me/toggle-status`);
            }

            await removeAction(action.id);
            successCount++;
        } catch (err) {
            console.error(`❌ Sync failed for action ${action.id}:`, err);
        }
    }
    return successCount;
};
