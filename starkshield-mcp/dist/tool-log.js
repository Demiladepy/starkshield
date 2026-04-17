const ring = [];
const MAX = 50;
export function logToolCall(tool, summary) {
    ring.unshift({ ts: new Date().toISOString(), tool, summary });
    if (ring.length > MAX)
        ring.length = MAX;
}
export function getRecentToolCalls() {
    return [...ring];
}
export const ADVERTISED_TOOLS = [
    "wallet_create",
    "wallet_balance",
    "wallet_address",
    "transfer_send",
    "transfer_batch",
    "swap_quote",
    "swap_execute",
    "lending_markets",
    "lending_position",
    "lending_health",
    "lending_deposit",
    "lending_borrow",
    "lending_repay",
    "lending_simulate",
    "staking_pools",
    "staking_enter",
    "staking_claim",
    "confidential_balance",
    "confidential_fund",
    "confidential_send",
    "confidential_withdraw",
    "quantum_risk_scan",
    "quantum_report",
];
//# sourceMappingURL=tool-log.js.map