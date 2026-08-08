'use client';

// Substitui o <input type="date"> nativo - cujo calendário é desenhado pelo sistema
// operacional (no Windows, sempre no tema azul dele, sem nenhuma relação com a
// paleta do app) - por um calendário próprio. Continua guardando/devolvendo string
// "aaaa-mm-dd", então quem usa este componente não muda o formato de dado, só troca
// o campo nativo por ele.
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDisplay(value: string): string {
  const date = fromISODate(value);
  if (!date) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DateField({ value, onChange, required }: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = fromISODate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
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

  const openPicker = () => {
    setViewDate(selected ?? new Date());
    setIsOpen(true);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: Array<{ day: number; date: Date } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, date: new Date(year, month, day) });

  return (
    <div ref={containerRef} className="relative">
      <input type="text" value={value} required={required} readOnly className="sr-only" tabIndex={-1} aria-hidden />

      <button
        type="button"
        onClick={openPicker}
        className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#324b2c] transition-colors flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? 'text-[#324b2c]' : 'text-[#adb5bd]'}>{value ? formatDisplay(value) : 'dd/mm/aaaa'}</span>
        <CalendarIcon className="w-4 h-4 text-[#6c757d] flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-[260px] bg-white border border-[#dee2e6] rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-[#f8f9fa] rounded-lg transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-[#324b2c]" />
            </button>
            <span className="text-sm font-semibold text-[#324b2c] capitalize">
              {MONTH_LABELS[month]} de {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-[#f8f9fa] rounded-lg transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-[#324b2c]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={index} className="text-[10px] font-semibold text-[#adb5bd] text-center">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, index) => {
              if (!cell) return <span key={index} />;
              const isSelected = selected ? isSameDay(cell.date, selected) : false;
              const isToday = isSameDay(cell.date, today);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    onChange(toISODate(cell.date));
                    setIsOpen(false);
                  }}
                  className={`h-7 rounded-md text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#324b2c] text-white font-semibold'
                      : isToday
                        ? 'text-[#324b2c] font-semibold border border-[#324b2c]'
                        : 'text-[#324b2c] hover:bg-[#f1f5f0]'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[#dee2e6]">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-[#6c757d] hover:text-[#324b2c] transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(toISODate(today));
                setIsOpen(false);
              }}
              className="text-xs font-semibold text-[#324b2c] hover:text-[#718f60] transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
