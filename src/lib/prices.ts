// Daily price history for charts. Tries Yahoo's public chart endpoint, then Stooq, then Alpha Vantage (if a key is set).
export interface PricePoint { t: number; c: number }
export interface History { symbol: string; currency?: string; points: PricePoint[]; source: string }

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; Inospot/1.0; personal research app)' };

async function yahoo(symbol: string): Promise<History | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&includePrePost=false`;
  const r = await fetch(url, { headers: UA, next: { revalidate: 1800 } });
  if (!r.ok) return null;
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  const ts: number[] = res?.timestamp ?? [];
  const cl: (number | null)[] = res?.indicators?.quote?.[0]?.close ?? [];
  const points = ts.map((t, i) => ({ t: t * 1000, c: cl[i] as number })).filter((p) => typeof p.c === 'number' && Number.isFinite(p.c));
  if (points.length < 10) return null;
  return { symbol, currency: res?.meta?.currency, points, source: 'Yahoo Finance' };
}

function stooqSymbol(symbol: string) {
  if (symbol.startsWith('^')) return null;
  if (symbol.endsWith('.L')) return `${symbol.slice(0, -2).toLowerCase()}.uk`;
  if (symbol.includes('.')) return null;
  return `${symbol.toLowerCase()}.us`;
}

async function stooq(symbol: string): Promise<History | null> {
  const s = stooqSymbol(symbol);
  if (!s) return null;
  const r = await fetch(`https://stooq.com/q/d/l/?s=${s}&i=d`, { headers: UA, next: { revalidate: 1800 } });
  if (!r.ok) return null;
  const txt = await r.text();
  const rows = txt.trim().split(/\r?\n/).slice(1).map((l) => l.split(','));
  const points = rows
    .map((c) => ({ t: Date.parse(`${c[0]}T21:00:00Z`), c: Number(c[4]) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.c) && p.c > 0)
    .slice(-260);
  if (points.length < 10) return null;
  return { symbol, currency: symbol.endsWith('.L') ? 'GBp' : 'USD', points, source: 'Stooq' };
}

async function alphaVantage(symbol: string): Promise<History | null> {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key || symbol.startsWith('^')) return null;
  const s = symbol.endsWith('.L') ? `${symbol.slice(0, -2)}.LON` : symbol;
  const r = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(s)}&outputsize=compact&apikey=${key}`, { next: { revalidate: 3600 } });
  if (!r.ok) return null;
  const j = await r.json();
  const ser = j?.['Time Series (Daily)'];
  if (!ser) return null;
  const points = Object.entries(ser)
    .map(([d, v]) => ({ t: Date.parse(`${d}T21:00:00Z`), c: Number((v as Record<string, string>)['4. close']) }))
    .sort((a, b) => a.t - b.t);
  return points.length >= 10 ? { symbol, points, source: 'Alpha Vantage' } : null;
}

function fake(symbol: string): History {
  // Local preview only (INOSPOT_FAKE_PRICES=1). Never used in production.
  let seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let v = 100;
  const now = Date.now();
  const points = Array.from({ length: 252 }, (_, i) => {
    v *= 1 + (rnd() - 0.48) * 0.035;
    return { t: now - (251 - i) * 86400000 * 1.45, c: Number(v.toFixed(2)) };
  });
  return { symbol, points, source: 'Sample data' };
}

export async function getHistory(symbol?: string | null): Promise<History | null> {
  if (!symbol) return null;
  if (process.env.INOSPOT_FAKE_PRICES === '1') return fake(symbol);
  for (const f of [yahoo, stooq, alphaVantage]) {
    try {
      const h = await f(symbol);
      if (h) return h;
    } catch {
      /* try the next source */
    }
  }
  return null;
}

/** Percentage change over the last n trading days, or since a date. */
export function changeOver(points: PricePoint[], days: number): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const cutoff = last.t - days * 86400000;
  const from = points.find((p) => p.t >= cutoff) ?? points[0];
  return ((last.c - from.c) / from.c) * 100;
}

export function ytdChange(points: PricePoint[]): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const y = new Date(last.t).getUTCFullYear();
  const from = points.find((p) => new Date(p.t).getUTCFullYear() === y);
  return from ? ((last.c - from.c) / from.c) * 100 : null;
}

export function perfFromHistory(points: PricePoint[]) {
  return {
    '1 week': changeOver(points, 7),
    '1 month': changeOver(points, 30),
    '3 months': changeOver(points, 91),
    '6 months': changeOver(points, 182),
    'This year': ytdChange(points),
    '1 year': changeOver(points, 365),
  } as Record<string, number | null>;
}

export const benchFor = (market?: string, chartSymbol?: string) =>
  market === 'UK' || chartSymbol?.endsWith('.L') ? { symbol: 'ISF.L', name: 'FTSE 100' } : { symbol: 'SPY', name: 'S&P 500' };
