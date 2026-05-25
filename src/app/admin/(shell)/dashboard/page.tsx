import { getLatestClimate, listPlants } from '@/modules/plants/server/plants.service';
import { summarizePlants } from '@/modules/dashboard/server/dashboard.service';
import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel';

// Página /admin/dashboard: busca as plantas reais (com a última leitura de sensor)
// e o clima da horta no servidor, e deriva o resumo sem nova consulta.
export default async function AdminDashboardPage() {
  const [plants, climate] = await Promise.all([listPlants(), getLatestClimate()]);
  const summary = summarizePlants(plants, climate);

  return <DashboardPanel plants={plants} summary={summary} />;
}
