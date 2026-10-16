import Link from 'next/link';
import { pct, tone } from '@/lib/format';
import type { Insight, InsightRow, MarketTile } from '@/lib/types';
import { InsightIcon } from './Icons';

export const GROUPS = ['Popular', 'Indices', 'Commodities', 'Currencies', 'Bonds', 'Countries', 'Sectors', 'Risers and fallers'] as const;

export function filterMarkets(list: MarketTile[], g: string) {
  if (g === 'Popular') {
    const pop = list.filter((m) => m.popular);
    return [...pop.filter((m) => m.featured), ...pop.filter((m) => !m.featured)];
  }
  if (g === 'Risers and fallers') {
    return [...list].sort((a, b) => Math.abs(b.change_1d ?? 0) - Math.abs(a.change_1d ?? 0)).slice(0, 12);
  }
  return list.filter((m) => m.group === g);
}

export function fmtPrice(v: number | null | undefined, unit = '', decimals = 2, ccy?: string) {
  if (v === null || v === undefined) return '–';
  const n = Number(v).toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const c = ccy ?? unit;
  if (c === '%') return `${n}%`;
  if (c === 'GBp') return `${n}p`;
  if (c === 'TWD') return `NT$${n}`;
  if (c === '$') return `$${n}`;
  return n;
}

