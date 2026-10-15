import seed from '../../data/seed.json';
import { db, hasDb } from './db';
import type { Idea, RankedIdea, Scan } from './types';

export const radarScore = (o: Pick<Idea, 'opportunity' | 'risk'>) =>
  Math.round(Number(o.opportunity) * 0.7 + (100 - Number(o.risk)) * 0.3);

export async function getScan(): Promise<Scan> {
  if (hasDb()) {
    try {
      const pool = await db();
      const r = await pool.query('select data, created_at from scans order by id desc limit 1');
      if (r.rows[0]) return r.rows[0].data as Scan;
    } catch (e) {
      console.error('Falling back to seed scan:', e);
    }
  }
  return seed as unknown as Scan;
}

export async function getHistory(limit = 30): Promise<{ id: number; created_at: string; pick: string }[]> {
  if (!hasDb()) return [];
  const pool = await db();
  const r = await pool.query(
    `select id, created_at, data from scans order by id desc limit $1`,
    [limit]
  );
  return r.rows.map((row) => {
    const p = pickOfDay(ranked((row.data as Scan).opps));
    return { id: row.id, created_at: row.created_at, pick: p ? `${p.name} (${p.ticker})` : '' };
  });
}

export function ranked(opps: Idea[]): RankedIdea[] {
  return opps
    .map((o) => ({ ...o, score: radarScore(o) }))
    .sort((a, b) => b.score - a.score)
    .map((o, i) => ({ ...o, rank: i + 1 }));
}

export function pickOfDay(list: RankedIdea[]): RankedIdea | undefined {
  return list.find((o) => o.rating === 'Strong') ?? list[0];
}

export function validateScan(s: unknown): string | null {
  if (!s || typeof s !== 'object') return 'scan must be an object';
  const o = s as Record<string, unknown>;
  for (const k of ['opps', 'news', 'calendar', 'watch', 'themes']) {
    if (!Array.isArray(o[k])) return `scan.${k} must be an array`;
  }
  if (!o.note || typeof o.note !== 'object') return 'scan.note must be an object';
  if ((o.opps as unknown[]).length === 0) return 'scan.opps must contain at least one idea';
  return null;
}

export async function saveScan(s: Scan): Promise<number> {
  const pool = await db();
  const r = await pool.query('insert into scans (data) values ($1) returning id', [s]);
  return r.rows[0].id as number;
}
