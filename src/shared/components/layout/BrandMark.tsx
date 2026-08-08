import { Sprout } from 'lucide-react';

interface BrandMarkProps {
  /** "sm" para o sidebar (compacto), "lg" para a tela de login (destaque). */
  size?: 'sm' | 'lg';
}

// Marca do produto em ícone + texto (sem depender de um arquivo de imagem de logo).
// O ícone fica verde de propósito - é o "mascote" da horta, uma exceção decorativa
// ao azul de marca do sistema de design (reaproveita o próprio verde funcional
// "sucesso" da paleta, não um hex novo). O texto do nome segue o azul de marca.
export function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <div className={`flex items-center ${isLarge ? 'flex-col gap-3' : 'gap-2.5'}`}>
      <div
        className={`rounded-xl bg-[#2f7a54] flex items-center justify-center shadow-sm flex-shrink-0 ${
          isLarge ? 'w-16 h-16' : 'w-9 h-9'
        }`}
      >
        <Sprout className={isLarge ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
      </div>

      <div className={isLarge ? 'text-center' : ''}>
        <p className={`font-medium text-[#204a6f] leading-tight ${isLarge ? 'text-[20px]' : 'text-sm'}`}>
          Garden Monitor
        </p>
        {!isLarge && <p className="text-[10px] text-[#616b75] font-medium tracking-widest">WEB</p>}
      </div>
    </div>
  );
}
