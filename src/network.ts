import { createClient, defineChain, http } from 'viem';
import { getBalance, getBlockNumber, getChainId } from 'viem/actions';
import type { BalanceReader } from './balance';

// Official sources and decimal distinction are documented in README.md.
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.testnet.arc.io' } },
  testnet: true,
});
export const REQUEST_TIMEOUT_MS = 15_000;
const rpc = createClient({
  chain: arcTestnet,
  transport: http(arcTestnet.rpcUrls.default.http[0], { timeout: REQUEST_TIMEOUT_MS, retryCount: 0 }),
});

export const client: BalanceReader = {
  getChainId: () => getChainId(rpc),
  getBlockNumber: options => getBlockNumber(rpc, options),
  getBalance: options => getBalance(rpc, options),
};
