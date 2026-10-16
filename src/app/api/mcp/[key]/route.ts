// Minimal MCP server (Streamable HTTP, JSON responses) so Claude can publish the morning scan.
// Add to Claude as a custom connector: https://<host>/api/mcp/<MCP_KEY>
import { getScan, pickOfDay, ranked, saveScan, validateScan } from '@/lib/data';
import { hasDb } from '@/lib/db';
import { notifyAll } from '@/lib/push';
import type { Scan } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PROTOCOL = '2025-06-18';

const TOOLS = [
  {
    name: 'publish_scan',
    description:
      'Publish the Inospot morning scan. Replaces what the app shows and sends a push alert with the pick of the day. ' +
      'Pass the whole scan: opps (ideas), note (morning note object), news, calendar, watch (watchlist), themes, and optionally markets (market board) and insights (ranked boards), using the same fields as get_latest_scan returns.',
    inputSchema: {
      type: 'object',
      properties: {
        scan: {
          type: 'object',
          description: 'The full scan object: { opps: [], note: {}, news: [], calendar: [], watch: [], themes: [] }',
          properties: {
            opps: { type: 'array', items: { type: 'object' } },
            note: { type: 'object' },
            news: { type: 'array', items: { type: 'object' } },
            calendar: { type: 'array', items: { type: 'object' } },
            watch: { type: 'array', items: { type: 'object' } },
            themes: { type: 'array', items: { type: 'object' } },
            markets: {
              type: 'array',
              items: { type: 'object' },
              description:
                'Optional market board tiles: { id, name, symbol, group (Indices|Commodities|Currencies|Bonds|Countries|Sectors), price, unit ($|%|empty), decimals, change_1d, change_5d, change_1m, change_ytd, series (about 30 daily closes, oldest first), series_note, popular, featured (one tile), read }',
            },
            insights: {
              type: 'array',
              items: { type: 'object' },
              description:
                'Optional ranked insight boards: { id, title, kind (hero|pair), icon (candles|eye|bookmark|chart|trend|layers), measure, basis, period, format (pct|pct0|num|vol|score), split_labels ([left,right]), blurb, pair (shared key for a pair), rows: [{ name, ticker, href, value, display, split ([left,middle,right] counts), change_1d, price, ccy, unit, decimals, note }] }',
            },
          },
          required: ['opps', 'note', 'news', 'calendar', 'watch', 'themes'],
        },
        notify: { type: 'boolean', description: 'Send a push alert to subscribed devices. Defaults to true.' },
      },
      required: ['scan'],
    },
  },
  {
    name: 'update_latest_scan',
    description:
      'Add or replace the optional markets and/or insights arrays on the scan Inospot is currently showing, without resending the rest. Saves a new copy and sends no alert.',
    inputSchema: {
      type: 'object',
      properties: {
        markets: { type: 'array', items: { type: 'object' }, description: 'Market board tiles, same shape as in publish_scan.' },
        insights: { type: 'array', items: { type: 'object' }, description: 'Insight boards, same shape as in publish_scan.' },
      },
    },
  },
  {
    name: 'get_latest_scan',
    description: 'Return the scan Inospot is currently showing, including every field, so it can be updated and published again.',
    inputSchema: { type: 'object', properties: {} },
  },
];

type RpcReq = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };

const ok = (id: RpcReq['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const fail = (id: RpcReq['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], isError });

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === 'get_latest_scan') {
    return text(JSON.stringify(await getScan()));
  }
  if (name === 'update_latest_scan') {
    if (!hasDb()) return text('Inospot has no database connected, so nothing was saved.', true);
    const cur = await getScan();
    const next = { ...cur } as Scan;
    if (Array.isArray(args.markets)) next.markets = args.markets as Scan['markets'];
    if (Array.isArray(args.insights)) next.insights = args.insights as Scan['insights'];
    if (!Array.isArray(args.markets) && !Array.isArray(args.insights)) return text('Pass markets and/or insights as arrays.', true);
    const id = await saveScan(next);
    return text(`Updated scan saved as ${id}: ${next.markets?.length ?? 0} market tiles, ${next.insights?.length ?? 0} insight boards.`);
  }
  if (name === 'publish_scan') {
    if (!hasDb()) return text('Inospot has no database connected, so the scan was not saved.', true);
    const scan = args.scan as Scan;
    const problem = validateScan(scan);
    if (problem) return text(`Scan not published: ${problem}.`, true);
    scan.scanned_at = new Date().toISOString();
    const id = await saveScan(scan);
    let sent = 0;
    const pick = pickOfDay(ranked(scan.opps));
    if (args.notify !== false && pick) {
      const base = pick.ret_base > 0 ? `+${pick.ret_base}` : `${pick.ret_base}`;
      sent = await notifyAll(`Pick of the day: ${pick.name}`, `${pick.ticker}, score ${Math.round(pick.opportunity * 0.7 + (100 - pick.risk) * 0.3)}, middle case ${base}%. ${scan.note?.top_title ?? ''}`.trim(), `/ideas/${encodeURIComponent(pick.ticker)}`);
    }
    return text(`Published scan ${id} with ${scan.opps.length} ideas. Pick of the day: ${pick?.name ?? 'none'}. Alerts sent: ${sent}.`);
  }
  return text(`Unknown tool: ${name}`, true);
}

async function handle(msg: RpcReq) {
  switch (msg.method) {
    case 'initialize':
      return ok(msg.id, {
        protocolVersion: (msg.params?.protocolVersion as string) || PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'inospot', version: '1.0.0' },
        instructions: 'Inospot shows James Norgate’s market opportunity scan. Use get_latest_scan to read it and publish_scan to replace it after the morning research.',
      });
    case 'ping':
      return ok(msg.id, {});
    case 'tools/list':
      return ok(msg.id, { tools: TOOLS });
    case 'tools/call': {
      const p = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      try {
        return ok(msg.id, await callTool(String(p.name), p.arguments ?? {}));
      } catch (e) {
        return ok(msg.id, text(`Tool failed: ${e instanceof Error ? e.message : String(e)}`, true));
      }
    }
    default:
      if (msg.id === undefined) return null; // notification
      return fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

// Render generates base64 keys that can contain "/", "+" and "=". Accept the key as given,
// percent-encoded, or in URL-safe form ("+" to "-", "/" to "_", no "=") so it works in a URL path.
const urlSafe = (k: string) => k.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function keyMatches(given: string) {
  const real = process.env.MCP_KEY;
  if (!real) return false;
  let decoded = given;
  try { decoded = decodeURIComponent(given); } catch { /* keep as given */ }
  return [given, decoded].some((g) => g === real || g === urlSafe(real));
}

export async function POST(req: Request, { params }: { params: { key: string } }) {
  if (!keyMatches(params.key)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return Response.json(fail(null, -32700, 'Parse error'), { status: 400 });
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(handle))).filter(Boolean);
    return out.length ? Response.json(out) : new Response(null, { status: 202 });
  }
  const res = await handle(body as RpcReq);
  return res ? Response.json(res) : new Response(null, { status: 202 });
}

export function GET() {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}

export function DELETE() {
  return new Response(null, { status: 204 });
}
