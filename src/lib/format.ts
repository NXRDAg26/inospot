export const pct = (v: number | null | undefined, digits = 0) => {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '–';
  const n = Number(v);
  const s = Math.abs(n).toFixed(digits);
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${s}%`;
};

export const tone = (v: number | null | undefined) =>
  v === null || v === undefined ? 'flat' : Number(v) > 0 ? 'gain' : Number(v) < 0 ? 'loss' : 'flat';

const d = (s: string) => new Date(s.length === 10 ? `${s}T12:00:00Z` : s);

export const shortDate = (s: string) =>
  d(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' });

export const longDate = (s: string) =>
  d(s).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' });

export const dayNum = (s: string) => d(s).toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Europe/London' });
export const monthShort = (s: string) => d(s).toLocaleDateString('en-GB', { month: 'short', timeZone: 'Europe/London' });

export const list = (s: string) =>
  String(s || '')
    .split(';')
    .map((x) => x.trim())
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .filter(Boolean);

export function daysUntil(s: string, from = new Date()) {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const t = d(s);
  const b = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  return Math.round((b - a) / 86400000);
}

export function whenLabel(s: string) {
  const n = daysUntil(s);
  if (n < 0) return 'Passed';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 7) return `In ${n} days`;
  const w = Math.round(n / 7);
  return w === 1 ? 'Next week' : `In ${w} weeks`;
}
