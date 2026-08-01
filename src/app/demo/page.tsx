import { redirect } from 'next/navigation';

// A raiz de /demo não renderiza nada por si só - encaminha para o dashboard.
export default function DemoRootPage() {
  redirect('/demo/dashboard');
}
