// Fórmulas puras de "crescimento" e "status" de uma planta, compartilhadas entre o
// servidor (src/modules/plants/server/plants.service.ts, lendo do banco) e o modo de
// demonstração no client (src/shared/demo/DemoProvider.tsx, que simula uma planta
// recém-criada sem nenhuma leitura de sensor real) - mesma regra nos dois lugares.
import type { PlantRange, PlantStatus } from '@/modules/plants/types/plant.types';

// Calcula o progresso de crescimento (%) a partir da data de plantio e da colheita estimada.
export function calculateGrowthPercent(plantedDate: string | null | undefined, estimatedDate: string | null | undefined): number {
  if (!plantedDate || !estimatedDate) return 0;

  const planted = new Date(plantedDate).getTime();
  const estimated = new Date(estimatedDate).getTime();
  const totalDays = (estimated - planted) / 86_400_000;
  if (totalDays <= 0) return 0;

  const elapsedDays = (Date.now() - planted) / 86_400_000;
  return Math.round(Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100));
}

function isOutOfRange(value: number | null | undefined, range?: PlantRange): boolean {
  if (value === null || value === undefined || !range) return false;
  return value < range.min || value > range.max;
}

// Deriva o status da planta comparando solo, pH e temperatura da horta com as faixas
// ideais cadastradas - qualquer um dos três fora da faixa já marca "warning".
export function calculateStatus(
  soilMoisture: number | null,
  pH: number | null,
  gardenTemperature: number | null,
  idealMoisture?: PlantRange,
  idealPH?: PlantRange,
  idealTemp?: PlantRange,
): PlantStatus {
  const hasAlert =
    isOutOfRange(soilMoisture, idealMoisture) || isOutOfRange(pH, idealPH) || isOutOfRange(gardenTemperature, idealTemp);
  return hasAlert ? 'warning' : 'healthy';
}
