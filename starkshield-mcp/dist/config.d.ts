export type StarkshieldNetwork = "mainnet" | "sepolia";
export type SignerMode = "privy" | "private_key" | "unconfigured";
export declare function getNetwork(): StarkshieldNetwork;
export declare function getHttpPort(): number | undefined;
export declare function getSignerMode(): SignerMode;
export declare function isConfidentialConfigured(): boolean;
//# sourceMappingURL=config.d.ts.map