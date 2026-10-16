export type Rating = 'Strong' | 'Watch' | 'Avoid';

export interface Idea {
  ticker: string;
  name: string;
  market: string;
  sector: string;
  signal: string;
  rating: Rating;
  opportunity: number;
  risk: number;
  ret_bear: number;
  ret_base: number;
  ret_bull: number;
  horizon: string;
  spotted: string;
  why: string;
  positives: string;
  negatives: string;
  source_title: string;
  source_url: string;
  style?: string;
  thesis?: string;
  thesis_status?: string;
  conviction?: string;
  stop_trigger?: string;
  catalyst?: string;
  catalyst_date?: string;
}

export interface Note {
  date: string;
  regime: string;
  top_title: string;
  top_call: string;
  developments: string;
  events: string;
  trade: string;
  source_title?: string;
  source_url?: string;
}

export interface NewsItem {
  rank: number;
  event: string;
  date: string;
  score: number;
  type: string;
  assets: string;
  reaction: string;
  read: string;
  source_title: string;
  source_url: string;
}

export interface CalendarItem {
  date: string;
  event: string;
  related: string;
  type: string;
  impact: 'High' | 'Medium' | 'Low';
  source_url: string;
}

export interface WatchItem {
  id: string;
  name: string;
  ticker: string;
  asset: string;
  region: string;
  stance: string;
  heat: number;
  move_1w: number | null;
  move_3m: number | null;
  direction: string;
  why: string;
  trigger: string;
  source_title: string;
  source_url: string;
}

export interface Theme {
  theme: string;
  direction: 'Heating' | 'Cooling' | 'Steady';
  heat: number;
  measure: string;
  read: string;
  linked?: string;
}

export interface Scan {
  scanned_at: string;
  opps: Idea[];
  note: Note;
  news: NewsItem[];
  calendar: CalendarItem[];
  watch: WatchItem[];
  themes: Theme[];
  markets?: MarketTile[];
  insights?: Insight[];
}

export interface MarketTile {
  id: string;
  name: string;
  symbol: string;
  group: string; // Indices, Commodities, Currencies, Bonds, Countries, Sectors
  price: number;
  unit?: string; // '$', '%', or ''
  decimals?: number;
  change_1d: number | null;
  change_5d: number | null;
  change_1m: number | null;
  change_ytd: number | null;
  series?: number[]; // oldest to newest, roughly 30 daily closes
  series_note?: string;
  popular?: boolean;
  featured?: boolean;
  read?: string;
}

export interface InsightRow {
  name: string;
  ticker?: string;
  href?: string | null;
  value: number;
  display?: string | null;
  split?: number[] | null; // [left, middle, right] counts, e.g. [sell, hold, buy]
  change_1d?: number | null;
  price?: number | null;
  ccy?: string;
  unit?: string;
  decimals?: number;
  note?: string | null;
}

export interface Insight {
  id: string;
  title: string;
  kind: 'hero' | 'pair';
  icon: string;
  measure: string;
  basis: string;
  period: string;
  format: 'pct' | 'pct0' | 'num' | 'vol' | 'score';
  split_labels?: string[] | null;
  blurb?: string;
  pair?: string | null;
  rows: InsightRow[];
}

export type RankedIdea = Idea & { score: number; rank: number };

export interface Alert {
  id?: number;
  ticker: string;
  name: string;
  market: string; // UK, US, Global
  kind: string; // Breakout, Sell-off, Unusual volume, Pre-results, Risk
  strength: 'Strong' | 'Watch';
  stance: 'Opportunity' | 'Caution';
  price?: number | null;
  ccy?: string;
  change_1d?: number | null;
  change_5d?: number | null;
  headline: string;
  why: string;
  check?: string;
  chart_symbol?: string;
  created_at?: string;
}

export interface DiveNews { date: string; title: string; source: string; url?: string; tone: 'Positive' | 'Negative' | 'Neutral'; why?: string }
export interface DivePerf { label: string; stock: number | null; bench: number | null }

export interface Dive {
  ticker: string;
  name: string;
  exchange?: string;
  currency?: string; // $, GBp, TWD, €
  chart_symbol?: string; // Yahoo style: TSM, PSN.L
  bench_symbol?: string;
  bench_name?: string;
  market?: string;
  sector?: string;
  price?: number | null;
  change_1d?: number | null;
  range_52w?: { low: number; high: number } | null;
  verdict: string; // Worth a closer look | Wait for a better entry | Avoid for now
  verdict_line: string;
  summary: string;
  why_moving?: string;
  opportunity?: number;
  risk?: number;
  ret_bear?: number;
  ret_base?: number;
  ret_bull?: number;
  horizon?: string;
  bull_case: string[];
  bear_case: string[];
  key_numbers?: { label: string; value: string; note?: string }[];
  performance?: DivePerf[];
  analysts?: { buy: number; hold: number; sell: number; target_low?: number | null; target_mean?: number | null; target_high?: number | null } | null;
  sentiment?: { tone: string; bullish: number; bearish: number; stories_90d?: number | null; attention_change?: number | null; note?: string } | null;
  news?: DiveNews[];
  catalysts?: { date: string; event: string }[];
  watch?: string[];
  sources?: { title: string; url: string }[];
  generated_by?: string;
}

export interface DiveRecord {
  id: number;
  ticker: string;
  status: 'queued' | 'running' | 'ready' | 'failed';
  source: 'scan' | 'live';
  created_at: string;
  updated_at: string;
  data: Dive | null;
  error?: string | null;
  stage?: string | null;
}
