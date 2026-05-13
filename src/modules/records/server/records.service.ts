// Acesso a dados do histórico de atividades da horta (tabela "records").
import { sql } from '@/shared/lib/db';
import type { GardenRecord, NewRecordInput, RecordType } from '@/modules/records/types/record.types';

interface RecordRow {
  id: string;
  type: RecordType;
  title: string;
  description: string;
  author: string;
  plant_name: string | null;
  created_at: string;
}

function mapRowToRecord(row: RecordRow): GardenRecord {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    author: row.author,
    plant: row.plant_name ?? undefined,
    date: new Date(row.created_at).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

// Lista o histórico de atividades da horta, do mais recente para o mais antigo.
export async function listRecords(): Promise<GardenRecord[]> {
  const rows = (await sql`
    select r.id, r.type, r.title, r.description, r.author, r.created_at, p.name as plant_name
    from records r
    left join plants p on p.id = r.plant_id
    order by r.created_at desc
    limit 200
  `) as unknown as RecordRow[];

  return rows.map(mapRowToRecord);
}

// Lista só os registros ligados a plantas de exemplo (usado pela rota pública
// /demo, que nunca deve expor o histórico de atividades da horta real).
export async function listExampleRecords(): Promise<GardenRecord[]> {
  const rows = (await sql`
    select r.id, r.type, r.title, r.description, r.author, r.created_at, p.name as plant_name
    from records r
    join plants p on p.id = r.plant_id
    where p.is_example = true
    order by r.created_at desc
    limit 200
  `) as unknown as RecordRow[];

  return rows.map(mapRowToRecord);
}

// Cria uma nova entrada no histórico de atividades.
export async function createRecord(input: NewRecordInput): Promise<GardenRecord> {
  const rows = (await sql`
    insert into records (type, title, description, author, plant_id)
    values (${input.type}, ${input.title}, ${input.description}, ${input.author}, ${input.plantId || null})
    returning id, type, title, description, author, created_at,
      (select name from plants where id = ${input.plantId || null}) as plant_name
  `) as unknown as RecordRow[];

  return mapRowToRecord(rows[0]!);
}
