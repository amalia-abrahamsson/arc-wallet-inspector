import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatBalance, parseAddress, readSnapshot, type Snapshot } from './balance';
import { arcTestnet, client, REQUEST_TIMEOUT_MS } from './network';
import { createRequestGate, withTimeout } from './requests';

export default function App() {
  const [input, setInput] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const gate = useRef(createRequestGate());
  const copyGeneration = useRef(0);
  useEffect(() => {
    const requests = gate.current;
    return () => { requests.invalidate(); copyGeneration.current += 1; };
  }, []);

  function reset() {
    gate.current.invalidate();
    copyGeneration.current += 1;
    setSnapshot(null); setError(''); setInvalid(false); setCopyStatus(''); setLoading(false);
  }
  function inspect(value: string) {
    reset();
    try { parseAddress(value); } catch (cause) {
      setInvalid(true); setError((cause as Error).message); return;
    }
    setLoading(true);
    void gate.current.run(
      () => withTimeout(readSnapshot(client, value), REQUEST_TIMEOUT_MS),
      result => { setSnapshot(result); setLoading(false); },
      cause => {
        const timedOut = cause instanceof Error && /timed out|timeout/i.test(cause.message);
        setError(timedOut ? 'The RPC request timed out. Please try again.' : 'Unable to read Arc Testnet. The RPC may be unavailable or rate-limited. Please try again.');
        setLoading(false);
      },
    );
  }
  function submit(event: FormEvent) { event.preventDefault(); inspect(input); }
  async function copy() {
    if (!snapshot) return;
    const current = ++copyGeneration.current;
    try {
      await navigator.clipboard.writeText(snapshot.address);
      if (current === copyGeneration.current) setCopyStatus('Address copied.');
    } catch {
      if (current === copyGeneration.current) setCopyStatus('Could not copy. Select and copy the address manually.');
    }
  }

  return <div className="shell">
    <header><a className="brand" href="./" aria-label="Arc Wallet Inspector home"><span className="brand-mark" aria-hidden="true">a</span> Arc <span className="brand-detail">/ Wallet Inspector</span></a><span className="network">Arc Testnet</span></header>
    <main>
      <div className="intro"><p className="eyebrow">PUBLIC ADDRESS EXPLORER</p><h1>A clearer view<br/>of your wallet.</h1><p className="lead">Inspect native USDC on Arc Testnet.<br/>One address. One block. A precise balance.</p></div>
      <section className="panel" aria-labelledby="inspect-heading">
        <div className="panel-heading"><h2 id="inspect-heading">Inspect an address</h2><span className="read-only">Read-only</span></div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="address">Public wallet address</label>
          <div className="input-row"><input id="address" name="address" value={input} onChange={event => { reset(); setInput(event.target.value); }} placeholder="0x…" autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={invalid} aria-describedby={`privacy${invalid ? ' request-error' : ''}`}/><button type="submit">{loading ? 'Inspect again' : 'Inspect'} <span aria-hidden="true">↗</span></button></div>
          <p id="privacy" className="hint">Checking an address sends it to the configured RPC provider at <span>{arcTestnet.rpcUrls.default.http[0]}</span>.</p>
        </form>
        <div aria-live="polite" role="status">{loading && <p className="loading">Reading Arc Testnet… Fetching a block and its balance.</p>}</div>
        {error && <p id="request-error" className="error" role="alert">{error}</p>}
        {snapshot ? <div className="result">
          <p className="eyebrow">NATIVE USDC BALANCE</p><div className="balance">{formatBalance(snapshot.balance)} <span>USDC</span></div>
          {snapshot.balance === 0n && <p className="hint">This address has zero native USDC at this block.</p>}
          <dl><div><dt>Checksummed address</dt><dd className="address">{snapshot.address}</dd></div><div className="metadata"><div><dt>Network</dt><dd>{arcTestnet.name}</dd></div><div><dt>Block used</dt><dd>{snapshot.blockNumber.toString()}</dd></div></div></dl>
          <div className="actions"><button className="secondary" onClick={() => void copy()}>Copy address</button><button className="secondary" onClick={() => inspect(snapshot.address)}>Refresh</button><a href={`${arcTestnet.blockExplorers.default.url}/address/${snapshot.address}`} target="_blank" rel="noreferrer">View in explorer ↗</a></div>
          <p className="hint" role="status">{copyStatus}</p>
        </div> : !loading && !error && <div className="empty"><span aria-hidden="true">⌕</span><p>Your inspection starts here.</p><p className="hint">Enter a public EVM address to see its balance.</p></div>}
      </section>
      <div className="notes"><div><h3>Precision by default</h3><p>Native balance, read at a specific block. All 18 decimal places preserved when present.</p></div><div><h3>Built for testnet</h3><p>Testnet USDC has no monetary value. Results are a snapshot; refresh for a newer block.</p></div></div>
    </main><footer><span>Arc Wallet Inspector</span><span>Public data. Read-only access.</span></footer>
  </div>;
}
