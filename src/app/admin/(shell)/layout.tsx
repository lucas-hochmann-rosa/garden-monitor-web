import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSession } from '@/shared/lib/session';
import { getDashboardSummary } from '@/modules/dashboard/server/dashboard.service';
import { AppShell } from '@/shared/components/layout/AppShell';

// Layout das páginas autenticadas do admin (/admin/dashboard, /plants, ...):
// resolve a sessão e os alertas ativos no servidor. O middleware já bloqueia quem
// não está logado antes de chegar aqui; esta checagem é só uma garantia extra.
export const dynamic = 'force-dynamic';

export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin');

  const summary = await getDashboardSummary();

  return (
    <AppShell mode="admin" adminUsername={session.username} alerts={summary.alerts}>
      {children}
    </AppShell>
  );
}
