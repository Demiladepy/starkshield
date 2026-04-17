import type { EventStore, StreamId, EventId } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
/**
 * Minimal copy of the MCP SDK example store for Streamable HTTP session resumability.
 */
export declare class InMemoryEventStore implements EventStore {
    private readonly events;
    private generateEventId;
    private getStreamIdFromEventId;
    storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId>;
    getStreamIdForEventId(eventId: EventId): Promise<StreamId | undefined>;
    replayEventsAfter(lastEventId: EventId, { send, }: {
        send: (eventId: EventId, message: JSONRPCMessage) => Promise<void>;
    }): Promise<StreamId>;
}
//# sourceMappingURL=in-memory-event-store.d.ts.map