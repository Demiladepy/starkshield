"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  StarkZap,
  PrivySigner,
  accountPresets,
  AvnuSwapProvider,
  type WalletInterface,
} from "starkzap";
import { connect, disconnect as disconnectExtension } from "@starknet-io/get-starknet";
import { telemetryError, telemetryInfo } from "@/lib/telemetry";

export type ConnectionMode = "cartridge" | "privy" | "extension" | null;

type NetworkName = "mainnet" | "sepolia";

function envNetwork(): NetworkName {
  return process.env.NEXT_PUBLIC_STARKNET_NETWORK === "sepolia" ? "sepolia" : "mainnet";
}

interface WalletContextValue {
  network: NetworkName;
  sdk: StarkZap;
  wallet: WalletInterface | null;
  extensionAddress: string | null;
  mode: ConnectionMode;
  busy: string | null;
  error: string | null;
  canTransact: boolean;
  displayAddress: string | null;
  connectCartridge: () => Promise<void>;
  connectPrivy: (p: { walletId: string; publicKey: string; serverUrl: string }) => Promise<void>;
  connectExtension: () => Promise<void>;
  disconnectAll: () => Promise<void>;
}

const Ctx = createContext<WalletContextValue | null>(null);

function isHexPublicKey(v: string): boolean {
  return /^0x[0-9a-fA-F]{64,}$/.test(v.trim());
}

function validatePrivyInput(p: { walletId: string; publicKey: string; serverUrl: string }): string | null {
  if (!p.walletId.trim()) return "Privy wallet id is required.";
  if (!isHexPublicKey(p.publicKey)) return "Privy public key must be 0x-prefixed hex.";
  try {
    const u = new URL(p.serverUrl);
    if (!u.protocol.startsWith("http")) return "Privy signer URL must use http or https.";
  } catch {
    return "Privy signer URL is invalid.";
  }
  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const network = envNetwork();
  const sdk = useMemo(() => new StarkZap({ network }), [network]);

  const [wallet, setWallet] = useState<WalletInterface | null>(null);
  const [extensionAddress, setExtensionAddress] = useState<string | null>(null);
  const [mode, setMode] = useState<ConnectionMode>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectCartridge = useCallback(async () => {
    setError(null);
    setBusy("Opening Cartridge…");
    try {
      const w = await sdk.connectCartridge({});
      await w.ensureReady({ deploy: "if_needed" });
      w.registerSwapProvider(new AvnuSwapProvider());
      w.setDefaultSwapProvider("avnu");
      setWallet(w);
      setExtensionAddress(null);
      setMode("cartridge");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      telemetryError("wallet_connect_cartridge_failed", { reason: msg, network });
    } finally {
      setBusy(null);
    }
  }, [sdk, network]);

  const connectPrivy = useCallback(
    async (p: { walletId: string; publicKey: string; serverUrl: string }) => {
      setError(null);
      const inputError = validatePrivyInput(p);
      if (inputError) {
        setError(inputError);
        return;
      }
      setBusy("Connecting Privy signer…");
      try {
        const signer = new PrivySigner({
          walletId: p.walletId.trim(),
          publicKey: p.publicKey.trim(),
          serverUrl: p.serverUrl.trim(),
        });
        const w = await sdk.connectWallet({
          account: { signer, accountClass: accountPresets.argentXV050 },
        });
        await w.ensureReady({ deploy: "if_needed" });
        w.registerSwapProvider(new AvnuSwapProvider());
        w.setDefaultSwapProvider("avnu");
        setWallet(w);
        setExtensionAddress(null);
        setMode("privy");
        telemetryInfo("wallet_connect_privy_ok", { network });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("network")) {
          setError(`Privy signer network mismatch. App is using ${network}. Check NEXT_PUBLIC_STARKNET_NETWORK.`);
        } else {
          setError(msg);
        }
        telemetryError("wallet_connect_privy_failed", { reason: msg, network });
      } finally {
        setBusy(null);
      }
    },
    [sdk, network],
  );

  const connectExtension = useCallback(async () => {
    setError(null);
    setBusy("Extension wallet…");
    try {
      if (wallet) await wallet.disconnect().catch(() => {});
      setWallet(null);
      const sn = await connect({ modalMode: "alwaysAsk" });
      if (!sn) {
        setError("No Starknet wallet selected.");
        return;
      }
      const accounts = await sn.request({ type: "wallet_requestAccounts" });
      if (!accounts.length) {
        setError("Wallet did not return any accounts.");
        return;
      }
      setExtensionAddress(String(accounts[0]));
      setMode("extension");
      telemetryInfo("wallet_connect_extension_ok", { network });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      telemetryError("wallet_connect_extension_failed", { reason: msg, network });
    } finally {
      setBusy(null);
    }
  }, [wallet, network]);

  const disconnectAll = useCallback(async () => {
    setError(null);
    setBusy("Disconnecting…");
    try {
      if (wallet) await wallet.disconnect().catch(() => {});
      if (mode === "extension") await disconnectExtension().catch(() => {});
    } finally {
      setWallet(null);
      setExtensionAddress(null);
      setMode(null);
      setBusy(null);
    }
  }, [wallet, mode]);

  const displayAddress = wallet?.address ?? extensionAddress;
  const canTransact = Boolean(wallet);

  const value = useMemo<WalletContextValue>(
    () => ({
      network,
      sdk,
      wallet,
      extensionAddress,
      mode,
      busy,
      error,
      canTransact,
      displayAddress,
      connectCartridge,
      connectPrivy,
      connectExtension,
      disconnectAll,
    }),
    [
      network,
      sdk,
      wallet,
      extensionAddress,
      mode,
      busy,
      error,
      canTransact,
      displayAddress,
      connectCartridge,
      connectPrivy,
      connectExtension,
      disconnectAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet must be used within WalletProvider");
  return v;
}
