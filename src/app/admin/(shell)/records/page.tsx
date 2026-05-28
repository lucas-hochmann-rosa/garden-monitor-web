import { listRecords } from '@/modules/records/server/records.service';
import { RecordsPanel } from '@/modules/records/components/RecordsPanel';

// Página /admin/records: histórico completo de atividades da horta.
export default async function AdminRecordsPage() {
  const records = await listRecords();

  return <RecordsPanel records={records} />;
}
