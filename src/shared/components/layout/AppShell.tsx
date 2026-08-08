'use client';

// Casca visual comum às páginas do admin e da demonstração: sidebar fixa à
// esquerda e, à direita, uma coluna com o cabeçalho (Topbar + faixa de aviso, só
// no modo demo) "sticky" no topo e o conteúdo da página rolando por baixo dele.
// Antes o Topbar e a faixa eram elementos "fixed" independentes com a página
// tentando adivinhar, via padding-top manual, a altura combinada dos dois -
// bastava a faixa existir para o cálculo furar e o conteúdo desenhar por cima
// dela. Com os dois dentro do mesmo wrapper "sticky", a altura do cabeçalho
// nunca precisa ser adivinhada.
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
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <SidebarNav
        basePath={basePath}
        onSignOut={handleSignOut}
        signOutLabel={mode === 'admin' ? 'Sair' : 'Sair da demonstração'}
      />

      <div className="flex-1 ml-64 h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0 sticky top-0 z-10">
          <Topbar
            mode={mode}
            adminUsername={adminUsername}
            alertsCount={alerts.length}
            onOpenAlerts={() => setIsAlertModalOpen(true)}
          />
          {mode === 'demo' && <DemoModeBanner />}
        </div>

        <div className="flex-1 min-h-0">{children}</div>
      </div>

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
