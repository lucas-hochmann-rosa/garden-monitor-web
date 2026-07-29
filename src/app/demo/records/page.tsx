import { RecordsPanel } from '@/modules/records/components/RecordsPanel';

// Página /demo/records: dados vêm do DemoProvider (contexto), não daqui - ver
// src/app/demo/dashboard/page.tsx para a explicação completa do padrão.
export default function DemoRecordsPage() {
  return <RecordsPanel records={[]} />;
}
