const BODY = `starknet://quantum/status

Structured timeline (public announcements — verify originals at primary sources):

- 2026-03-30: Google research discussion around fault-tolerant quantum computing timelines (verify via Google Research / Nature coverage).
- 2026-04-08: Osuntokun (Lightning Labs) commentary on Bitcoin quantum migration paths (verify primary blog / mailing list).
- 2026-04-09: StarkWare quantum safety blog / Starknet positioning (verify StarkWare official channels).

StarkShield stance for assistants:
- Use quantum_risk_scan for deterministic chain/wallet-model facts + optional Starknet RPC checks.
- Do not invent numeric qubit thresholds or dates; cite tool output and external sources the user provides.
`;
export function registerQuantumResources(server) {
    server.registerResource("quantum-status", "starknet://quantum/status", {
        title: "Quantum status notes",
        mimeType: "text/plain",
    }, async () => ({
        contents: [
            {
                uri: "starknet://quantum/status",
                mimeType: "text/plain",
                text: BODY,
            },
        ],
    }));
}
//# sourceMappingURL=quantum.js.map