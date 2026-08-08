import { getLatestClimate, listPlants } from '@/modules/plants/server/plants.service';
import { summarizePlants } from '@/modules/dashboard/server/dashboard.service';
import { mergeClimateWithWeatherFallback } from '@/modules/dashboard/lib/climate-fallback';
import { getCurrentWeather } from '@/shared/lib/weather';
import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel';

// Página /admin/dashboard: busca as plantas reais (com a última leitura de sensor),
// o clima da horta e, como reforço enquanto nenhum hub publicou clima ainda, o
// clima real da região - e deriva o resumo sem nova consulta.
export default async function AdminDashboardPage() {
  const [plants, climate, weather] = await Promise.all([listPlants(), getLatestClimate(), getCurrentWeather()]);
  const summary = summarizePlants(plants, mergeClimateWithWeatherFallback(climate, weather));

  return <DashboardPanel plants={plants} summary={summary} />;
}
