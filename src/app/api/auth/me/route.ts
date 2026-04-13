import { NextResponse } from 'next/server';
import { getSession } from '@/shared/lib/session';

// GET /api/auth/me - retorna os dados básicos do usuário autenticado (via cookie de sessão).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  return NextResponse.json({ session });
}
