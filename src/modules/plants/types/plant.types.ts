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
  /** null = planta real que ainda não recebeu nenhuma leitura do sensor (nunca é null para plantas de exemplo). */
  soilMoisture: number | null;
  pH: number | null;
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
  /** Marcado manualmente pelo admin - só fica "true" depois que o relé/bomba forem instalados de verdade. */
  irrigationHardwareInstalled: boolean;
  /** Última vez que o backend emitiu um comando de irrigação automática (não confirma que a água saiu - ver firmware/README.md). */
  lastAutoIrrigationAt?: string;
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
  irrigationHardwareInstalled?: boolean;
  notes?: string;
  image?: string;
};
