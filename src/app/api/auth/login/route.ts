import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateAdmin } from '@/modules/auth/server/admin-auth.service';
import { createSession } from '@/shared/lib/session';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/auth/login - autentica o administrador contra ADMIN_USERNAME/
// ADMIN_PASSWORD_HASH (env) e grava o cookie de sessão em caso de sucesso.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: 'Usuário e senha são obrigatórios.' }, { status: 400 });
  }

  const isValid = authenticateAdmin(parsed.data.username, parsed.data.password);
  if (!isValid) {
    return NextResponse.json({ message: 'Usuário ou senha inválidos.' }, { status: 401 });
  }

  await createSession({ username: parsed.data.username.trim().toLowerCase(), loggedInAt: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
