import Link from 'next/link';
import { AlertCard } from '@/components/AlertCard';
import { MobileTop } from '@/components/Nav';
import { listAlerts } from '@/lib/alerts';
import { getScan } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Alerts() {
  const [alerts, scan] = await Promise.all([listAlerts(7).catch(() => []), getScan()]);
  const radar = new Set(scan.opps.map((o) => o.ticker.toUpperCase()));
  const today = new Date().toDateString();
  const fresh = alerts.filter((a) => !a.created_at || new Date(a.created_at).toDateString() === today);
  const older = alerts.filter((a) => a.created_at && new Date(a.created_at).toDateString() !== today);
  const ordered = (l: typeof alerts) => [...l].sort((a, b) => (a.strength === b.strength ? 0 : a.strength === 'Strong' ? -1 : 1));
  return (
    <div className="page wide">
      <MobileTop />
      <header className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Alerts</h1>
          <p>Stocks moving in a way worth looking into, checked on weekday mornings, midday and after the US open. Strong ones also go to your phone.</p>
        </div>
        <Link href="/alerts/settings" className="btn secondary">Phone alerts</Link>
      </header>

      {alerts.length === 0 && <p className="muted">No alerts in the last seven days. The next check runs on the next weekday.</p>}

      {fresh.length > 0 && (
        <section>
          <div className="block-head"><h2>Today</h2><span className="muted" style={{ fontSize: 14 }}>{fresh.length} alert{fresh.length === 1 ? '' : 's'}</span></div>
          <div className="agrid">{ordered(fresh).map((a) => <AlertCard key={`${a.id}-${a.ticker}`} a={a} onRadar={radar.has(a.ticker)} />)}</div>
        </section>
      )}
      {older.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Earlier this week</h2></div>
          <div className="agrid">{older.map((a) => <AlertCard key={`${a.id}-${a.ticker}`} a={a} compact onRadar={radar.has(a.ticker)} />)}</div>
        </section>
      )}
      <p className="foot">Alerts flag unusual moves to research, not trades to make. Research aid, not financial advice.</p>
    </div>
  );
}
