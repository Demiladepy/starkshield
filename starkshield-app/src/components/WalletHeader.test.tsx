import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WalletHeader } from "@/components/WalletHeader";

const wallet = {
  displayAddress: "0x1234",
  mode: "cartridge",
  canTransact: true,
  busy: null,
  error: null,
  connectCartridge: vi.fn(async () => {}),
  connectExtension: vi.fn(async () => {}),
  disconnectAll: vi.fn(async () => {}),
  connectPrivy: vi.fn(async () => {}),
};

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => wallet,
}));

describe("WalletHeader", () => {
  it("renders connected wallet and invokes connection actions", async () => {
    const user = userEvent.setup();
    render(<WalletHeader />);

    expect(screen.getByText("0x1234")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cartridge" }));
    await user.click(screen.getByRole("button", { name: "Extension" }));
    await user.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(wallet.connectCartridge).toHaveBeenCalledTimes(1);
    expect(wallet.connectExtension).toHaveBeenCalledTimes(1);
    expect(wallet.disconnectAll).toHaveBeenCalledTimes(1);
  });

  it("sends privy form values to connectPrivy", async () => {
    const user = userEvent.setup();
    render(<WalletHeader />);

    await user.type(screen.getByPlaceholderText("wallet id (required)"), "wallet-1");
    await user.type(screen.getByPlaceholderText("public key hex, e.g. 0x04ab..."), "0xabc123");
    await user.type(screen.getByPlaceholderText("sign URL, e.g. https://api.example.com/wallet/sign"), "https://sign");
    await user.click(screen.getByRole("button", { name: "Connect Privy signer" }));

    expect(wallet.connectPrivy).toHaveBeenCalledWith({
      walletId: "wallet-1",
      publicKey: "0xabc123",
      serverUrl: "https://sign",
    });
  });
});
