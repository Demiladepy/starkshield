import { randomBytes } from "node:crypto";
const store = new Map();
const TTL_MS = 10 * 60 * 1000;
function cleanup() {
    const now = Date.now();
    for (const [k, v] of store) {
        if (now - v.createdAt > TTL_MS)
            store.delete(k);
    }
}
export function createPreview(kind, payload) {
    cleanup();
    const id = randomBytes(16).toString("hex");
    store.set(id, { kind, payload, createdAt: Date.now() });
    return id;
}
export function consumePreview(id, kind) {
    cleanup();
    const p = store.get(id);
    if (!p || p.kind !== kind)
        return null;
    store.delete(id);
    return p.payload;
}
//# sourceMappingURL=confirmation.js.map