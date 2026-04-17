/**
 * Minimal copy of the MCP SDK example store for Streamable HTTP session resumability.
 */
export class InMemoryEventStore {
    events = new Map();
    generateEventId(streamId) {
        return `${streamId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
    getStreamIdFromEventId(eventId) {
        const parts = eventId.split("_");
        return parts.length > 0 ? parts[0] : "";
    }
    async storeEvent(streamId, message) {
        const eventId = this.generateEventId(streamId);
        this.events.set(eventId, { streamId, message });
        return eventId;
    }
    async getStreamIdForEventId(eventId) {
        return this.events.get(eventId)?.streamId;
    }
    async replayEventsAfter(lastEventId, { send, }) {
        if (!lastEventId || !this.events.has(lastEventId)) {
            return "";
        }
        const streamId = this.getStreamIdFromEventId(lastEventId);
        if (!streamId)
            return "";
        let foundLast = false;
        const sorted = [...this.events.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        for (const [eventId, { streamId: sid, message }] of sorted) {
            if (sid !== streamId)
                continue;
            if (eventId === lastEventId) {
                foundLast = true;
                continue;
            }
            if (foundLast)
                await send(eventId, message);
        }
        return streamId;
    }
}
//# sourceMappingURL=in-memory-event-store.js.map