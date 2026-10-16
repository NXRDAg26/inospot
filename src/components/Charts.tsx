'use client';
import { useMemo, useState } from 'react';

type P = { t: number; c: number };
const RANGES = [
  { k: '1M', d: 31 },
  { k: '3M', d: 92 },
  { k: '6M', d: 183 },
  { k: '1Y', d: 366 },
] as const;

const fmt = (v: number, dp = 2) => v.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
const day = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

export function PriceChart({ points, bench, benchName, currency, source }: { points: P[]; bench?: P[] | null; benchName?: string; currency?: string; source?: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]['k']>('6M');
  const [compare, setCompare] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const view = useMemo(() => {
    const d = RANGES.find((r) => r.k === range)!.d;
    const last = points[points.length - 1]?.t ?? 0;
    const pts = points.filter((p) => p.t >= last - d * 86400000);
    const b = bench?.filter((p) => p.t >= last - d * 86400000) ?? [];
    return { pts, b };
  }, [points, bench, range]);

  const { pts, b } = view;
  if (pts.length < 2) return null;
  const W = 700, H = 240, padT = 14, padB = 22;
  const first = pts[0].c;
  const asPct = compare && b.length > 1;
  const sv = (p: P) => (asPct ? ((p.c - first) / first) * 100 : p.c);
  const bv = (p: P) => ((p.c - b[0].c) / b[0].c) * 100;
  const vals = [...pts.map(sv), ...(asPct ? b.map(bv) : [])];
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
  const x = (t: number) => ((t - t0) / (t1 - t0 || 1)) * W;
  const y = (v: number) => padT + (1 - (v - min) / span) * (H - padT - padB);
  const path = (arr: P[], f: (p: P) => number) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(f(p)).toFixed(1)}`).join(' ');
  const line = path(pts, sv);
  const up = pts[pts.length - 1].c >= first;
  const col = up ? 'var(--gain)' : 'var(--loss)';
  const chg = ((pts[pts.length - 1].c - first) / first) * 100;
  const benchChg = b.length > 1 ? ((b[b.length - 1].c - b[0].c) / b[0].c) * 100 : null;
  const h = hover !== null ? pts[hover] : null;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const tx = t0 + ((e.clientX - r.left) / r.width) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].t - tx) < Math.abs(pts[best].t - tx)) best = i;
    setHover(best);
  }

  return (
    <div className="pchart">
      <div className="pchart-top">
        <div>
          <div className="pchart-v num">{h ? `${currency === '$' ? '$' : ''}${fmt(h.c)}${currency === 'GBp' ? 'p' : ''}` : <span className={chg >= 0 ? 'gain' : 'loss'}>{chg >= 0 ? '+' : '−'}{fmt(Math.abs(chg), 1)}%</span>}</div>
          <div className="pchart-k">{h ? day(h.t) : `Over ${range === '1Y' ? 'the year' : range.replace('M', ' month' + (range === '1M' ? '' : 's'))}${benchChg !== null ? `, ${benchName} ${benchChg >= 0 ? '+' : '−'}${fmt(Math.abs(benchChg), 1)}%` : ''}`}</div>
        </div>
        <div className="seg sm" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r.k} role="tab" aria-selected={r.k === range} onClick={() => setRange(r.k)}>{r.k}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="pchart-svg" preserveAspectRatio="none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={`Price chart, ${range}`}>
        <defs>
          <linearGradient id="pfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={col} stopOpacity="0.18" />
            <stop offset="1" stopColor={col} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={padT + f * (H - padT - padB)} y2={padT + f * (H - padT - padB)} stroke="var(--line)" vectorEffect="non-scaling-stroke" />)}
        {!asPct && <path d={`${line} L${W} ${H - padB} L0 ${H - padB} Z`} fill="url(#pfill)" />}
        {asPct && <path d={path(b, bv)} fill="none" stroke="var(--slate)" strokeWidth="1.6" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        <path d={line} fill="none" stroke={col} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {h && (
          <>
            <line x1={x(h.t)} x2={x(h.t)} y1={padT} y2={H - padB} stroke="var(--ink)" strokeOpacity=".25" vectorEffect="non-scaling-stroke" />
            <circle cx={x(h.t)} cy={y(sv(h))} r="4" fill={col} />
          </>
        )}
        <text x="0" y={H - 4} fontSize="11" fill="var(--slate)">{day(t0)}</text>
        <text x={W} y={H - 4} fontSize="11" fill="var(--slate)" textAnchor="end">{day(t1)}</text>
      </svg>
      <div className="pchart-foot">
        {bench && bench.length > 1 ? (
          <label className="toggle"><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare with {benchName}</label>
        ) : <span />}
        {source && <span className="muted">Prices: {source}</span>}
      </div>
    </div>
  );
}

export function ReturnsBars({ rows, benchName }: { rows: { label: string; stock: number | null; bench: number | null }[]; benchName: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.stock ?? 0), Math.abs(r.bench ?? 0)]));
  const w = (v: number | null) => `${(Math.abs(v ?? 0) / max) * 50}%`;
  const sign = (v: number | null) => (v === null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%`);
  return (
    <div className="rbars">
      <div className="rbars-key"><span><i className="sw stock" />This stock</span><span><i className="sw bench" />{benchName}</span></div>
      {rows.map((r) => (
        <div className="rbar" key={r.label}>
          <span className="rbar-l">{r.label}</span>
          <div className="rbar-track">
            <span className="axis" />
            {r.stock !== null && <i className={`b stock ${r.stock < 0 ? 'neg' : ''}`} style={{ width: w(r.stock), [r.stock < 0 ? 'right' : 'left']: '50%' } as React.CSSProperties} />}
            {r.bench !== null && <i className={`b bench ${r.bench < 0 ? 'neg' : ''}`} style={{ width: w(r.bench), [r.bench < 0 ? 'right' : 'left']: '50%' } as React.CSSProperties} />}
          </div>
          <span className={`rbar-v num ${r.stock === null ? '' : r.stock >= 0 ? 'gain' : 'loss'}`}>{sign(r.stock)}</span>
          <span className="rbar-b muted">{sign(r.bench)}</span>
        </div>
      ))}
    </div>
  );
}
