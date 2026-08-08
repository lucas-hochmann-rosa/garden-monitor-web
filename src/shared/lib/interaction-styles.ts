// Padrão único de destaque ao passar o mouse ou focar um controle interativo -
// contorno visível + leve fundo + anel de foco acessível. Centralizado aqui e
// reaproveitado em toda a interface (menu lateral, botões secundários, ícones de
// ação) em vez de cada componente inventar sua própria combinação de hover.
export const INTERACTIVE_OUTLINE =
  'border border-transparent transition-all duration-150 hover:border-[rgba(0,0,0,.1)] hover:bg-[rgba(0,0,0,.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(32,74,111,.35)]';

// Mesmo anel de foco, sem o hover de fundo/contorno - para botões que já têm sua
// própria cor de hover (ex.: ações destrutivas) e só precisam do indicador de foco.
export const FOCUS_RING_ONLY = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(32,74,111,.35)]';
