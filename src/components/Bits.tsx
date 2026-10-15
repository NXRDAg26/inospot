import Link from 'next/link';
import { pct, tone } from '@/lib/format';
import type { RankedIdea } from '@/lib/types';

export function Mono({ ticker, rating }: { ticker: string; rating?: string }) {
  return <span className={`mono ${rating ?? ''}`} aria-hidden="true">{ticker.slice(0, 4)}</span>;
}

const LO = -50;
const HI = 40;
const x = (v: number) => `${((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * 100}%`;

export function Range({ bear, base, bull, light }: { bear: number; base: number; bull: number; light?: boolean }) {
  return (
    <div>
      <div className="range" role="img" aria-label={`Bad case ${pct(bear)}, middle case ${pct(base)}, good case ${pct(bull)}`}>
        <div className="track" />
        <div className="zero" style={{ left: x(0) }} />
        <div className="span" style={{ left: x(bear), width: `calc(${x(bull)} - ${x(bear)})` }} />
        <div className="base" style={{ left: x(base) }} />
      </div>
      <div className="range-lab">
        <span className={light ? '' : tone(bear)}>Bad {pct(bear)}</span>
        <span className={light ? '' : 'muted'}>Middle {pct(base)}</span>
        <span className={light ? '' : tone(bull)}>Good {pct(bull)}</span>
      </div>
    </div>
  );
}

export function IdeaRow({ o }: { o: RankedIdea }) {
  return (
    <Link href={`/ideas/${encodeURIComponent(o.ticker)}`} className="row">
      <Mono ticker={o.ticker} rating={o.rating} />
      <div>
        <div className="row-name">{o.name}</div>
        <div className="row-sub">{o.rating}, {o.signal.toLowerCase()}, {o.market}</div>
      </div>
      <div className="row-end">
        <div className={`v num ${tone(o.ret_base)}`}>{pct(o.ret_base)}</div>
        <div className="k">score {o.score}</div>
      </div>
    </Link>
  );
}
