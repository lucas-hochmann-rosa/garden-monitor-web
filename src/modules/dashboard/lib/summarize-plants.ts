// Função pura (sem acesso a banco) que deriva o resumo do dashboard a partir de uma
// lista de plantas e do clima da horta já carregados. Fica separada de
// dashboard.service.ts (que busca os dados no Postgres) para poder ser usada também
// no client, pelo DemoProvider (src/shared/demo/DemoProvider.tsx) - um arquivo que
// importasse o serviço de banco não poderia ser incluído no bundle do navegador.
import type { Plant } from '@/modules/plants/types/plant.types';
import type { DashboardSummary, GardenClimate } from '@/modules/dashboard/types/dashboard.types';

export function summarizePlants(plants: Plant[], climate: GardenClimate): DashboardSummary {
  const alerts = plants
    .filter((plant) => plant.status === 'warning')
    .map((plant) => ({
      id: plant.id,
      name: plant.name,
      status: 'warning' as const,
      issue: plant.idealMoisture
        ? `Umidade do solo em ${plant.soilMoisture}% (ideal: ${plant.idealMoisture.min}%-${plant.idealMoisture.max}%)`
        : 'Leitura fora da faixa ideal',
    }));

  const plantsWithRealReading = plants.filter((plant) => plant.hasRealReading);

  // hasRealReading só é true depois de uma leitura de verdade (ver plants.service.ts),
  // então soilMoisture nunca é null aqui - o "!" só satisfaz o TypeScript.
  const averageSoilMoisture =
    plantsWithRealReading.length > 0
      ? Math.round(
          (plantsWithRealReading.reduce((total, plant) => total + plant.soilMoisture!, 0) /
            plantsWithRealReading.length) *
            10,
        ) / 10
      : null;

  const lastReadingAt = plantsWithRealReading.map((plant) => plant.lastReadingAt!).sort().at(-1) ?? null;

  return {
    alerts,
    averageSoilMoisture,
    lastReadingAt,
    monitoredPlantsCount: plants.length,
    climate,
  };
}
