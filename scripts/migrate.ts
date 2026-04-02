// Script de migração do banco.
// Lê db/schema.sql e executa contra o Postgres apontado por DATABASE_URL. Todas as
// declarações do schema usam "create table if not exists"/"create index if not
// exists", então rodar este script várias vezes seguidas é seguro (idempotente).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

// Uso: npm run db:migrate
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Defina DATABASE_URL antes de rodar a migração.');

  const schemaPath = resolve(process.cwd(), 'db/schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(schemaSql);
    console.log('Schema aplicado com sucesso.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Falha ao aplicar o schema:', error);
  process.exitCode = 1;
});
