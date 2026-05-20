'use client';

// Casca visual comum às páginas do admin e da demonstração: sidebar, topbar, faixa
// de aviso (só no modo demo) e o modal de alertas.
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { SidebarNav } from '@/shared/components/layout/SidebarNav';
import { Topbar } from '@/shared/components/layout/Topbar';
import { DashboardAlertModal } from '@/modules/dashboard/components/DashboardAlertModal';
import { DemoModeBanner } from '@/shared/demo/DemoModeBanner';
import type { DashboardAlert } from '@/modules/dashboard/types/dashboard.types';

interface AppShellProps {
  children: ReactNode;
  mode: 'admin' | 'demo';
  adminUsername?: string;
  alerts: DashboardAlert[];
}

export function AppShell({ children, mode, adminUsername, alerts }: AppShellProps) {
  const router = useRouter();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const basePath = mode === 'admin' ? '/admin' : '/demo';

  const handleSignOut = async () => {
    if (mode === 'admin') {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <SidebarNav basePath={basePath} onSignOut={handleSignOut} signOutLabel={mode === 'admin' ? 'Sair' : 'Sair da demonstração'} />
      <Topbar mode={mode} adminUsername={adminUsername} alertsCount={alerts.length} onOpenAlerts={() => setIsAlertModalOpen(true)} />

      {mode === 'demo' && (
        <div className="fixed top-16 right-0 left-64 z-[5]">
          <DemoModeBanner />
        </div>
      )}

      <div className={mode === 'demo' ? 'pt-9' : ''}>{children}</div>

      {isAlertModalOpen && (
        <DashboardAlertModal
          alerts={alerts}
          onClose={() => setIsAlertModalOpen(false)}
          onNavigateToPlant={(plantId) => {
            setIsAlertModalOpen(false);
            router.push(`${basePath}/plants?plantId=${plantId}`);
          }}
        />
      )}
    </div>
  );
}
