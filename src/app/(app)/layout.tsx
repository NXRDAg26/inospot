import { SideNav, TabBar } from '@/components/Nav';
import { getScan } from '@/lib/data';
import { shortDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const scan = await getScan();
  return (
    <>
      <div className="shell">
        <SideNav stamp={shortDate(scan.scanned_at)} />
        <main className="main">{children}</main>
      </div>
      <TabBar />
    </>
  );
}
