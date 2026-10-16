import Link from 'next/link';
import { Range } from '@/components/Bits';
import { fmtPrice, SplitBar } from '@/components/Board';
import { PriceChart, ReturnsBars } from '@/components/Charts';
import { DiveRunner } from '@/components/DiveClient';
import { IconBack } from '@/components/Icons';
import { MobileTop } from '@/components/Nav';
import { latestDive, listAlerts, normTicker } from '@/lib/alerts';
import { getScan, radarScore } from '@/lib/data';
import { hasDb } from '@/lib/db';
import { hasLiveDives } from '@/lib/deepdive';
import { pct, shortDate, tone } from '@/lib/format';
import { benchFor, getHistory, perfFromHistory } from '@/lib/prices';

export const dynamic = 'force-dynamic';

const verdictTone = (v: string) => (/avoid/i.test(v) ? 'loss' : /wait/i.test(v) ? 'amber' : 'gain');
const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  return h < 36 ? `${h} hour${h === 1 ? '' : 's'} ago` : shortDate(iso);
};

export default async function DivePage({ params }: { params: { ticker: string } }) {
  const ticker = normTicker(decodeURIComponent(params.ticker));
  const [{ ready, pending }, scan, alerts] = await Promise.all([latestDive(ticker), getScan(), listAlerts(7).catch(() => [])]);
  const d = ready?.data ?? null;
  const live = hasLiveDives() && hasDb();
  const canRun = hasDb();
  const liveNote = 'Deep dives need the app database.';
  const pMode = pending?.source === 'request' ? 'request' : 'live';
  const alert = alerts.find((a) => normTicker(a.ticker) === ticker);

  const chartSym = d?.chart_symbol || alert?.chart_symbol || ticker;
  const bench = d?.bench_symbol ? { symbol: d.bench_symbol, name: d.bench_name || 'Market' } : benchFor(d?.market || alert?.market, chartSym);
  const [hist, bhist] = await Promise.all([getHistory(chartSym).catch(() => null), getHistory(bench.symbol).catch(() => null)]);

  let perfRows = d?.performance ?? [];
  if (hist && hist.points.length > 30) {
    const s = perfFromHistory(hist.points);
    const b = bhist ? perfFromHistory(bhist.points) : {};
    perfRows = Object.keys(s).map((k) => ({ label: k, stock: s[k], bench: (b as Record<string, number | null>)[k] ?? null }));
  }

  const ccy = d?.currency || alert?.ccy || '$';
  const lastPrice = hist ? hist.points[hist.points.length - 1].c : d?.price ?? alert?.price ?? null;
  const r52 = hist && hist.points.length > 100
    ? { low: Math.min(...hist.points.map((p) => p.c)), high: Math.max(...hist.points.map((p) => p.c)) }
    : d?.range_52w ?? null;

  // everything else Inospot knows about this stock
  const idea = scan.opps.find((o) => normTicker(o.ticker) === ticker);
  const watch = scan.watch.find((w) => normTicker(w.ticker) === ticker);
  const dates = scan.calendar.filter((c) => c.related.toUpperCase().split(/[^A-Z0-9.]+/).includes(ticker));
  const ranks = (scan.insights ?? []).map((i) => ({ i, pos: i.rows.findIndex((r) => normTicker(r.ticker ?? '') === ticker) })).filter((x) => x.pos >= 0);

  return (
    <div className="page wide dive">
      <MobileTop />
      <Link href="/research" className="back"><IconBack />Research</Link>

      <header className="dive-head">
        <div>
          <div className="stamp">{[d?.exchange, d?.sector, d?.market].filter(Boolean).join(', ') || 'Deep dive'}</div>
          <h1 className="d-tk" style={{ marginTop: 8 }}>{ticker}</h1>
          <div className="pick-nm" style={{ opacity: 1, marginTop: 6 }}>{d?.name ?? alert?.name ?? ''}</div>
        </div>
        {lastPrice !== null && (
          <div className="dive-price">
            <span className="num">{fmtPrice(lastPrice, ccy, 2, ccy)}</span>
            {(d?.change_1d ?? alert?.change_1d) !== undefined && <span className={`chip ${tone(d?.change_1d ?? alert?.change_1d)}`}>{pct(d?.change_1d ?? alert?.change_1d, 2)} on the day</span>}
          </div>
        )}
      </header>

      {alert && (
        <div className={`alert-banner ${alert.stance === 'Caution' ? 'caution' : ''}`}>
          <b>{alert.kind}: {alert.headline}</b>
          <span>{alert.why}</span>
        </div>
      )}

      {d ? (
        <section className="verdict">
          <span className={`verdict-pill ${verdictTone(d.verdict)}`}>{d.verdict}</span>
          <p className="verdict-line">{d.verdict_line}</p>
          <p className="muted small-note">
            {ready?.source === 'live' ? 'Live deep dive' : 'Prepared by the morning research'}, {ago(ready!.updated_at)}{d.generated_by ? `. ${d.generated_by}` : ''}.
          </p>
          <DiveRunner ticker={ticker} pendingId={pending?.id} pendingMode={pMode} label="Refresh deep dive" enabled={canRun} live={live} />
        </section>
      ) : (
        <section className="verdict empty">
          <h2>No deep dive for {ticker} yet</h2>
          <p className="muted">A deep dive searches results, news, analyst ratings and valuation, then writes up the case for and against. {live ? 'It takes one to two minutes.' : 'Request one and it is written at the next research run.'} The price charts below are live now.</p>
          <DiveRunner ticker={ticker} pendingId={pending?.id} pendingMode={pMode} enabled={canRun} live={live} note={liveNote} />
        </section>
      )}

      <section className="block">
        <div className="block-head"><h2>Performance</h2>{r52 && lastPrice !== null && <span className="muted" style={{ fontSize: 14 }}>52-week range {fmtPrice(r52.low, ccy, 2, ccy)} to {fmtPrice(r52.high, ccy, 2, ccy)}</span>}</div>
        {hist ? (
          <PriceChart points={hist.points} bench={bhist?.points} benchName={bench.name} currency={ccy} source={hist.source} />
        ) : (
          <p className="muted">The price chart is unavailable right now. {perfRows.length ? 'Period returns below come from the research.' : ''}</p>
        )}
        <div className="perf-grid">
          {perfRows.length > 0 && (
            <div className="panel"><h3 className="small">Returns against the {bench.name}</h3><ReturnsBars rows={perfRows} benchName={bench.name} /></div>
          )}
          <div className="panel">
            {r52 && lastPrice !== null && (
              <div className="meterblock">
                <h3 className="small">Where it sits in its 52-week range</h3>
                <div className="hl">
                  <div className="hl-track"><i style={{ left: `${Math.max(0, Math.min(100, ((lastPrice - r52.low) / (r52.high - r52.low || 1)) * 100))}%` }} /></div>
                  <div className="hl-lab"><span>Low {fmtPrice(r52.low, ccy, 2, ccy)}</span><span>High {fmtPrice(r52.high, ccy, 2, ccy)}</span></div>
                </div>
                <p className="muted small-note">{Math.round(((lastPrice - r52.high) / r52.high) * 100) === 0 ? 'At its 52-week high.' : `${Math.abs(Math.round(((lastPrice - r52.high) / r52.high) * 100))}% below its high, ${Math.round(((lastPrice - r52.low) / r52.low) * 100)}% above its low.`}</p>
              </div>
            )}
            {d?.analysts && (
              <div className="meterblock">
                <h3 className="small">Analysts</h3>
                <SplitBar split={[d.analysts.sell, d.analysts.hold, d.analysts.buy]} labels={['Sell', 'Buy']} />
                <p className="muted small-note">{d.analysts.buy} buy, {d.analysts.hold} hold, {d.analysts.sell} sell.</p>
                {d.analysts.target_mean && lastPrice !== null && (
                  <>
                    <div className="hl" style={{ marginTop: 12 }}>
                      {(() => {
                        const lo = Math.min(d.analysts!.target_low ?? lastPrice, lastPrice), hi = Math.max(d.analysts!.target_high ?? lastPrice, lastPrice);
                        const pos = (v: number) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
                        return (
                          <div className="hl-track tgt">
                            <i className="now" style={{ left: pos(lastPrice) }} title="Price now" />
                            <i className="mean" style={{ left: pos(d.analysts!.target_mean!) }} title="Average target" />
                          </div>
                        );
                      })()}
                      <div className="hl-lab"><span>Low {fmtPrice(d.analysts.target_low, ccy, 0, ccy)}</span><span>High {fmtPrice(d.analysts.target_high, ccy, 0, ccy)}</span></div>
                    </div>
                    <p className="muted small-note"><span className="dotk now" /> Price now <span className="dotk mean" /> Average target {fmtPrice(d.analysts.target_mean, ccy, 0, ccy)} ({pct(((d.analysts.target_mean - lastPrice) / lastPrice) * 100, 0)})</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {d && (
        <>
          <section className="block">
            <div className="block-head"><h2>The story</h2></div>
            <p className="lead" style={{ marginTop: 0 }}>{d.summary}</p>
            {d.why_moving && <div className="callout" style={{ marginTop: 18 }}><h3>Why it is moving</h3><p className="prose">{d.why_moving}</p></div>}
          </section>

          {(d.ret_base !== undefined || d.opportunity !== undefined) && (
            <section className="block">
              <div className="block-head"><h2>Inospot’s read</h2>{d.horizon && <span className="muted" style={{ fontSize: 14 }}>{d.horizon}</span>}</div>
              <div className="figs">
                <div className="fig"><div className="k">Opportunity</div><div className="v num">{d.opportunity ?? '–'}</div></div>
                <div className="fig"><div className="k">Risk</div><div className="v num">{d.risk ?? '–'}</div></div>
                <div className="fig"><div className="k">Radar score</div><div className="v num">{d.opportunity !== undefined && d.risk !== undefined ? radarScore({ opportunity: d.opportunity, risk: d.risk }) : '–'}</div></div>
              </div>
              {d.ret_bear !== undefined && d.ret_base !== undefined && d.ret_bull !== undefined && <div style={{ marginTop: 22 }}><Range bear={d.ret_bear} base={d.ret_base} bull={d.ret_bull} /></div>}
            </section>
          )}

          <section className="block cols2">
            <div><h3 className="small">The case for</h3><ul className="points gain">{d.bull_case.map((p) => <li key={p}>{p}</li>)}</ul></div>
            <div><h3 className="small">The case against</h3><ul className="points loss">{d.bear_case.map((p) => <li key={p}>{p}</li>)}</ul></div>
          </section>

          {d.key_numbers && d.key_numbers.length > 0 && (
            <section className="block">
              <div className="block-head"><h2>Key numbers</h2></div>
              <div className="kn">
                {d.key_numbers.map((k) => (
                  <div key={k.label} className="kn-i"><div className="k">{k.label}</div><div className="v num">{k.value}</div>{k.note && <div className="n">{k.note}</div>}</div>
                ))}
              </div>
            </section>
          )}

          {d.news && d.news.length > 0 && (
            <section className="block">
              <div className="block-head">
                <h2>In the news</h2>
                {d.sentiment && <span className={`chip ${d.sentiment.tone === 'Bullish' ? 'gain' : d.sentiment.tone === 'Bearish' ? 'loss' : 'flat'}`}>{d.sentiment.tone} tone</span>}
              </div>
              {d.sentiment && (
                <div style={{ maxWidth: 420, marginBottom: 8 }}>
                  <SplitBar split={[d.sentiment.bearish, 0, d.sentiment.bullish]} labels={['Bearish', 'Bullish']} />
                  <p className="muted small-note">{d.sentiment.note ?? `${d.sentiment.bullish} positive and ${d.sentiment.bearish} negative stories this week.`}</p>
                </div>
              )}
              <div className="rows">
                {d.news.map((n) => (
                  <a key={n.title} className="row news-row" href={n.url || undefined} target="_blank" rel="noopener noreferrer">
                    <span className={`tone-dot ${n.tone}`} aria-label={n.tone} />
                    <div><div className="row-name">{n.title}</div><div className="row-sub">{n.source}, {shortDate(n.date)}{n.why ? `. ${n.why}` : ''}</div></div>
                    <span className="igo" aria-hidden="true">{n.url ? '↗' : ''}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {(d.catalysts?.length || d.watch?.length) ? (
            <section className="block cols2">
              {d.catalysts && d.catalysts.length > 0 && (
                <div>
                  <h3 className="small">Dates to watch</h3>
                  <ul className="points">{d.catalysts.map((c) => <li key={c.date + c.event}><b>{shortDate(c.date)}</b>, {c.event}</li>)}</ul>
                </div>
              )}
              {d.watch && d.watch.length > 0 && (
                <div><h3 className="small">What would change the view</h3><ul className="points">{d.watch.map((w) => <li key={w}>{w}</li>)}</ul></div>
              )}
            </section>
          ) : null}
        </>
      )}

      {(idea || watch || dates.length > 0 || ranks.length > 0) && (
        <section className="block">
          <div className="block-head"><h2>Elsewhere in Inospot</h2></div>
          <div className="rows">
            {idea && (
              <Link href={`/ideas/${encodeURIComponent(idea.ticker)}`} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                <div><div className="row-name">On the radar: {idea.rating}</div><div className="row-sub">{idea.signal}, thesis {String(idea.thesis_status || 'new').toLowerCase()}, middle case {pct(idea.ret_base)}</div></div>
                <div className="row-end"><div className="v num">{radarScore(idea)}</div><div className="k">score</div></div>
              </Link>
            )}
            {watch && (
              <Link href={`/research/${encodeURIComponent(watch.id)}`} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                <div><div className="row-name">On the watchlist</div><div className="row-sub">{watch.stance}, {watch.trigger}</div></div>
                <div className="row-end"><div className="v num">{watch.heat}</div><div className="k">heat</div></div>
              </Link>
            )}
            {dates.map((c) => (
              <Link key={c.date + c.event} href="/calendar" className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                <div><div className="row-name">{c.event}</div><div className="row-sub">{c.type}, {c.impact.toLowerCase()} impact</div></div>
                <div className="row-end"><div className="k" style={{ fontSize: 13 }}>{shortDate(c.date)}</div></div>
              </Link>
            ))}
            {ranks.map(({ i, pos }) => (
              <Link key={i.id} href={`/insights/${i.id}`} className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                <div><div className="row-name">{i.title}</div><div className="row-sub">{i.period}</div></div>
                <div className="row-end"><div className="v num">#{pos + 1}</div></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {d?.sources && d.sources.length > 0 && (
        <section className="block">
          <div className="block-head"><h2>Sources</h2></div>
          <ul className="srcs">{d.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></li>)}</ul>
        </section>
      )}

      <p className="foot">Inospot is a research aid, not financial advice. Deep dives are written from the sources listed and can be wrong or out of date; check before acting.</p>
    </div>
  );
}
