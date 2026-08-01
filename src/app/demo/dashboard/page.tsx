import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel';
import type { DashboardSummary } from '@/modules/dashboard/types/dashboard.types';

// Página /demo/dashboard: não busca nada no servidor - o DemoProvider (montado no
// layout pai) já entregou os dados de exemplo ao DashboardPanel via contexto. As
// props abaixo existem só para satisfazer a assinatura do componente e nunca chegam
// a ser exibidas (o componente prioriza o contexto de demonstração quando presente).
const EMPTY_SUMMARY: DashboardSummary = {
  alerts: [],
  averageSoilMoisture: null,
  lastReadingAt: null,
  monitoredPlantsCount: 0,
  climate: { temperature: null, airHumidity: null, recordedAt: null },
};

export default function DemoDashboardPage() {
  return <DashboardPanel plants={[]} summary={EMPTY_SUMMARY} />;
}
