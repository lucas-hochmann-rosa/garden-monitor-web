'use client';

// Menu lateral fixo, compartilhado entre o admin autenticado (/admin/*) e a
// demonstração pública (/demo/*) - o prop "basePath" decide para onde cada item
// aponta e o rótulo do botão de saída muda conforme o modo.
import { FileText, HelpCircle, Home, Info, LogOut, Sprout } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/shared/components/layout/BrandMark';
import { FOCUS_RING_ONLY, INTERACTIVE_OUTLINE } from '@/shared/lib/interaction-styles';

interface SidebarNavProps {
  basePath: '/admin' | '/demo';
  onSignOut: () => void;
  signOutLabel: string;
}

export function SidebarNav({ basePath, onSignOut, signOutLabel }: SidebarNavProps) {
  const pathname = usePathname();
  const isDemo = basePath === '/demo';

  const menuItems = [
    { path: `${basePath}/dashboard`, label: 'Dashboard', icon: Home, show: true },
    { path: `${basePath}/plants`, label: 'Plantas', icon: Sprout, show: true },
    { path: `${basePath}/records`, label: 'Registros', icon: FileText, show: true },
    { path: `${basePath}/about`, label: 'Sobre', icon: Info, show: true },
    { path: `${basePath}/support`, label: 'Suporte', icon: HelpCircle, show: !isDemo },
  ].filter((item) => item.show);

  return (
    <aside className="w-64 h-screen bg-white border-r border-[#dee2e6] flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[#dee2e6] flex items-center justify-center">
        <BrandMark />
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 ${INTERACTIVE_OUTLINE} ${
                isActive ? 'bg-[#f1f5f0] border-[#c8d9c0] text-[#324b2c]' : 'text-[#6c757d]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-[#324b2c]' : 'text-[#6c757d]'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-[#dee2e6] pt-3">
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors group ${FOCUS_RING_ONLY}`}
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
          <span className="font-medium">{signOutLabel}</span>
        </button>
      </div>
    </aside>
  );
}
