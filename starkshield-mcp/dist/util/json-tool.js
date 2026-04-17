export function jsonToolResult(data) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2),
            },
        ],
    };
}
//# sourceMappingURL=json-tool.js.map