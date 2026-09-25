import dynamicImport from 'next/dynamic';

const DashboardHomeContent = dynamicImport(() => import('./page-content').then(mod => ({ default: mod.DashboardHomeContent })), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default function DashboardHome() {
  return <DashboardHomeContent />;
}
