import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WalletProvider, useWallet } from "@/context/WalletContext";

const mockConnectWallet = vi.fn();

vi.mock("starkzap", () => {
  class StarkZap {
    connectWallet = mockConnectWallet;
    connectCartridge = vi.fn();
  }

  class PrivySigner {
    constructor() {}
  }

  class AvnuSwapProvider {}

  return {
    StarkZap,
    PrivySigner,
    accountPresets: { argentXV050: "argentXV050" },
    AvnuSwapProvider,
  };
});

vi.mock("@starknet-io/get-starknet", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

function Probe() {
  const w = useWallet();
  return (
    <div>
      <div data-testid="error">{w.error ?? ""}</div>
      <button
        type="button"
        onClick={() =>
          w.connectPrivy({
            walletId: "demo-wallet",
            publicKey: "invalid-public-key",
            serverUrl: "https://signer.example.com/sign",
          })
        }
      >
        Connect invalid key
      </button>
      <button
        type="button"
        onClick={() =>
          w.connectPrivy({
            walletId: "demo-wallet",
            publicKey: "0x" + "a".repeat(64),
            serverUrl: "https://signer.example.com/sign",
          })
        }
      >
        Connect network mismatch
      </button>
    </div>
  );
}

describe("WalletContext Privy validation", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    mockConnectWallet.mockReset();
  });

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  it("rejects invalid public key format before SDK call", async () => {
    const user = userEvent.setup();
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Connect invalid key" }));

    await waitFor(() =>
      expect(screen.getByTestId("error")).toHaveTextContent("Privy public key must be 0x-prefixed hex."),
    );
    expect(mockConnectWallet).not.toHaveBeenCalled();
  });

  it("maps network errors to actionable message", async () => {
    process.env = { ...oldEnv, NEXT_PUBLIC_STARKNET_NETWORK: "sepolia" };
    mockConnectWallet.mockRejectedValueOnce(new Error("network mismatch from signer"));
    const user = userEvent.setup();

    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Connect network mismatch" }));

    await waitFor(() =>
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Privy signer network mismatch. App is using sepolia. Check NEXT_PUBLIC_STARKNET_NETWORK.",
      ),
    );
  });
});
