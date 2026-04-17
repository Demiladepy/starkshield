import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactPage from "@/app/dashboard/transact/page";

let walletState: {
  wallet: { transfer: ReturnType<typeof vi.fn>; swap: ReturnType<typeof vi.fn> } | null;
  canTransact: boolean;
  network: "mainnet" | "sepolia";
} = {
  wallet: null,
  canTransact: false,
  network: "mainnet",
};

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => walletState,
}));

vi.mock("starkzap", () => ({
  Amount: {
    parse: vi.fn(() => ({ amount: "1" })),
  },
  fromAddress: vi.fn((v: string) => v),
  mainnetTokens: {
    STRK: { symbol: "STRK", address: "0x1", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x2", decimals: 6 },
  },
  sepoliaTokens: {
    STRK: { symbol: "STRK", address: "0x1", decimals: 18 },
    USDC: { symbol: "USDC", address: "0x2", decimals: 6 },
  },
}));

describe("TransactPage validation", () => {
  it("requires recipient for send flow", async () => {
    const transfer = vi.fn();
    walletState = { wallet: { transfer, swap: vi.fn() }, canTransact: true, network: "mainnet" };
    const user = userEvent.setup();

    render(<TransactPage />);
    const amount = screen.getByRole("textbox", { name: /Amount/i });
    await user.type(amount, "1");
    await user.click(screen.getAllByRole("button", { name: "Send" })[1]);

    expect(await screen.findByText("Recipient address is required.")).toBeInTheDocument();
    expect(transfer).not.toHaveBeenCalled();
  });

  it("requires amount for swap flow", async () => {
    const swap = vi.fn();
    walletState = { wallet: { transfer: vi.fn(), swap }, canTransact: true, network: "mainnet" };
    const user = userEvent.setup();

    render(<TransactPage />);
    await user.click(screen.getAllByRole("button", { name: "Swap" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Swap" })[1]);

    expect(await screen.findByText("Amount is required.")).toBeInTheDocument();
    expect(swap).not.toHaveBeenCalled();
  });
});
