# Arc Wallet Inspector

A small, read-only, open-source portfolio app for inspecting public EVM addresses on **Arc Testnet**. Built with React, TypeScript, Vite, viem, and plain CSS. No wallet connection, signing, transactions, private keys, or API secrets.

## Setup

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

In GitHub Codespaces, start Vite with:

```sh
npm run dev -- --host 0.0.0.0
```

Open the forwarded port 5173 from the Codespaces Ports tab.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Vite development server |
| `npm run build` | Typecheck and produce `dist/` |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint, including React Hooks rules |
| `npm test` | Run deterministic Vitest tests |

GitHub Actions runs typecheck, lint, tests, and production build after `npm ci`. The lockfile is included. A scoped npm override updates the lint parser’s transitive `minimatch` dependency to the patched 11.x release; lint and typecheck validate this combination.

## Verified network configuration

Settings checked against official Arc documentation on November 14, 2026. The supplied `https://docs.arc.network` redirects to `https://docs.arc.io`.

| Setting | Value |
| --- | --- |
| Network | Arc Testnet |
| RPC | `https://rpc.testnet.arc.io` |
| Chain ID | `5042002` |
| Explorer | `https://explorer.testnet.arc.io` |
| Native currency | USDC |
| Native balance decimals | 18 |

Official sources:

- [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc): testnet RPC, chain ID, explorer, currency and native decimals.
- [Contract addresses](https://docs.arc.io/arc/references/contract-addresses): native USDC uses 18 decimals; optional ERC-20 USDC interface uses 6.
- [EVM differences](https://docs.arc.io/arc/references/evm-differences): native and ERC-20 interfaces share one underlying balance; the ERC-20 view can truncate native precision.

The app uses viem `getBalance` (`eth_getBalance`), **not** ERC-20 `balanceOf`. Raw native bigint values are formatted with 18 decimals using `formatUnits`; no balance is converted to JavaScript `Number`, rounded, or truncated. Trailing fractional zeros are omitted. Do not apply ERC-20's 6 decimals to this data or add these two views together.

## How it works

Input is trimmed and validated before any RPC request. Lowercase or uppercase EVM addresses are accepted; mixed-case addresses must have a valid checksum. Results display a checksummed address.

For each inspection, the app verifies `eth_chainId`, obtains an uncached block number, then passes that exact number to the native balance request. The displayed block therefore matches the balance query. Refresh repeats this sequence. A generation gate prevents older successes and failures from overwriting newer searches, including when input changes. Copy results are also guarded against address changes.

`src/network.ts` owns the network configuration. `src/balance.ts` owns validation, formatting, and snapshot reads. `src/requests.ts` owns stale-response protection and the overall timeout. `src/App.tsx` implements the interface. Tests cover validation/checksums, exact bigint formatting, block consistency, wrong chains, stale successes/errors, and timeouts.

## Privacy and limitations

Checking an address sends it directly from the browser to the public RPC provider configured in `src/network.ts`. The provider can observe the address and connection metadata, including your IP address. Explorer links open an external service. The app has no backend, analytics, or persistent address storage.

Balances are testnet snapshots, not fiat valuations. Testnet USDC has no monetary value. Public RPC availability, rate limits, CORS support, and historical block availability can affect reads. Each inspection has a 15-second overall deadline; transport retries are disabled. Expired or superseded requests may finish in the background but cannot update the UI. Clipboard access depends on browser permissions and a secure context; a failure leaves the address selectable for manual copying.

Tests mock RPC responses and do not establish live connectivity. A real read-only RPC check on November 14, 2026 succeeded: `eth_chainId` returned `0x4cef52` (5042002), `eth_blockNumber` returned `0x44ff786` (72349574), and `eth_getBalance` for the zero address at that exact block returned `0x2cb8a23b6efcff6da1dbc1c`. This verifies endpoint reads from the development environment, not browser CORS or clipboard behavior. No live values are embedded in the application.

## Implementation verification

- **User-reported browser checks.** Valid address lookup, invalid-address errors, Copy, Refresh, and explorer links passed.
- **Local checks run during the AI-assisted commit review.** Typecheck, lint, unit tests, production build, and the Git whitespace check passed.

## AI-assisted development

This first version was implemented with AI coding assistance. Network configuration was checked against the linked official sources. Automated checks support review but do not replace human review or a real-browser check against Arc Testnet.
