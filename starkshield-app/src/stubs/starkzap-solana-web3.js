export async function loadSolanaWeb3(feature) {
  throw new Error(
    `[starkzap] ${feature}: @solana/web3.js is omitted from the StarkShield web bundle.`,
  );
}
