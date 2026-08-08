'use client';

// Substitui o <select> nativo - cujo menu é desenhado pelo sistema operacional, não
// pode ser estilizado, e com muitas opções ignora a altura da tela em que está
// aberto - por um dropdown próprio: painel com altura máxima e rolagem interna,
// fecha ao clicar fora ou apertar Esc, visual consistente com o resto do formulário.
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

export function SelectField({ value, onChange, options, placeholder = 'Selecione', required }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Participa da validação nativa do <form> (required) sem precisar reimplementá-la. */}
      <input type="text" value={value} required={required} readOnly className="sr-only" tabIndex={-1} aria-hidden />

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#324b2c] transition-colors flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? 'text-[#324b2c]' : 'text-[#adb5bd]'}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-[#6c757d] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-[#dee2e6] rounded-lg shadow-lg py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-[#f8f9fa] transition-colors ${
                option === value ? 'text-[#324b2c] font-semibold bg-[#f1f5f0]' : 'text-[#324b2c]'
              }`}
            >
              {option}
              {option === value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
