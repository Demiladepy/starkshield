export type PendingKind = "swap_execute" | "transfer_send" | "transfer_batch" | "lending_deposit" | "lending_borrow" | "lending_repay" | "lending_withdraw" | "staking_enter" | "staking_claim" | "staking_exit_intent" | "staking_exit" | "confidential_fund" | "confidential_send" | "confidential_withdraw";
export declare function createPreview(kind: PendingKind, payload: unknown): string;
export declare function consumePreview<T>(id: string, kind: PendingKind): T | null;
//# sourceMappingURL=confirmation.d.ts.map