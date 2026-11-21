import { expect, it, vi } from 'vitest';
import { createRequestGate, withTimeout } from './requests';
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
it('ignores an older success after a newer search succeeds', async () => {
  const gate = createRequestGate(); const old = deferred<string>(); const next = deferred<string>();
  const success = vi.fn(); const failure = vi.fn();
  const first = gate.run(() => old.promise, success, failure);
  const second = gate.run(() => next.promise, success, failure);
  next.resolve('new'); await second; old.resolve('old'); await first;
  expect(success.mock.calls).toEqual([['new']]); expect(failure).not.toHaveBeenCalled();
});
it('ignores stale failures and invalidates pending requests on edits or unmount', async () => {
  const gate = createRequestGate(); const old = deferred<string>(); const success = vi.fn(); const failure = vi.fn();
  const first = gate.run(() => old.promise, success, failure);
  gate.invalidate(); old.reject(new Error('offline')); await first;
  expect(success).not.toHaveBeenCalled(); expect(failure).not.toHaveBeenCalled();
});
it('reports the current failure', async () => {
  const failure = vi.fn(); const error = new Error('offline');
  await createRequestGate().run(() => Promise.reject(error), vi.fn(), failure);
  expect(failure).toHaveBeenCalledWith(error);
});
it('times out and clears its timer', async () => {
  vi.useFakeTimers();
  try {
    const pending = withTimeout(new Promise<never>(() => {}), 15000);
    const assertion = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15000); await assertion;
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});
