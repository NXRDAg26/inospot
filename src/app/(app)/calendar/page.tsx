import { MobileTop } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { dayNum, monthShort, whenLabel } from '@/lib/format';
import type { CalendarItem } from '@/lib/types';

export default async function Calendar() {
  const scan = await getScan();
  const groups = new Map<string, CalendarItem[]>();
  [...scan.calendar].sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => {
    groups.set(e.date, [...(groups.get(e.date) ?? []), e]);
  });
  return (
    <div className="page">
      <MobileTop />
      <header className="ph">
        <h1>Calendar</h1>
        <p>Results and policy decisions that could move the ideas on your radar. Red dots are the big ones.</p>
      </header>
      {[...groups.entries()].map(([date, evs]) => (
        <div className="day" key={date}>
          <div className="date-chip"><div className="d num">{dayNum(date)}</div><div className="m">{monthShort(date)}</div></div>
          <div>
            <div className="muted" style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{whenLabel(date)}</div>
            {evs.map((e) => (
              <div className="evt" key={e.event}>
                <a className="t" href={e.source_url} target="_blank" rel="noopener noreferrer"><span className={`dot ${e.impact}`} aria-label={`${e.impact} impact`} />{e.event}</a>
                <div className="s">{e.type} affecting {e.related}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
