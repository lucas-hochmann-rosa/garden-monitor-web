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

// O hub publica a cada READING_INTERVAL_MS do firmware (5 min por padrão) - um
// limite bem mais folgado que isso já indica hub offline/com problema, sem gerar
// falso positivo por um ciclo perdido isolado (rede instável, reinício, etc.).
export const STALE_READING_THRESHOLD_MS = 30 * 60 * 1000;

// "Sensor parado": a planta já teve leitura real alguma vez, mas faz tempo demais
// que não chega uma nova. Plantas de exemplo e plantas que nunca leram nada (ver
// hasRealReading) não entram aqui - esses casos já têm indicador próprio.
export function isSensorStale(hasRealReading: boolean, lastReadingAt: string | undefined): boolean {
  if (!hasRealReading || !lastReadingAt) return false;
  return Date.now() - new Date(lastReadingAt).getTime() > STALE_READING_THRESHOLD_MS;
}
