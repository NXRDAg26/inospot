'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconBell, IconCalendar, IconIdeas, IconInsights, IconMarkets, IconResearch, IconToday, Mark } from './Icons';

const items = [
  { href: '/', label: 'Today', Icon: IconToday },
  { href: '/ideas', label: 'Ideas', Icon: IconIdeas },
  { href: '/markets', label: 'Markets', Icon: IconMarkets },
  { href: '/insights', label: 'Insights', Icon: IconInsights },
  { href: '/research', label: 'Research', Icon: IconResearch },
  { href: '/calendar', label: 'Calendar', Icon: IconCalendar },
];

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href));

export function SideNav({ stamp }: { stamp: string }) {
  const path = usePathname() || '/';
  return (
    <aside className="side">
      <Link href="/" className="brand"><span className="brand-mark"><Mark /></span>Inospot</Link>
      <nav className="navlist" aria-label="Main">
        {items.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="navlink" aria-current={isActive(path, href) ? 'page' : undefined}>
            <Icon />{label}
          </Link>
        ))}
        <Link href="/alerts" className="navlink" aria-current={isActive(path, '/alerts') ? 'page' : undefined}>
          <IconBell />Alerts
        </Link>
      </nav>
      <div className="side-foot">Updated {stamp}</div>
    </aside>
  );
}

export function TabBar() {
  const path = usePathname() || '/';
  return (
    <nav className="tabbar" aria-label="Main">
      {items.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className="tab" aria-current={isActive(path, href) ? 'page' : undefined}>
          <Icon />{label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileTop() {
  return (
    <div className="mobile-top">
      <Link href="/" className="brand"><span className="brand-mark"><Mark /></span>Inospot</Link>
      <Link href="/alerts" aria-label="Alerts" style={{ width: 24, height: 24, display: 'block' }}><IconBell /></Link>
    </div>
  );
}
