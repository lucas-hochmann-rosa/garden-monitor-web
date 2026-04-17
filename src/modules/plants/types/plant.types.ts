// Tipos do domínio "plantas". Um Plant representa um slot de cultivo cadastrado na
// horta; a temperatura NÃO faz parte dele (é uma medida da horta inteira, ver
// GardenClimate em dashboard.types.ts) - só umidade do solo e pH são por planta.
export type PlantStatus = 'healthy' | 'warning';

export interface PlantRange {
  min: number;
  max: number;
}

export interface Plant {
  id: string;
  name: string;
  scientificName?: string;
  slot: string;
  soilMoisture: number;
  pH: number;
  growth: number;
  status: PlantStatus;
  image?: string;
  /** true = planta de demonstração (semeada via scripts/seed.ts), nunca recebe leitura real. */
  isExample: boolean;
  plantedDate?: string;
  estimatedDate?: string;
  idealMoisture?: PlantRange;
  idealPH?: PlantRange;
  idealTemp?: PlantRange;
  autoIrrigation?: boolean;
  irrigationAmount?: number;
  irrigationInterval?: number;
  notes?: string;
  /** true quando já existe ao menos uma leitura real enviada pelo ESP8266 para esta planta. */
  hasRealReading: boolean;
  lastReadingAt?: string;
}

export type PlantFormInput = {
  name: string;
  scientificName?: string;
  slot: string;
  plantedDate?: string;
  estimatedDate?: string;
  idealMoisture?: PlantRange;
  idealPH?: PlantRange;
  idealTemp?: PlantRange;
  autoIrrigation?: boolean;
  irrigationAmount?: number;
  irrigationInterval?: number;
  notes?: string;
  image?: string;
};
