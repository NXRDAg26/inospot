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
