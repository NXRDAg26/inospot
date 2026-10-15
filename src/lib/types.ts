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
}

export type RankedIdea = Idea & { score: number; rank: number };
