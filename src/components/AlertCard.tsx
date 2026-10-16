import Link from 'next/link';
import { fmtPrice } from '@/components/Board';
import { pct, tone } from '@/lib/format';
import type { Alert } from '@/lib/types';

const when = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  return today ? t : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London' });
};

export function AlertCard({ a, compact, onRadar }: { a: Alert; compact?: boolean; onRadar?: boolean }) {
  return (
    <article className={`acard ${a.stance === 'Caution' ? 'caution' : ''} ${a.strength === 'Strong' ? 'strong' : ''}`}>
      <div className="acard-top">
        <span className="atag">{a.kind}</span>
        {a.strength === 'Strong' && <span className="atag hot">Strong</span>}
        {a.stance === 'Caution' && <span className="atag warn">Caution</span>}
        <span className="atime">{when(a.created_at)}</span>
      </div>
      <div className="acard-main">
        <div>
          <div className="acard-tk">{a.ticker}</div>
          <div className="row-sub">{a.name}, {a.market}</div>
        </div>
        <div className="acard-px">
          {a.price !== undefined && a.price !== null && <div className="num">{fmtPrice(a.price, a.ccy, 2, a.ccy)}</div>}
          <div className="acard-chg">
            {a.change_1d !== undefined && a.change_1d !== null && <span className={`chip ${tone(a.change_1d)}`}>{pct(a.change_1d, 1)} day</span>}
            {a.change_5d !== undefined && a.change_5d !== null && <span className={`chip ${tone(a.change_5d)}`}>{pct(a.change_5d, 1)} 5 days</span>}
          </div>
        </div>
      </div>
      <p className="acard-h">{a.headline}</p>
      {!compact && <p className="acard-why">{a.why}</p>}
      {!compact && a.check && <p className="acard-check"><b>Look into:</b> {a.check}</p>}
      <div className="acard-cta">
        <Link href={`/research/dive/${encodeURIComponent(a.ticker)}`} className="btn dive-btn">Deep dive</Link>
        {onRadar && <Link href={`/ideas/${encodeURIComponent(a.ticker)}`} className="btn secondary">On the radar</Link>}
      </div>
    </article>
  );
}
