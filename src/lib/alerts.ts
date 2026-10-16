import seedAlerts from '../../data/seed-alerts.json';
import { db, hasDb } from './db';
import { notifyAll } from './push';
import type { Alert, Dive, DiveRecord } from './types';

type Seed = { alerts: Alert[]; dives: Dive[] };
const seed = seedAlerts as unknown as Seed;

export const normTicker = (t: string) => String(t || '').trim().toUpperCase().replace(/[^A-Z0-9.\-^=]/g, '').slice(0, 16);

/* One-off bootstrap: a brand-new database starts with the alerts and dives shipped in data/seed-alerts.json. */
let seeded: Promise<void> | null = null;
function ensureSeeded() {
  if (!seeded) {
    seeded = (async () => {
      const pool = await db();
      const r = await pool.query('select (select count(*) from alerts)::int + (select count(*) from dives)::int as n');
      if (r.rows[0].n > 0) return;
      for (const d of seed.dives) await pool.query(`insert into dives (ticker, status, source, data) values ($1, 'ready', 'scan', $2)`, [normTicker(d.ticker), d]);
      for (const a of seed.alerts) await pool.query('insert into alerts (ticker, data, created_at) values ($1, $2, $3)', [normTicker(a.ticker), a, a.created_at ?? new Date().toISOString()]);
    })().catch((e) => { seeded = null; throw e; });
  }
  return seeded;
}

/* ---------- alerts ---------- */

export async function listAlerts(days = 7): Promise<Alert[]> {
  if (!hasDb()) return seed.alerts;
  await ensureSeeded().catch(() => undefined);
  const pool = await db();
  const r = await pool.query(
    `select id, created_at, data from alerts where created_at > now() - ($1 || ' days')::interval order by created_at desc, id asc limit 60`,
    [String(days)]
  );
  return r.rows.map((row) => ({ ...(row.data as Alert), id: row.id, created_at: new Date(row.created_at).toISOString() }));
}

export function validateAlert(a: unknown): string | null {
  if (!a || typeof a !== 'object') return 'each alert must be an object';
  const o = a as Record<string, unknown>;
  for (const k of ['ticker', 'name', 'headline', 'why']) if (!o[k] || typeof o[k] !== 'string') return `alert.${k} is required`;
  if (o.strength !== 'Strong' && o.strength !== 'Watch') return 'alert.strength must be Strong or Watch';
  return null;
}

/** Saves alerts and pushes the Strong ones (once per ticker per 20 hours). Returns counts. */
export async function saveAlerts(list: Alert[], push = true) {
  const pool = await db();
  let pushed = 0;
  for (const raw of list) {
    const a = { ...raw, ticker: normTicker(raw.ticker) };
    let recent = 0;
    if (a.strength === 'Strong') {
      const r = await pool.query(
        `select count(*)::int as n from alerts where ticker = $1 and data->>'strength' = 'Strong' and created_at > now() - interval '20 hours'`,
        [a.ticker]
      );
      recent = r.rows[0].n;
    }
    await pool.query('insert into alerts (ticker, data) values ($1, $2)', [a.ticker, a]);
    if (push && a.strength === 'Strong' && recent === 0 && pushed < 3) {
      const sent = await notifyAll(`Alert: ${a.name} (${a.ticker})`, a.headline, `/research/dive/${encodeURIComponent(a.ticker)}`);
      if (sent) pushed++;
    }
  }
  return { saved: list.length, pushed };
}

/* ---------- dives ---------- */

const rowToRecord = (row: Record<string, unknown>): DiveRecord => ({
  id: row.id as number,
  ticker: row.ticker as string,
  status: row.status as DiveRecord['status'],
  source: row.source as DiveRecord['source'],
  stage: (row.stage as string) ?? null,
  created_at: new Date(row.created_at as string).toISOString(),
  updated_at: new Date(row.updated_at as string).toISOString(),
  data: (row.data as Dive) ?? null,
  error: (row.error as string) ?? null,
});

export async function latestDive(ticker: string): Promise<{ ready: DiveRecord | null; pending: DiveRecord | null }> {
  const t = normTicker(ticker);
  if (!hasDb()) {
    const d = seed.dives.find((x) => normTicker(x.ticker) === t);
    const now = new Date().toISOString();
    return { ready: d ? { id: 0, ticker: t, status: 'ready', source: 'scan', created_at: now, updated_at: now, data: d } : null, pending: null };
  }
  await ensureSeeded().catch(() => undefined);
  const pool = await db();
  const ready = await pool.query(`select * from dives where ticker = $1 and status = 'ready' order by updated_at desc limit 1`, [t]);
  const pending = await pool.query(
    `select * from dives where ticker = $1 and status in ('queued','running') and updated_at > now() - interval '15 minutes' order by id desc limit 1`,
    [t]
  );
  return { ready: ready.rows[0] ? rowToRecord(ready.rows[0]) : null, pending: pending.rows[0] ? rowToRecord(pending.rows[0]) : null };
}

export async function getDiveRecord(id: number): Promise<DiveRecord | null> {
  const pool = await db();
  const r = await pool.query('select * from dives where id = $1', [id]);
  return r.rows[0] ? rowToRecord(r.rows[0]) : null;
}

export async function recentDives(limit = 12): Promise<DiveRecord[]> {
  if (!hasDb()) {
    const now = new Date().toISOString();
    return seed.dives.map((d, i) => ({ id: i, ticker: d.ticker, status: 'ready', source: 'scan', created_at: now, updated_at: now, data: d }));
  }
  await ensureSeeded().catch(() => undefined);
  const pool = await db();
  const r = await pool.query(
    `select distinct on (ticker) * from dives where status = 'ready' order by ticker, updated_at desc`
  );
  return r.rows.map(rowToRecord).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, limit);
}

export async function saveReadyDive(d: Dive, source: 'scan' | 'live' = 'scan'): Promise<number> {
  const pool = await db();
  const r = await pool.query(
    `insert into dives (ticker, status, source, data) values ($1, 'ready', $2, $3) returning id`,
    [normTicker(d.ticker), source, d]
  );
  return r.rows[0].id;
}

export async function createPendingDive(ticker: string): Promise<number> {
  const pool = await db();
  const r = await pool.query(`insert into dives (ticker, status, source, stage) values ($1, 'queued', 'live', 'Starting') returning id`, [normTicker(ticker)]);
  return r.rows[0].id;
}

export async function updateDive(id: number, patch: { status?: string; stage?: string; data?: Dive; error?: string }) {
  const pool = await db();
  await pool.query(
    `update dives set status = coalesce($2, status), stage = coalesce($3, stage), data = coalesce($4, data), error = coalesce($5, error), updated_at = now() where id = $1`,
    [id, patch.status ?? null, patch.stage ?? null, patch.data ?? null, patch.error ?? null]
  );
}

export async function livesToday(): Promise<number> {
  if (!hasDb()) return 0;
  const pool = await db();
  const r = await pool.query(`select count(*)::int as n from dives where source = 'live' and created_at > now() - interval '24 hours'`);
  return r.rows[0].n;
}

export function validateDive(d: unknown): string | null {
  if (!d || typeof d !== 'object') return 'dive must be an object';
  const o = d as Record<string, unknown>;
  for (const k of ['ticker', 'name', 'verdict', 'verdict_line', 'summary']) if (!o[k] || typeof o[k] !== 'string') return `dive.${k} is required`;
  for (const k of ['bull_case', 'bear_case']) if (!Array.isArray(o[k])) return `dive.${k} must be an array`;
  return null;
}
