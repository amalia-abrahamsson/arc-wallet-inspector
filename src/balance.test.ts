import { describe, expect, it, vi } from 'vitest';
import { formatBalance, parseAddress, readSnapshot } from './balance';
const address = '0x52908400098527886E0F7030069857D2E4169EE7';
describe('address validation', () => {
  it('normalizes whitespace and lowercase to checksum', () => {
    expect(parseAddress(` ${address.toLowerCase()} `)).toBe(address);
    expect(parseAddress(address)).toBe(address);
  });
  it('normalizes an uppercase address without a checksum', () => {
    expect(parseAddress('0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF')).toBe(
      '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
    );
  });
  it.each(['', '0x123', '0x' + 'z'.repeat(40), '52908400098527886E0F7030069857D2E4169EE7', '0x52908400098527886E0F7030069857D2E4169Ee7'])('rejects invalid input %s', input => {
    expect(() => parseAddress(input)).toThrow();
  });
});
describe('native USDC formatting', () => {
  it.each([[0n, '0'], [1n, '0.000000000000000001'], [10n ** 18n, '1'], [1234567890123456789n, '1.234567890123456789'], [123456789012345678901234567890n, '123456789012.34567890123456789']])('formats %s without losing precision', (raw, expected) => {
    expect(formatBalance(raw as bigint)).toBe(expected);
  });
});
describe('RPC snapshot', () => {
  function reader() { return { getChainId: vi.fn().mockResolvedValue(5042002), getBlockNumber: vi.fn().mockResolvedValue(123n), getBalance: vi.fn().mockResolvedValue(1n) }; }
  it('passes the exact fetched block to the native balance query', async () => {
    const rpc = reader();
    expect(await readSnapshot(rpc, address)).toEqual({ address, blockNumber: 123n, balance: 1n });
    expect(rpc.getBlockNumber).toHaveBeenCalledWith({ cacheTime: 0 });
    expect(rpc.getBalance).toHaveBeenCalledWith({ address, blockNumber: 123n });
  });
  it('makes no RPC calls for invalid input', async () => {
    const rpc = reader();
    await expect(readSnapshot(rpc, 'invalid')).rejects.toThrow();
    expect(rpc.getChainId).not.toHaveBeenCalled();
  });
  it('rejects a different chain before querying a balance', async () => {
    const rpc = reader(); rpc.getChainId.mockResolvedValue(1);
    await expect(readSnapshot(rpc, address)).rejects.toThrow('different network');
    expect(rpc.getBalance).not.toHaveBeenCalled();
  });
});
