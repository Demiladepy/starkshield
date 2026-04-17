# starkshield-mcp

Starkzap-powered [Model Context Protocol](https://modelcontextprotocol.io) server: Starknet wallet operations, deterministic quantum risk scanning, Vesu lending, staking, swaps (AVNU), and Tongo confidential transfers.

## Install

```bash
npm install -g starkshield-mcp
```

Or run from source:

```bash
cd starkshield-mcp
npm install
npm run build
node dist/index.js
```

## Configure

See repository root `.env.example` (or set variables in your MCP host).

- **Dev signer:** `STARKNET_PRIVATE_KEY`
- **Privy:** `PRIVY_WALLET_ID`, `PRIVY_PUBLIC_KEY`, `PRIVY_SIGN_URL`
- **Network:** `STARKNET_NETWORK=mainnet|sepolia`
- **Paymaster (optional):** `AVNU_API_KEY`
- **Tongo (optional):** `TONGO_PRIVATE_KEY`, `TONGO_CONTRACT`
- **Automation (dangerous):** `STARKSHIELD_AUTO_CONFIRM=1` skips preview/confirm for destructive tools
- **HTTP transport (optional):** `STARKSHIELD_HTTP_PORT=8787` — serves MCP on `POST /mcp` and `GET /status`

## Claude Desktop

```json
{
  "mcpServers": {
    "starkshield": {
      "command": "npx",
      "args": ["-y", "starkshield-mcp"],
      "env": {
        "STARKNET_NETWORK": "mainnet",
        "STARKNET_PRIVATE_KEY": "0x..."
      }
    }
  }
}
```

## Quantum safety

`quantum_risk_scan` combines **fixed cryptographic architecture facts** (no LLM inference inside the tool) with **optional Starknet JSON-RPC checks** (contract deployment, address nonce). The assistant should explain the structured JSON, not invent new risk levels.

## License

MIT
