// Tipos do resumo exibido no topo do dashboard.
export interface DashboardAlert {
  id: string;
  name: string;
  status: 'warning';
  issue?: string;
}

// Última leitura de clima da horta (sensor DHT11 do hub ESP8266) - compartilhada por
// todas as plantas, não por slot.
export interface GardenClimate {
  temperature: number | null;
  airHumidity: number | null;
  recordedAt: string | null;
}

export interface DashboardSummary {
  alerts: DashboardAlert[];
  averageSoilMoisture: number | null;
  lastReadingAt: string | null;
  monitoredPlantsCount: number;
  climate: GardenClimate;
}
