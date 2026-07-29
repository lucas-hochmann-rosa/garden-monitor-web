import { PlantsPanel } from '@/modules/plants/components/PlantsPanel';

// Página /demo/plants: dados vêm do DemoProvider (contexto), não daqui - ver
// src/app/demo/dashboard/page.tsx para a explicação completa do padrão.
export default function DemoPlantsPage() {
  return <PlantsPanel plants={[]} />;
}
