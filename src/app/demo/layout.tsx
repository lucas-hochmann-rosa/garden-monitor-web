import type { ReactNode } from 'react';
import { getLatestClimate, listPlants } from '@/modules/plants/server/plants.service';
import { listExampleRecords } from '@/modules/records/server/records.service';
import { summarizePlants } from '@/modules/dashboard/server/dashboard.service';
import { mergeClimateWithWeatherFallback } from '@/modules/dashboard/lib/climate-fallback';
import { getCurrentWeather } from '@/shared/lib/weather';
import { AppShell } from '@/shared/components/layout/AppShell';
import { DemoProvider } from '@/shared/demo/DemoProvider';

// Layout da demonstração pública (/demo/*): busca TODAS as plantas (exemplo + reais
// da horta) uma única vez no servidor e entrega esse estado inicial ao
// DemoProvider, que passa a ser a fonte da verdade no client daí em diante -
// nenhuma sessão é exigida aqui (ver middleware.ts, que deixa toda a árvore /demo
// pública). Plantas reais aparecem com o selo REAL e, se ainda não tiverem
// recebido leitura, mostram "sem leitura" em vez de qualquer dado inventado - só
// as plantas de exemplo usam valor de referência.
export const dynamic = 'force-dynamic';

export default async function DemoLayout({ children }: { children: ReactNode }) {
  const [plants, records, climate, weather] = await Promise.all([
    listPlants(),
    listExampleRecords(),
    getLatestClimate(),
    getCurrentWeather(),
  ]);
  const effectiveClimate = mergeClimateWithWeatherFallback(climate, weather);
  const summary = summarizePlants(plants, effectiveClimate);

  return (
    <DemoProvider initialPlants={plants} initialRecords={records} climate={effectiveClimate}>
      <AppShell mode="demo" alerts={summary.alerts}>
        {children}
      </AppShell>
    </DemoProvider>
  );
}
