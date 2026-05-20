'use client';

// Barra superior fixa: título da página atual, sino de alertas e um selo indicando
// se a sessão é o admin de verdade ou a demonstração pública (nunca mostra "ADMIN"
// dentro do modo de demonstração, para não sugerir que aquele acesso é privilegiado).
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'DASHBOARD',
  plants: 'PLANTAS',
  records: 'REGISTROS',
  about: 'SOBRE',
  support: 'SUPORTE',
};

interface TopbarProps {
  mode: 'admin' | 'demo';
  adminUsername?: string;
  alertsCount: number;
  onOpenAlerts: () => void;
}

export function Topbar({ mode, adminUsername, alertsCount, onOpenAlerts }: TopbarProps) {
  const pathname = usePathname();
  const lastSegment = pathname.split('/').pop() ?? '';
  const pageTitle = PAGE_TITLES[lastSegment] ?? 'DASHBOARD';
  const isDemo = mode === 'demo';

  return (
    <header className="h-16 bg-white border-b border-[#dee2e6] flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      <h2 className="text-sm font-bold text-[#324b2c] tracking-wider">{pageTitle}</h2>

      <div className="flex items-center gap-4">
        {alertsCount > 0 && (
          <button
            onClick={onOpenAlerts}
            className="relative p-2 hover:bg-[#f8f9fa] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#718f60]"
            aria-label="Notificações de alerta"
          >
            <Bell className="w-6 h-6 text-[#324b2c]" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse bg-[#bb4d00]" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isDemo ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-[#f1f5f0] text-[#324b2c] border border-[#c8d9c0]'
            }`}
          >
            {isDemo ? 'DEMONSTRAÇÃO' : 'ADMIN'}
          </span>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#324b2c] to-[#718f60] flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {isDemo ? 'D' : (adminUsername?.charAt(0).toUpperCase() ?? 'A')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
