import { Pool } from 'pg';

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}

export async function db(): Promise<Pool> {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('localhost') ? undefined : { rejectUnauthorized: false },
      max: 4,
    });
  }
  if (!ready) {
    ready = pool
      .query(
        `create table if not exists scans (
           id serial primary key,
           created_at timestamptz not null default now(),
           data jsonb not null
         );
         create table if not exists alerts (
           id serial primary key,
           created_at timestamptz not null default now(),
           ticker text not null,
           data jsonb not null
         );
         create index if not exists alerts_created on alerts (created_at desc);
         create table if not exists dives (
           id serial primary key,
           ticker text not null,
           status text not null default 'queued',
           source text not null default 'live',
           stage text,
           created_at timestamptz not null default now(),
           updated_at timestamptz not null default now(),
           data jsonb,
           error text
         );
         create index if not exists dives_ticker on dives (ticker, updated_at desc);
         create table if not exists push_subs (
           endpoint text primary key,
           sub jsonb not null,
           created_at timestamptz not null default now()
         );`
      )
      .then(() => undefined);
  }
  await ready;
  return pool;
}
