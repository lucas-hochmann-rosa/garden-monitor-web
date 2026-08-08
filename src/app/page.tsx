import Link from 'next/link';
import { Sprout } from 'lucide-react';
import { BrandMark } from '@/shared/components/layout/BrandMark';
import { getGardenName } from '@/modules/settings/server/garden-settings.service';

// Sempre renderizada sob demanda: o nome da horta vem do banco e não deve ficar
// congelado no HTML gerado em build.
export const dynamic = 'force-dynamic';

// Landing page pública: nome da horta (banco) e a porta de entrada da
// demonstração pública. A rota /admin não tem link nenhum aqui de propósito -
// fica de acesso restrito a quem já sabe o endereço (só o administrador).
export default async function LandingPage() {
  const gardenName = await getGardenName();

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
      <BrandMark size="lg" />

      <h1 className="text-3xl font-bold text-[#324b2c] mt-6">{gardenName}</h1>
      <p className="text-sm text-[#6c757d] mt-2 max-w-md">
        Monitoramento em tempo real de umidade do solo, pH e clima da sua horta.
      </p>

      <Link
        href="/demo/dashboard"
        className="mt-8 px-6 py-3 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#718f60] active:scale-95 transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
      >
        <Sprout className="w-4 h-4" /> Ver demonstração
      </Link>
    </main>
  );
}
