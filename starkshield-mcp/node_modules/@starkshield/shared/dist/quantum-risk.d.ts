export type QuantumChain = "starknet" | "bitcoin" | "ethereum";
export type QuantumWalletType = "account_abstraction" | "eoa" | "p2pkh" | "p2tr";
export interface QuantumRiskResult {
    asset: string;
    chain: string;
    proofSystem: string;
    proofQuantumResistant: boolean;
    signatureScheme: string;
    signatureUpgradable: boolean;
    walletType: QuantumWalletType;
    hashFunction: string;
    hashQuantumResistant: boolean;
    /** When unknown without chain-specific indexers, omitted or false with explanation in factors. */
    exposedPublicKeys?: boolean | "unknown";
    overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    factors: string[];
    /** Deterministic on-chain or config-driven checks only — never model inference. */
    onChain?: {
        starknetTokenContractFound?: boolean | null;
        starknetAddressHasNonce?: boolean | null;
    };
}
export declare function assessQuantumRisk(assetSymbol: string, chain: QuantumChain, walletType: QuantumWalletType, onChain?: QuantumRiskResult["onChain"]): QuantumRiskResult;
//# sourceMappingURL=quantum-risk.d.ts.map