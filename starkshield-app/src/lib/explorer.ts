export type ExplorerNetwork = "mainnet" | "sepolia";

export function txExplorerUrl(network: ExplorerNetwork, txHash: string): string {
  const base =
    network === "mainnet"
      ? "https://starkscan.co/tx"
      : "https://sepolia.starkscan.co/tx";
  return `${base}/${txHash}`;
}
