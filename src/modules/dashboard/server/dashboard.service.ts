// Busca plantas + clima no banco e monta o resumo do dashboard. A conta em si
// (alertas, umidade média) fica em summarize-plants.ts (função pura, reaproveitada
// pelo modo de demonstração no client).
import { getLatestClimate, listPlants } from '@/modules/plants/server/plants.service';
import { summarizePlants } from '@/modules/dashboard/lib/summarize-plants';
import type { DashboardSummary } from '@/modules/dashboard/types/dashboard.types';

export { summarizePlants };

// Usado no layout do admin, fora da própria página de dashboard, para alimentar o
// sino de alertas em qualquer tela.
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [plants, climate] = await Promise.all([listPlants(), getLatestClimate()]);
  return summarizePlants(plants, climate);
}
