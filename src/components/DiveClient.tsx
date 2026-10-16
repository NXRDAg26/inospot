'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function DiveRunner({ ticker, pendingId, pendingMode, label = 'Run a deep dive', enabled, note, live }: { ticker: string; pendingId?: number | null; pendingMode?: 'live' | 'request'; label?: string; enabled: boolean; note?: string; live: boolean }) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(pendingId ?? null);
  const [stage, setStage] = useState('');
  const [err, setErr] = useState('');
  const [mode, setMode] = useState<'live' | 'request' | null>(pendingId ? pendingMode ?? 'live' : null);
  const [busy, setBusy] = useState(Boolean(pendingId) && pendingMode !== 'request');

  useEffect(() => {
    if (!id || mode === 'request') return;
    let stop = false;
    const tick = async () => {
      const r = await fetch(`/api/dive/${id}`).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (stop) return;
      if (j.status === 'ready') { setBusy(false); router.refresh(); return; }
      if (j.status === 'failed') { setBusy(false); setErr(j.error || 'The deep dive failed. Try again.'); setId(null); return; }
      setStage(j.stage || 'Working');
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [id, mode, router]);

  async function start() {
    setErr(''); setBusy(true); setStage('Starting');
    const r = await fetch('/api/dive', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ticker }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(false); setErr(j.error || 'Could not start the deep dive.'); return; }
    if (j.mode === 'request') { setBusy(false); setMode('request'); setId(j.id); return; }
    setMode('live'); setId(j.id);
  }

  if (mode === 'request') {
    return (
      <div className="runner">
        <div className="runner-busy" role="status">
          <span className="clock" aria-hidden="true" />
          <div><b>Deep dive requested for {ticker}</b><span className="muted">It will be ready after the next research run, weekdays at 10:52am and 2:52pm. Or ask Claude to run your Inospot deep dive requests now.</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="runner">
      {busy ? (
        <div className="runner-busy" role="status">
          <span className="spinner" aria-hidden="true" />
          <div><b>Researching {ticker}</b><span className="muted">{stage}. This takes one to two minutes; you can leave the page and come back.</span></div>
        </div>
      ) : (
        <button className="btn dive-btn" onClick={start} disabled={!enabled}>{live ? label : label.replace('Run a deep dive', 'Request a deep dive').replace('Refresh deep dive', 'Request a fresh deep dive')}</button>
      )}
      {!enabled && !busy && note && <p className="muted small-note">{note}</p>}
      {err && <p className="err" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  );
}

export function DiveSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      className="dsearch"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim().toUpperCase();
        if (t) router.push(`/research/dive/${encodeURIComponent(t)}`);
      }}
    >
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ticker, e.g. NVDA or BARC.L" aria-label="Ticker to research" autoCapitalize="characters" autoComplete="off" />
      <button className="btn" type="submit">Deep dive</button>
    </form>
  );
}
