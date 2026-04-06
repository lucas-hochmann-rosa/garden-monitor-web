// Sessão do administrador (cookie httpOnly assinado com JWT via "jose").
// Existe uma única identidade autenticada no sistema (o admin da horta, ver
// src/modules/auth/server/admin-auth.service.ts) - não há mais papéis/perfis, então
// o payload da sessão só guarda o essencial para exibir "logado como" na interface.
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'garden_monitor_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // sessão válida por 7 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('A variável de ambiente SESSION_SECRET não foi definida.');
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  username: string;
  loggedInAt: string;
  [key: string]: unknown;
}

// Assina o payload da sessão em um JWT e grava no cookie httpOnly.
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// Remove o cookie de sessão (logout).
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Lê e valida o cookie de sessão da requisição atual (Server Component/Route Handler).
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
