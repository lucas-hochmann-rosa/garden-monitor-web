import { redirect } from 'next/navigation';
import { getSession } from '@/shared/lib/session';
import { LoginScreen } from '@/modules/auth/components/LoginScreen';

// Rota de entrada do admin: quem já está logado pula direto para o dashboard;
// senão, mostra a tela de login (sem sidebar/topbar - essa rota não vive dentro do
// grupo "(shell)").
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  if (session) redirect('/admin/dashboard');

  return <LoginScreen />;
}
