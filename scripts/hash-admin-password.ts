// Utilitário de linha de comando para gerar o valor de ADMIN_PASSWORD_HASH.
// Uso: npm run admin:hash -- "minha-senha-forte"
import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Uso: npm run admin:hash -- "sua-senha"');
  process.exitCode = 1;
} else {
  console.log(createHash('sha256').update(password, 'utf8').digest('hex'));
}
