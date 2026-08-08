'use client';

// Página "Suporte": formulário de contato que só abre o cliente de e-mail do
// visitante com a mensagem pré-preenchida - não existe um backend de tickets
// próprio, por isso não há chamada de API aqui.
import { HelpCircle, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

export function SupportPanel() {
  const [formData, setFormData] = useState({ problem: '', details: '', email: '' });
  const [isSent, setIsSent] = useState(false);

  // Abre o cliente de e-mail do usuário com a solicitação pré-preenchida (sem backend próprio de tickets).
  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = encodeURIComponent(`Suporte Garden Monitor: ${formData.problem}`);
    const body = encodeURIComponent(
      `Problema: ${formData.problem}\n\nDetalhamento:\n${formData.details}\n\n${formData.email ? `Email para contato: ${formData.email}` : ''}`,
    );

    window.location.href = `mailto:hrlucas.dev@gmail.com?subject=${subject}&body=${body}`;

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setFormData({ problem: '', details: '', email: '' });
    }, 3000);
  };

  const inputClassName =
    'w-full px-4 py-3 border border-[rgba(0,0,0,.1)] bg-[#fbf7f1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#204a6f] transition-shadow text-sm';

  return (
    <div className="h-screen bg-[#fbf7f1] ml-64 pt-16 flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col flex-1 w-full gap-5 overflow-hidden">
        <div className="flex-shrink-0">
          <h1 className="text-[28px] font-medium text-[#204a6f]">Precisa de ajuda?</h1>
          <p className="text-sm text-[#616b75] mt-1">
            Entre em contato pelo email{' '}
            <span className="font-medium">hrlucas.dev@gmail.com</span> ou abra uma solicitação de suporte pelo formulário abaixo.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,.1)] shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-[rgba(0,0,0,.1)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-[#204a6f]" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#204a6f]">Abrir solicitação de suporte</h3>
                  <p className="text-xs text-[#616b75] mt-0.5">Preencha com o máximo de detalhes possível</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitRequest} className="p-7 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#204a6f] mb-1.5">
                  Qual é o problema? <span className="text-[#8a6a10]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.problem}
                  onChange={(event) => setFormData((previous) => ({ ...previous, problem: event.target.value }))}
                  required
                  className={inputClassName}
                  placeholder="Ex: Erro ao cadastrar nova planta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#204a6f] mb-1.5">
                  Detalhamento <span className="text-[#8a6a10]">*</span>
                </label>
                <textarea
                  value={formData.details}
                  onChange={(event) => setFormData((previous) => ({ ...previous, details: event.target.value }))}
                  required
                  rows={4}
                  className={`${inputClassName} resize-none`}
                  placeholder="Descreva o problema com o máximo de detalhes possível."
                />
                <p className="text-xs text-[rgba(0,0,0,.35)] mt-1.5">
                  Quanto mais detalhes você fornecer, mais rápido resolveremos o problema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#204a6f] mb-1.5">
                  Email para contato <span className="text-[rgba(0,0,0,.35)] font-normal">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((previous) => ({ ...previous, email: event.target.value }))}
                  className={inputClassName}
                  placeholder="seu@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={isSent}
                className={`w-full px-6 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                  isSent ? 'bg-[#2f7a54] text-white' : 'bg-[#204a6f] text-white hover:brightness-110 shadow-sm hover:shadow-md'
                }`}
              >
                {isSent ? (
                  '✓ Solicitação enviada com sucesso!'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar solicitação
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
