import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({
    displayAddress: "0xabc",
    network: "mainnet",
    canTransact: true,
  }),
}));

vi.mock("@/lib/quantum", () => ({
  assessQuantumRisk: () => ({
    overallRisk: "LOW",
    proofSystem: "STARK",
    signatureUpgradable: true,
    hashFunction: "Poseidon",
  }),
}));

vi.mock("@/lib/readErc20Balance", () => ({
  readErc20BalanceSafe: vi
    .fn()
    .mockResolvedValueOnce({ balance: "1 STRK", errorKind: null })
    .mockResolvedValueOnce({ balance: null, errorKind: "timeout" })
    .mockResolvedValueOnce({ balance: "3 ETH", errorKind: null })
    .mockResolvedValueOnce({ balance: null, errorKind: "unsupported_token" }),
}));

describe("DashboardPage", () => {
  it("renders categorized balance failure warnings", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Balance unavailable for/)).toBeInTheDocument();
    });

    expect(screen.getByText(/USDC \(timeout\)/)).toBeInTheDocument();
    expect(screen.getByText(/WBTC \(unsupported_token\)/)).toBeInTheDocument();
  });
});
