// Autenticação do administrador da horta.
// Não existe tabela de usuários: a única credencial válida é definida pelas
// variáveis de ambiente ADMIN_USERNAME/ADMIN_PASSWORD_HASH (hash SHA-256 da senha,
// nunca a senha em texto puro). Gere o hash com:
//   node -e "console.log(require('crypto').createHash('sha256').update('SUA_SENHA').digest('hex'))"
// ou "npm run admin:hash -- SUA_SENHA" (ver scripts/hash-admin-password.ts).
import { createHash, timingSafeEqual } from 'node:crypto';

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

// Compara duas strings em tempo constante, evitando vazar por timing quanto do hash
// já bate (mitigação padrão para comparação de segredos).
function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

// Valida usuário/senha do admin contra as credenciais configuradas via env.
// Retorna false (em vez de lançar erro) se ADMIN_USERNAME/ADMIN_PASSWORD_HASH não
// estiverem configuradas, para não vazar detalhe de configuração ao cliente.
export function authenticateAdmin(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUsername || !expectedPasswordHash) return false;

  const usernameMatches = timingSafeEqualStrings(username.trim().toLowerCase(), expectedUsername.toLowerCase());
  const passwordMatches = timingSafeEqualStrings(sha256Hex(password), expectedPasswordHash.toLowerCase());

  return usernameMatches && passwordMatches;
}
