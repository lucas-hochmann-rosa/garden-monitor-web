'use client';

// Tela de login do administrador (/admin). Única porta de entrada autenticada do
// sistema - não existe mais um botão de "visitante": quem quiser só olhar a horta
// sem entrar usa a demonstração pública (/demo), que não passa por aqui.
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/shared/components/layout/BrandMark';

export function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setErrorMessage(data?.message ?? 'Usuário ou senha inválidos.');
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-2.5 bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] rounded-xl text-sm text-[#204a6f] placeholder:text-[rgba(0,0,0,.35)] focus:outline-none focus:ring-2 focus:ring-[#204a6f]';

  return (
    <div className="min-h-screen bg-[#fbf7f1] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[460px] bg-white border border-[rgba(0,0,0,.1)] rounded-xl shadow-sm p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <BrandMark size="lg" />
          </div>
          <p className="text-sm text-[#616b75] mt-1">Acesso administrativo da horta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#204a6f] mb-1.5">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={inputClassName}
              placeholder="Digite seu usuário"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#204a6f] mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClassName} pr-11`}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(0,0,0,.35)] hover:text-[#616b75] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-[#a32b3c] bg-[rgba(163,43,60,.08)] border border-[rgba(163,43,60,.25)] rounded-lg px-3 py-2">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-5 py-2.5 bg-[#204a6f] text-white rounded-xl font-medium hover:brightness-110 active:scale-[0.98] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <Link
        href="/"
        className="mt-6 flex items-center gap-1.5 text-xs text-[#616b75] hover:text-[#204a6f] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao início
      </Link>
    </div>
  );
}
