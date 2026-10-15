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
export const Mark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="2.4" />
    <circle cx="12" cy="12" r="3" fill="#fff" />
  </svg>
);
