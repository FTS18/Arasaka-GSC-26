const QUEUE_KEY = "janrakshak_offline_queue";

export const offlineQueue = {
    get: () => JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"),

    add: (type, data) => {
        const queue = offlineQueue.get();
        queue.push({
            id: Date.now(),
            type,
            data,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    },

    remove: (id) => {
        const queue = offlineQueue.get().filter(item => item.id !== id);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    },

    clear: () => localStorage.removeItem(QUEUE_KEY),

    size: () => offlineQueue.get().length
};

export const syncOfflineData = async (apiFuncs) => {
    const queue = offlineQueue.get();
    if (queue.length === 0) return 0;

    let successCount = 0;
    for (const item of queue) {
        try {
            if (apiFuncs[item.type]) {
                await apiFuncs[item.type](item.data);
                offlineQueue.remove(item.id);
                successCount++;
            }
        } catch (err) {
            console.error(`Failed to sync item ${item.id}:`, err);
        }
    }
    return successCount;
};
