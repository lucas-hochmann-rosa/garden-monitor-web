import { neon } from '@neondatabase/serverless';

// Cliente SQL do Neon Postgres via HTTP (fetch) - ideal para serverless (Vercel).
// Uso: await sql`select * from plants where id = ${id}`
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('A variável de ambiente DATABASE_URL não foi definida.');
}

export const sql = neon(databaseUrl);
