import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { SESSION_COOKIE_NAME } from '@/shared/lib/session';

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

// Guarda de acesso ao admin: tudo sob /admin exige sessão válida, exceto a própria
// rota /admin (que é a tela de login). /demo/* e a landing pública (/) não passam
// por nenhuma checagem - são abertas por design.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || !pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, getSecretKey());
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
