// Script de seed do banco.
// Popula os dados que a horta precisa para nascer com alguma coisa na tela:
// o nome da horta e um punhado de plantas de EXEMPLO (com registros de atividade
// associados) usadas pela rota pública /demo. Não cria nenhum usuário: o acesso
// administrativo (/admin) é autenticado via variáveis de ambiente, não por uma
// linha de banco (ver src/modules/auth/server/admin-auth.service.ts).
// Idempotente: pode ser executado várias vezes sem duplicar registros.
// Uso: npm run db:seed
import { Client } from 'pg';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Defina DATABASE_URL antes de rodar o seed.');

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const gardenName = process.env.GARDEN_NAME ?? 'Horta do Lucas';

    // "on conflict (id) do update" mantém o nome sempre sincronizado com a env
    // em vez de travar no primeiro valor semeado.
    await client.query(
      `insert into garden_settings (id, garden_name)
       values (true, $1)
       on conflict (id) do update set garden_name = excluded.garden_name`,
      [gardenName],
    );

    const plantRows = (await client.query(
      `insert into plants (
        name, scientific_name, slot, image_url, is_example, planted_date, estimated_harvest_date,
        ideal_moisture_min, ideal_moisture_max, ideal_ph_min, ideal_ph_max,
        ideal_temp_min, ideal_temp_max, auto_irrigation, irrigation_amount_ml, irrigation_interval_hours,
        baseline_soil_moisture, baseline_ph
       )
       values
        ('Alface', 'Lactuca sativa', 'Exemplo 1', '/images/lettuce.png', true, '2026-03-10', '2026-04-10', 60, 80, 6.0, 7.0, 16, 22, false, null, null, 40, 6.4),
        ('Tomate', 'Solanum lycopersicum', 'Exemplo 2', '/images/tomato.png', true, '2026-03-10', '2026-05-15', 50, 70, 6.0, 6.8, 18, 27, true, 250, 12, 55, 6.4),
        ('Couve', 'Brassica oleracea', 'Exemplo 3', null, true, '2026-03-01', '2026-04-05', 60, 80, 6.0, 7.5, 15, 24, false, null, null, 65, 6.4)
       on conflict (slot) do update set name = excluded.name
       returning id, slot`,
    )) as unknown as { rows: { id: string; slot: string }[] };

    const plantIdBySlot = new Map(plantRows.rows.map((row) => [row.slot, row.id]));

    // "records" não tem uma chave natural para "on conflict"; a checagem
    // "where not exists" evita duplicar as linhas de exemplo a cada rerun do seed.
    await client.query(
      `insert into records (type, title, description, author, plant_id)
       select 'system', 'Planta cadastrada', 'Registro inicial da planta de demonstração.', 'Sistema', p.id
       from plants p
       where p.slot in ('Exemplo 1', 'Exemplo 2', 'Exemplo 3')
         and not exists (
           select 1 from records r where r.plant_id = p.id and r.title = 'Planta cadastrada'
         )`,
    );

    const tomatoId = plantIdBySlot.get('Exemplo 2');
    if (tomatoId) {
      await client.query(
        `insert into records (type, title, description, author, plant_id)
         select 'manual-irrigation', 'Irrigação manual', 'Irrigação de 250ml aplicada manualmente.', 'Administrador', $1
         where not exists (
           select 1 from records where plant_id = $1 and title = 'Irrigação manual'
         )`,
        [tomatoId],
      );
    }

    console.log('Seed concluído com sucesso (horta: ' + gardenName + ', plantas de exemplo: Alface/Tomate/Couve).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Falha ao aplicar o seed:', error);
  process.exitCode = 1;
});
