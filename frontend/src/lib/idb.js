import { openDB } from 'idb';

const DB_NAME = 'janrakshak-ops';
const STORE_NAME = 'offline-requests';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const queueRequest = async (url, method, body) => {
    const db = await initDB();
    return db.add(STORE_NAME, {
        url,
        method,
        body,
        timestamp: Date.now(),
    });
};

export const getQueuedRequests = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const clearQueuedRequests = async () => {
    const db = await initDB();
    return db.clear(STORE_NAME);
};
