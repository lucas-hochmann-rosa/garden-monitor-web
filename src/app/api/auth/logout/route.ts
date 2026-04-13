import { NextResponse } from 'next/server';
import { destroySession } from '@/shared/lib/session';

// POST /api/auth/logout - encerra a sessão atual removendo o cookie.
export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