export function Spark({ series, up, height = 44, light }: { series: number[]; up: boolean; height?: number; light?: boolean }) {
  if (!series || series.length < 2) return null;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const W = 100;
  const pts = series.map((v, i) => [(i / (series.length - 1)) * W, 2 + (1 - (v - min) / span) * (height - 4)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${line} L${W} ${height} L0 ${height} Z`;
  const col = light ? '#fff' : up ? 'var(--gain)' : 'var(--loss)';
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ height }}>
      <path d={area} fill={col} opacity={light ? 0.16 : 0.1} />
      <path d={line} fill="none" stroke={col} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Chip({ v, light }: { v: number | null | undefined; light?: boolean }) {
  return <span className={`chip ${light ? 'light' : tone(v)}`}>{pct(v, 2)}</span>;
}

export function Tile({ m, featured }: { m: MarketTile; featured?: boolean }) {
  const up = (m.series && m.series.length > 1 ? m.series[m.series.length - 1] >= m.series[0] : (m.change_1m ?? 0) >= 0);
  return (
    <Link href={`/markets/${m.id}`} className={`tile ${featured ? 'feat' : ''}`}>
      <div className="tile-top">
        <div>
          <div className="tile-name">{m.name}</div>
          <div className="tile-sym">{m.symbol}</div>
        </div>
        <Chip v={m.change_1d} light={featured} />
      </div>
      <div className="tile-price num">{fmtPrice(m.price, m.unit, m.decimals)}</div>
      {featured && m.read && <p className="tile-read">{m.read}</p>}
      <div className="tile-foot">
        {m.series ? (
          <Spark series={m.series} up={up} height={featured ? 96 : 40} light={featured} />
        ) : (
          <div className="tile-periods">
            <span>5 days <b className={tone(m.change_5d)}>{pct(m.change_5d, 1)}</b></span>
            <span>1 month <b className={tone(m.change_1m)}>{pct(m.change_1m, 1)}</b></span>
          </div>
        )}
        {m.series && <div className="tile-cap">30 days{!featured && <span className="tile-cap-x">, {pct(m.change_1m, 1)} on the month</span>}</div>}
      </div>
    </Link>
  );
}

export function MarketBoard({ markets, group = 'Popular', limit, hrefFor }: { markets: MarketTile[]; group?: string; limit?: number; hrefFor?: (g: string) => string }) {
  const shown = filterMarkets(markets, group).slice(0, limit ?? 99);
  const feat = group === 'Popular' ? shown.find((m) => m.featured) : shown[0];
  return (
    <div>
      {hrefFor && (
        <div className="pills" role="navigation" aria-label="Market groups">
          {GROUPS.map((g) => (
            <Link key={g} href={hrefFor(g)} aria-current={g === group ? 'true' : undefined} scroll={false}>{g}</Link>
          ))}
        </div>
      )}
      <div className="board">
        {shown.map((m) => <Tile key={m.id} m={m} featured={m === feat} />)}
      </div>
    </div>
  );
}

/* ---------- insights ---------- */

export function fmtValue(ins: Insight, r: InsightRow) {
  if (r.display) return r.display;
  if (ins.format === 'pct') return pct(r.value, 2);
  if (ins.format === 'pct0') return `${Number(r.value).toFixed(1)}%`;
  return Number(r.value).toLocaleString('en-GB');
}

export function SplitBar({ split, labels }: { split: number[]; labels: string[] }) {
  const [l, m, r] = [split[0] || 0, split[1] || 0, split[2] || 0];
  const n = l + m + r || 1;
  const lp = Math.round((l / n) * 100);
  const rp = Math.round((r / n) * 100);
  return (
    <div className="split" role="img" aria-label={`${labels[0]} ${lp}%, ${labels[1]} ${rp}%`}>
      <div className="split-lab"><span className="loss"><em>{labels[0]} </em>{lp}%</span><span className="gain"><em>{labels[1]} </em>{rp}%</span></div>
      <div className="split-bar">
        <i style={{ width: `${(l / n) * 100}%`, background: 'var(--loss)' }} />
        <i style={{ width: `${(m / n) * 100}%`, background: 'var(--line)' }} />
        <i style={{ width: `${(r / n) * 100}%`, background: 'var(--gain)' }} />
      </div>
    </div>
  );
}

export function InsightHero({ ins, i }: { ins: Insight; i: number }) {
  const top = ins.rows.slice(0, 3);
  return (
    <Link href={`/insights/${ins.id}`} className={`ins-hero h${i}`}>
      <span className="ring r1" aria-hidden="true" />
      <span className="ring r2" aria-hidden="true" />
      <span className="ins-ico"><InsightIcon name={ins.icon} /></span>
      <div className="ins-hero-t">{ins.title}</div>
      <ol className="ins-top">
        {top.map((r) => <li key={r.name}><span>{r.ticker ?? r.name}</span><b className="num">{fmtValue(ins, r)}</b></li>)}
      </ol>
    </Link>
  );
}

export function InsightPair({ a, b }: { a: Insight; b: Insight }) {
  return (
    <div className="ins-pair">
      <span className="ins-notch" aria-hidden="true"><InsightIcon name={a.icon} /></span>
      {[a, b].map((x) => (
        <Link key={x.id} href={`/insights/${x.id}`} className="ins-cell">
          <span className="t">{x.title}</span>
          <span className="s">{x.rows[0]?.ticker ?? x.rows[0]?.name} leads, {fmtValue(x, x.rows[0])}</span>
        </Link>
      ))}
    </div>
  );
}

export function InsightTable({ ins }: { ins: Insight }) {
  const max = Math.max(...ins.rows.map((r) => Math.abs(Number(r.value) || 0)), 1);
  const hasSplit = !!ins.split_labels && ins.rows.some((r) => r.split);
  return (
    <div className={`itable ${hasSplit ? '' : 'nosplit'}`}>
      <div className="ihead" aria-hidden="true">
        <span>Instrument</span>
        <span>{ins.measure}</span>
        {hasSplit && <span className="ihead-split"><span>{ins.split_labels![0]}</span><span>{ins.split_labels![1]}</span></span>}
        <span className="r">Daily change</span>
        <span className="r">Price</span>
        <span />
      </div>
      {ins.rows.map((r, i) => {
        const inner = (
          <>
            <span className="iname">
              <span className="irank">{i + 1}</span>
              <span>
                <span className="row-name">{r.name}</span>
                <span className="row-sub">{[r.ticker !== r.name ? r.ticker : null, r.note].filter(Boolean).join(', ')}</span>
              </span>
            </span>
            <span className="ival">
              <b className={`num ${ins.format === 'pct' ? tone(r.value) : ''}`}>{fmtValue(ins, r)}</b>
              <span className="ibar"><i style={{ width: `${(Math.abs(Number(r.value) || 0) / max) * 100}%` }} /></span>
            </span>
            {hasSplit && <span className="isplit">{r.split ? <SplitBar split={r.split} labels={ins.split_labels!} /> : <span className="muted">–</span>}</span>}
            <span className={`ichg num r ${tone(r.change_1d)}`}><span className="ilab">Day </span>{pct(r.change_1d, 2)}</span>
            <span className="iprice num r">{fmtPrice(r.price, r.unit, r.decimals ?? 2, r.ccy)}</span>
            <span className="igo" aria-hidden="true">{r.href ? '›' : ''}</span>
          </>
        );
        return r.href ? (
          <Link key={r.name} href={r.href} className="irow">{inner}</Link>
        ) : (
          <div key={r.name} className="irow">{inner}</div>
        );
      })}
    </div>
  );
}
