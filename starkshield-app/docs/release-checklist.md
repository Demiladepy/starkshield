# StarkShield App Release Checklist

## Pre-Release Validation

- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] `npm run build` passes
- [ ] No `NEXT_PUBLIC_*` variable contains secrets
- [ ] README is current for env vars and troubleshooting guidance

## Manual Smoke

- [ ] Home page loads and links to dashboard
- [ ] Wallet header actions render and respond
- [ ] Dashboard balances either load or show categorized fallback warnings
- [ ] Transact page validates address/symbol/amount correctly
- [ ] Tx lifecycle badge transitions (`Idle`, `Pending`, `Success`/`Error`) behave correctly
- [ ] Explorer link opens expected network transaction page
- [ ] MCP page polls `/api/mcp-status` and copy button works

## Network Matrix

- [ ] Sepolia smoke pass (`NEXT_PUBLIC_STARKNET_NETWORK=sepolia`)
- [ ] Mainnet smoke pass (`NEXT_PUBLIC_STARKNET_NETWORK=mainnet`)

## Security/Operations Review

- [ ] CSP and core response headers configured in hosting stack
- [ ] MCP status URL reachable from app server runtime
- [ ] No sensitive user values are logged without redaction

## Release Sign-Off

- [ ] App folder marked complete
- [ ] MCP work can begin on next branch/phase
