// Invalidations also protect edits, invalid submissions, and unmounts.
export function createRequestGate() {
  let generation = 0;
  return {
    invalidate() { generation += 1; },
    async run<T>(task: () => Promise<T>, success: (value: T) => void, failure: (error: unknown) => void) {
      const current = ++generation;
      try {
        const value = await task();
        if (current === generation) success(value);
      } catch (error) {
        if (current === generation) failure(error);
      }
    },
  };
}
export async function withTimeout<T>(task: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The RPC request timed out. Please try again.')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}
