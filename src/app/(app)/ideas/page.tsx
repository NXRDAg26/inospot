import Link from 'next/link';
import { IdeaRow } from '@/components/Bits';
import { MobileTop } from '@/components/Nav';
import { getScan, pickOfDay, ranked } from '@/lib/data';
import type { RankedIdea } from '@/lib/types';

const FILTERS: Record<string, (o: RankedIdea) => boolean> = {
  All: () => true,
  UK: (o) => o.market === 'UK',
  US: (o) => o.market === 'US',
  Strong: (o) => o.rating === 'Strong',
  Watch: (o) => o.rating === 'Watch',
  Avoid: (o) => o.rating === 'Avoid',
};

const fill = (r: string) => (r === 'Strong' ? 'var(--gain)' : r === 'Avoid' ? 'var(--loss)' : 'var(--amber)');

function Map({ list, pick }: { list: RankedIdea[]; pick?: string }) {
  const W = 760, H = 380, m = { t: 20, r: 24, b: 44, l: 44 };
  const x = (v: number) => m.l + (v / 100) * (W - m.l - m.r);
  const y = (v: number) => H - m.b - (v / 100) * (H - m.t - m.b);
  const r = (v: number) => 9 + Math.sqrt(Math.max(0, v)) * 3;
  const ticks = [0, 25, 50, 75, 100];
  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Ideas plotted by risk and opportunity">
      <rect x={x(0)} y={y(100)} width={x(50) - x(0)} height={y(50) - y(100)} rx="18" fill="var(--wash)" />
      <text x={x(0) + 16} y={y(100) + 28} fontSize="17" fontWeight="750" fill="var(--ink)">Best of both</text>
      <text x={x(0) + 16} y={y(100) + 50} fontSize="14" fill="var(--slate)">More upside, less risk</text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={m.l - 10} y={y(t) + 4} textAnchor="end" fontSize="14" fill="var(--slate)">{t}</text>
          <text x={x(t)} y={H - m.b + 20} textAnchor="middle" fontSize="14" fill="var(--slate)">{t}</text>
        </g>
      ))}
      <text x={W - m.r} y={H - 6} textAnchor="end" fontSize="12.5" fontWeight="650" fill="var(--slate)">Risk</text>
      <text x={14} y={m.t + 4} fontSize="12.5" fontWeight="650" fill="var(--slate)" transform={`rotate(-90 14 ${m.t + 4})`} textAnchor="end">Opportunity</text>
      {list.map((o) => (
        <a key={o.ticker} href={`/ideas/${encodeURIComponent(o.ticker)}`}>
          <title>{`${o.name}: opportunity ${o.opportunity}, risk ${o.risk}`}</title>
          {o.ticker === pick && <circle cx={x(o.risk)} cy={y(o.opportunity)} r={r(o.ret_base) + 6} fill="none" stroke="var(--cobalt)" strokeWidth="2" />}
          <circle cx={x(o.risk)} cy={y(o.opportunity)} r={r(o.ret_base)} fill={fill(o.rating)} fillOpacity="0.9" />
          <text x={x(o.risk) + r(o.ret_base) + 6} y={y(o.opportunity) + 4.5} fontSize="17" fontWeight="800" fill="var(--ink)">{o.ticker}</text>
        </a>
      ))}
    </svg>
  );
}

export default async function Ideas({ searchParams }: { searchParams: { f?: string } }) {
  const scan = await getScan();
  const list = ranked(scan.opps);
  const pick = pickOfDay(list);
  const f = searchParams.f && FILTERS[searchParams.f] ? searchParams.f : 'All';
  const shown = list.filter(FILTERS[f]);
  return (
    <div className="page">
      <MobileTop />
      <header className="ph">
        <h1>Ideas</h1>
        <p>Everything on the radar, best first. Bigger dots promise a bigger middle-case return.</p>
      </header>
      <Map list={list} pick={pick?.ticker} />
      <section className="block">
        <div className="block-head" style={{ flexWrap: 'wrap' }}>
          <h2>Ranked</h2>
          <div className="seg" role="navigation" aria-label="Filter ideas">
            {Object.keys(FILTERS).map((k) => (
              <Link key={k} href={k === 'All' ? '/ideas' : `/ideas?f=${k}`} aria-current={k === f ? 'true' : undefined} scroll={false}>{k}</Link>
            ))}
          </div>
        </div>
        <div className="rows">
          {shown.length ? shown.map((o) => <IdeaRow key={o.ticker} o={o} />) : <p className="muted" style={{ padding: '18px 0' }}>No ideas match this filter today.</p>}
        </div>
      </section>
    </div>
  );
}
