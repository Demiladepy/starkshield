export interface ToolCallLogEntry {
    ts: string;
    tool: string;
    summary: string;
}
export declare function logToolCall(tool: string, summary: string): void;
export declare function getRecentToolCalls(): ToolCallLogEntry[];
export declare const ADVERTISED_TOOLS: string[];
//# sourceMappingURL=tool-log.d.ts.map