# StarkShield App

`starkshield-app` is the Next.js frontend for:

- quantum risk visibility for Starknet-held assets
- browser wallet actions via StarkZap (Cartridge / Privy signer / extension read-only mode)
- MCP visibility through a status proxy route

It is designed to keep confidential execution outside the browser:

- browser app: UI + standard wallet transactions
- `starkshield-mcp`: confidential tools, Tongo keys, and AI assistant integration

## Architecture Notes

- **Starknet context:** The app targets Starknet accounts and transaction flows, following Starknet docs terminology and network conventions (`mainnet` / `sepolia`) from [Starknet Documentation](https://docs.starknet.io/).
- **Deterministic scoring:** Quantum scoring comes from `@starkshield/shared` (`assessQuantumRisk`) and does not rely on an LLM.
- **Confidential boundaries:** The frontend intentionally stubs confidential/Tongo runtime imports so secrets and privileged execution stay in MCP.

## Environment

Copy from root `.env.example` and set values:

```bash
# starkshield-app
NEXT_PUBLIC_STARKNET_NETWORK=mainnet
# MCP status proxy target (recommended server-side var)
MCP_STATUS_URL=http://127.0.0.1:8787/status

# optional public fallback
# NEXT_PUBLIC_MCP_STATUS_URL=http://127.0.0.1:8787/status
```

Notes:

- `NEXT_PUBLIC_STARKNET_NETWORK` supports `mainnet` or `sepolia`.
- `/api/mcp-status` reads `MCP_STATUS_URL` first, then `NEXT_PUBLIC_MCP_STATUS_URL`.
- Keep secrets (`STARKNET_PRIVATE_KEY`, Tongo keys, API keys) on MCP/server envs only. Do not expose them with `NEXT_PUBLIC_*`.

## Environment Profiles

- **Local dev**
  - `NEXT_PUBLIC_STARKNET_NETWORK=sepolia` (recommended)
  - `MCP_STATUS_URL=http://127.0.0.1:8787/status`
- **Staging**
  - `NEXT_PUBLIC_STARKNET_NETWORK=sepolia`
  - `MCP_STATUS_URL` points to staging MCP status endpoint behind trusted network policy
- **Production**
  - `NEXT_PUBLIC_STARKNET_NETWORK=mainnet`
  - `MCP_STATUS_URL` points to production MCP status endpoint
  - avoid `NEXT_PUBLIC_MCP_STATUS_URL` unless unavoidable

## Local Development

From this folder:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` marketing/entry page
- `/dashboard` overview (risk + balances)
- `/dashboard/transact` send/swap flows
- `/dashboard/mcp` MCP status + setup snippet + QR
- `/dashboard/learn` educational page + deterministic scanner demo
- `/api/mcp-status` status proxy endpoint

## Wallet Modes

- **Cartridge:** Full browser transaction flow through StarkZap
- **Privy signer:** Requires wallet id, public key, and backend signing URL
- **Extension:** Address/connectivity mode (read-only in this app)

If a transaction-capable wallet is not connected, transact pages remain informational.

## Confidential Execution

The toggle in `/dashboard/transact` marks shielded intent for UX clarity. Actual confidential operations are executed through MCP `confidential_*` tools on the `starkshield-mcp` process.

## Troubleshooting Matrix

| Symptom | Likely Cause | What to Check |
|---|---|---|
| Wallet does not connect | Extension/cartridge modal issue | Browser popups, wallet unlock, supported wallet installed |
| Privy signer fails | Invalid signer URL/public key/network mismatch | Wallet id/public key format, HTTPS endpoint, `NEXT_PUBLIC_STARKNET_NETWORK` |
| Balance is unavailable | RPC timeout or unsupported token | Network selection, RPC health, token support for environment |
| `/dashboard/mcp` shows errors | `MCP_STATUS_URL` missing/unreachable | Server env var, MCP HTTP mode and `/status` route |
| Send/swap fails repeatedly | Invalid input or network liquidity path | Address/symbol/amount validation, retry after timeout |

## Known Intentional Limitations

- Browser app does not execute Tongo confidential operations directly.
- `starkshield-app` status endpoint is a proxy/observer for MCP health, not a full MCP tool execution surface.
- Extension mode in this app is primarily read/connect context and not full signed transaction orchestration.

## Production Security Headers Guidance

Use your hosting layer or Next middleware to apply:

- `Content-Security-Policy` (restrict script/frame/connect origins)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` with least privilege

This project now also sets baseline headers in `next.config.mjs` (CSP, nosniff, referrer-policy, permissions-policy, frame deny). Override CSP with `NEXT_PUBLIC_CSP` when needed for your deployment.

## Quality Gates

```bash
npm run lint
npm run test:run
npm run build
```

Run all three before deploy.
