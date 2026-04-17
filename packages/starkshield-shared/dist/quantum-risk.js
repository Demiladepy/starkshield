const STARKNET_FACTS = {
    proofSystem: "ZK-STARK",
    proofReasoning: "STARKs use collision-resistant hash functions (Poseidon). Grover's algorithm provides only quadratic speedup against hash functions, requiring doubling hash output size (e.g., 256-bit → still 128-bit quantum security). No trusted setup. No elliptic curve assumptions for soundness of the proof layer.",
    signatureNote: "Current Stark curve signatures are not quantum-resistant against Shor (ECDLP). Starknet account abstraction allows upgrading signature validation to post-quantum schemes without moving funds.",
    accountAbstraction: "Starknet wallets are smart contracts; signature validation logic can be upgraded by the owner without a consensus fork.",
};
const BITCOIN_FACTS = {
    signatureNote: "ECDSA over secp256k1 is vulnerable to Shor when sufficiently large fault-tolerant quantum computers exist; timelines in the literature vary and are not predicted here.",
    exposedKeyRisk: "Some UTXO models expose public keys before spends (e.g., certain P2PK / reuse patterns). Quantifying exposure for an arbitrary address requires a Bitcoin indexer, not Starknet RPC.",
};
export function assessQuantumRisk(assetSymbol, chain, walletType, onChain) {
    const factors = [];
    let overallRisk = "LOW";
    if (chain === "starknet") {
        factors.push(`Proof system: ZK-STARK — ${STARKNET_FACTS.proofReasoning}`);
        factors.push(`Signature: ${STARKNET_FACTS.signatureNote}`);
        factors.push(`Account abstraction: ${STARKNET_FACTS.accountAbstraction}`);
        if (onChain?.starknetTokenContractFound === false) {
            factors.push("On-chain check: provided token contract address has no class hash on this Starknet network (asset may be misconfigured or not deployed here).");
            overallRisk = "HIGH";
        }
        else if (onChain?.starknetTokenContractFound === true) {
            factors.push("On-chain check: token contract exists on Starknet (deployment/class present via RPC).");
        }
        let exposed = "unknown";
        if (onChain?.starknetAddressHasNonce === true) {
            factors.push("On-chain check: Starknet address has a nonce (account has executed transactions). This does not, by itself, equal 'ECDSA public key exposed on-chain' in the Bitcoin sense; Starknet uses account contracts.");
            exposed = false;
        }
        else if (onChain?.starknetAddressHasNonce === false) {
            factors.push("On-chain check: Starknet address nonce is zero (no executed transactions from this address on this network).");
            exposed = false;
        }
        if (walletType === "account_abstraction") {
            if (overallRisk !== "HIGH")
                overallRisk = "LOW";
            factors.push("Wallet model treated as account abstraction: in-place signature policy upgrades are architecturally supported for typical Starknet AA accounts.");
        }
        else {
            overallRisk = overallRisk === "HIGH" ? "HIGH" : "MEDIUM";
            factors.push("Wallet model treated as non–account-abstraction for this scan: do not assume in-place signature upgrades.");
        }
        return {
            asset: assetSymbol,
            chain: "Starknet",
            proofSystem: "ZK-STARK",
            proofQuantumResistant: true,
            signatureScheme: "ECDSA (Stark curve) / account validation policy",
            signatureUpgradable: walletType === "account_abstraction",
            walletType,
            hashFunction: "Poseidon (network migration away from Pedersen continues)",
            hashQuantumResistant: true,
            exposedPublicKeys: exposed,
            overallRisk,
            factors,
            onChain,
        };
    }
    if (chain === "bitcoin") {
        factors.push(`Signature: ${BITCOIN_FACTS.signatureNote}`);
        factors.push(`Exposed key note: ${BITCOIN_FACTS.exposedKeyRisk}`);
        if (walletType === "p2pkh" || walletType === "p2tr") {
            overallRisk = "HIGH";
            factors.push("Wallet/output model can expose public key material depending on spend patterns; this scanner does not substitute for a Bitcoin-chain indexer.");
        }
        return {
            asset: assetSymbol,
            chain: "Bitcoin",
            proofSystem: "Proof of Work (SHA-256)",
            proofQuantumResistant: true,
            signatureScheme: "ECDSA (secp256k1)",
            signatureUpgradable: false,
            walletType,
            hashFunction: "SHA-256 / RIPEMD-160 (address hashing layer)",
            hashQuantumResistant: true,
            exposedPublicKeys: "unknown",
            overallRisk,
            factors,
            onChain,
        };
    }
    overallRisk = walletType === "eoa" ? "HIGH" : "MEDIUM";
    factors.push("Ethereum EOAs commonly use ECDSA (secp256k1) for authorization; this is not quantum-safe against Shor at scale.");
    factors.push("EOAs cannot upgrade signature validation in place; migration requires new accounts/contracts and fund movement.");
    return {
        asset: assetSymbol,
        chain: "Ethereum L1",
        proofSystem: "N/A (not a STARK-secured rollup execution trace for L1 consensus)",
        proofQuantumResistant: false,
        signatureScheme: "ECDSA (secp256k1)",
        signatureUpgradable: walletType !== "eoa",
        walletType,
        hashFunction: "Keccak-256 (EVM state hashing layer)",
        hashQuantumResistant: true,
        exposedPublicKeys: "unknown",
        overallRisk,
        factors,
        onChain,
    };
}
