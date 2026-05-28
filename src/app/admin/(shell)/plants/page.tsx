import { listPlants } from '@/modules/plants/server/plants.service';
import { PlantsPanel } from '@/modules/plants/components/PlantsPanel';

// Página /admin/plants: gestão completa das plantas (exemplo + reais).
export default async function AdminPlantsPage() {
  const plants = await listPlants();

  return <PlantsPanel plants={plants} />;
}
