import { formatUnits, getAddress, isAddress, type Address } from 'viem';
import { arcTestnet } from './network';

export function parseAddress(input: string): Address {
  const value = input.trim();
  const hex = value.slice(2);
  const strict = hex !== hex.toUpperCase();
  if (!isAddress(value, { strict })) throw new Error('Enter a valid EVM address (0x followed by 40 hexadecimal characters). Check mixed-case checksums.');
  return getAddress(value);
}

export function formatBalance(balance: bigint): string {
  return formatUnits(balance, arcTestnet.nativeCurrency.decimals);
}

export interface BalanceReader {
  getChainId(): Promise<number>;
  getBlockNumber(options: { cacheTime: number }): Promise<bigint>;
  getBalance(options: { address: Address; blockNumber: bigint }): Promise<bigint>;
}
export interface Snapshot { address: Address; blockNumber: bigint; balance: bigint }

export async function readSnapshot(reader: BalanceReader, input: string): Promise<Snapshot> {
  const address = parseAddress(input);
  if (await reader.getChainId() !== arcTestnet.id) throw new Error('The RPC returned a different network. Please try again later.');
  const blockNumber = await reader.getBlockNumber({ cacheTime: 0 });
  const balance = await reader.getBalance({ address, blockNumber });
  return { address, blockNumber, balance };
}
