import { StarkZap, PrivySigner, StarkSigner, AvnuSwapProvider, accountPresets, TongoConfidential, fromAddress, } from "starkzap";
import { getNetwork } from "./config.js";
let wallet = null;
let confidential = null;
function paymasterFromEnv() {
    const key = process.env.AVNU_API_KEY;
    if (!key)
        return undefined;
    return {
        nodeUrl: "https://starknet.paymaster.avnu.fi",
        headers: { "x-paymaster-api-key": key },
    };
}
export async function getOrCreateWallet() {
    if (wallet)
        return wallet;
    const network = getNetwork();
    const sdk = new StarkZap({
        network,
        paymaster: paymasterFromEnv(),
    });
    if (process.env.PRIVY_WALLET_ID && process.env.PRIVY_PUBLIC_KEY) {
        const serverUrl = process.env.PRIVY_SIGN_URL;
        if (!serverUrl) {
            throw new Error("PRIVY_SIGN_URL is required when using Privy wallet credentials.");
        }
        const w = await sdk.connectWallet({
            account: {
                signer: new PrivySigner({
                    walletId: process.env.PRIVY_WALLET_ID,
                    publicKey: process.env.PRIVY_PUBLIC_KEY,
                    serverUrl,
                }),
                accountClass: accountPresets.argentXV050,
            },
        });
        wallet = w;
    }
    else if (process.env.STARKNET_PRIVATE_KEY) {
        const w = await sdk.connectWallet({
            account: { signer: new StarkSigner(process.env.STARKNET_PRIVATE_KEY) },
        });
        wallet = w;
    }
    else {
        throw new Error("No wallet credentials configured. Set STARKNET_PRIVATE_KEY or PRIVY_WALLET_ID + PRIVY_PUBLIC_KEY + PRIVY_SIGN_URL.");
    }
    wallet.registerSwapProvider(new AvnuSwapProvider());
    wallet.setDefaultSwapProvider("avnu");
    return wallet;
}
export async function getConfidential() {
    if (confidential)
        return confidential;
    if (!process.env.TONGO_PRIVATE_KEY || !process.env.TONGO_CONTRACT) {
        throw new Error("Confidential transfers require TONGO_PRIVATE_KEY and TONGO_CONTRACT env vars.");
    }
    const w = await getOrCreateWallet();
    confidential = new TongoConfidential({
        privateKey: process.env.TONGO_PRIVATE_KEY,
        contractAddress: fromAddress(process.env.TONGO_CONTRACT),
        provider: w.getProvider(),
    });
    return confidential;
}
export function getReadonlyStarkZap() {
    return new StarkZap({
        network: getNetwork(),
        paymaster: paymasterFromEnv(),
    });
}
//# sourceMappingURL=wallet-manager.js.map