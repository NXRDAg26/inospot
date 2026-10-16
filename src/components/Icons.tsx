const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconToday = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>
);
export const IconIdeas = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M4 19h16" /><path d="m5 15 4.5-5 3.5 3 6-7" /></svg>
);
export const IconResearch = () => (
  <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
);
export const IconMarkets = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M6 4h12v16H6z" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /></svg>
);
export const IconCalendar = () => (
  <svg viewBox="0 0 24 24" {...s}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const IconBell = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>
);
export const IconBack = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" {...s}><path d="m15 5-7 7 7 7" /></svg>
);
export const IconInsights = () => (
  <svg viewBox="0 0 24 24" {...s}><path d="m3.5 17 5-5.5 4 3 7.5-8" /><path d="M17 6.5h3v3" /><path d="M5 5.5v2M4 6.5h2" /></svg>
);

const INS: Record<string, JSX.Element> = {
  candles: <><path d="M7 4v16M17 4v16" /><rect x="4.5" y="8" width="5" height="8" rx="1" /><rect x="14.5" y="6" width="5" height="7" rx="1" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  bookmark: <path d="M6.5 3.5h11v17L12 16.5l-5.5 4Z" />,
  chart: <path d="M6 19v-6M12 19V6M18 19v-9" />,
  trend: <><path d="m3.5 16.5 5.5-5.5 4 4 7.5-7.5" /><path d="M15 7.5h5.5V13" /></>,
  layers: <><path d="m12 3.5 9 4.5-9 4.5L3 8Z" /><path d="m3 12 9 4.5 9-4.5" /><path d="m3 16 9 4.5 9-4.5" /></>,
};
export const InsightIcon = ({ name }: { name: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...s}>{INS[name] ?? INS.chart}</svg>
);
export const Mark =({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="2.4" />
    <circle cx="12" cy="12" r="3" fill="#fff" />
  </svg>
);
