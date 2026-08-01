// Configurações globais da horta (hoje só o nome exibido na landing page pública).
// Guardadas em uma tabela de linha única (garden_settings) em vez de uma variável de
// ambiente pura, para que o admin possa trocar o nome sem precisar de um novo deploy.
import { sql } from '@/shared/lib/db';

const FALLBACK_GARDEN_NAME = 'Garden Monitor';

// Lê o nome da horta cadastrado no banco. Se a linha ainda não existir (banco recém
// migrado, seed não rodou), cai para GARDEN_NAME (env) ou um nome padrão.
export async function getGardenName(): Promise<string> {
  const rows = (await sql`select garden_name from garden_settings where id = true`) as unknown as {
    garden_name: string;
  }[];

  return rows[0]?.garden_name ?? process.env.GARDEN_NAME ?? FALLBACK_GARDEN_NAME;
}

// Atualiza (ou cria, se ainda não existir) o nome da horta.
export async function setGardenName(gardenName: string): Promise<void> {
  await sql`
    insert into garden_settings (id, garden_name)
    values (true, ${gardenName})
    on conflict (id) do update set garden_name = excluded.garden_name
  `;
}
