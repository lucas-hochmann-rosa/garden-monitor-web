'use client';

// Tela de login do administrador (/admin). Única porta de entrada autenticada do
// sistema - não existe mais um botão de "visitante": quem quiser só olhar a horta
// sem entrar usa a demonstração pública (/demo), que não passa por aqui.
import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
    'w-full px-4 py-2.5 bg-[#f8f9fa] border border-[#dee2e6] rounded-xl text-sm text-[#324b2c] placeholder:text-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#324b2c]';

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <div className="w-full max-w-[460px] bg-white border border-[#dee2e6] rounded-2xl shadow-sm p-7">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-4">
            <BrandMark size="lg" />
          </div>
          <p className="text-sm text-[#6c757d] mt-1">Acesso administrativo da horta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#324b2c] mb-1.5">Usuário</label>
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
            <label className="block text-xs font-semibold text-[#324b2c] mb-1.5">Senha</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#adb5bd] hover:text-[#6c757d] transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-5 py-2.5 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#4a6b40] transition-colors text-sm disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
