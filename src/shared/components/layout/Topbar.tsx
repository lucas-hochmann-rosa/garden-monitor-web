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
    <header className="h-16 bg-white border-b border-[rgba(0,0,0,.1)] flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      <h2 className="text-sm font-medium text-[#204a6f] tracking-wider">{pageTitle}</h2>

      <div className="flex items-center gap-4">
        {alertsCount > 0 && (
          <button
            onClick={onOpenAlerts}
            className="relative p-2 hover:bg-[#fbf7f1] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#204a6f]"
            aria-label="Notificações de alerta"
          >
            <Bell className="w-6 h-6 text-[#204a6f]" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse bg-[#a32b3c]" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isDemo ? 'bg-[rgba(138,106,16,.08)] text-[#8a6a10] border border-[rgba(138,106,16,.25)]' : 'bg-[rgba(32,74,111,.1)] text-[#204a6f] border border-[rgba(32,74,111,.2)]'
            }`}
          >
            {isDemo ? 'DEMONSTRAÇÃO' : 'ADMIN'}
          </span>
          <div className="w-10 h-10 rounded-full bg-[#204a6f] flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {isDemo ? 'D' : (adminUsername?.charAt(0).toUpperCase() ?? 'A')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
