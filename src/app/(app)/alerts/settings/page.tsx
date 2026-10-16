import Link from 'next/link';
import { IconBack } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { getHistory } from '@/lib/data';
import { hasDb } from '@/lib/db';
import { shortDate } from '@/lib/format';
import AlertsClient from './AlertsClient';

export default async function AlertSettings() {
  const history = hasDb() ? await getHistory(14).catch(() => []) : [];
  const key = process.env.VAPID_PUBLIC_KEY ?? '';
  return (
    <div className="page">
      <MobileTop />
      <Link href="/alerts" className="back"><IconBack />Alerts</Link>
      <header className="ph">
        <h1>Alert settings</h1>
        <p>Get the pick of the day on this device around 7:50am on weekdays, plus a push when a stock makes a strong unusual move.</p>
      </header>
      <AlertsClient vapidKey={key} />

      <section className="block">
        <div className="block-head"><h2>Recent scans</h2></div>
        {history.length ? (
          <div className="rows">
            {history.map((h) => (
              <div className="row" key={h.id} style={{ gridTemplateColumns: '1fr auto' }}>
                <div><div className="row-name">{h.pick || 'No pick'}</div><div className="row-sub">Pick of the day</div></div>
                <div className="row-end"><div className="k" style={{ fontSize: 13 }}>{shortDate(String(h.created_at))}</div></div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Scans appear here once the first morning scan has been published.</p>
        )}
      </section>

      <section className="block">
        <div className="block-head"><h2>Install on your phone</h2></div>
        <p className="prose muted">On iPhone, open Inospot in Safari, tap Share, then Add to Home Screen. On Android, open it in Chrome and choose Install app. Alerts on iPhone work once it is added to the Home Screen.</p>
      </section>
    </div>
  );
}
