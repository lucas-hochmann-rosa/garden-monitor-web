import type { ReactNode } from 'react';
import { getLatestClimate, listExamplePlants } from '@/modules/plants/server/plants.service';
import { listExampleRecords } from '@/modules/records/server/records.service';
import { summarizePlants } from '@/modules/dashboard/server/dashboard.service';
import { AppShell } from '@/shared/components/layout/AppShell';
import { DemoProvider } from '@/shared/demo/DemoProvider';

// Sempre renderizado sob demanda (nunca estático): os dados de exemplo vêm do
// banco a cada acesso, e a página não pode ser pré-gerada em build sem um banco
// disponível naquele momento.
export const dynamic = 'force-dynamic';

// Layout da demonstração pública (/demo/*): busca as plantas/registros de EXEMPLO
// uma única vez no servidor e entrega esse estado inicial ao DemoProvider, que passa
// a ser a fonte da verdade no client daí em diante (nenhuma sessão é exigida aqui -
// ver middleware.ts, que deixa toda a árvore /demo pública).
export default async function DemoLayout({ children }: { children: ReactNode }) {
  const [plants, records, climate] = await Promise.all([
    listExamplePlants(),
    listExampleRecords(),
    getLatestClimate(),
  ]);
  const summary = summarizePlants(plants, climate);

  return (
    <DemoProvider initialPlants={plants} initialRecords={records} climate={climate}>
      <AppShell mode="demo" alerts={summary.alerts}>
        {children}
      </AppShell>
    </DemoProvider>
  );
}
