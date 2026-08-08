import { Sprout } from 'lucide-react';

interface BrandMarkProps {
  /** "sm" para o sidebar (compacto), "lg" para a tela de login (destaque). */
  size?: 'sm' | 'lg';
}

// Marca do produto em ícone + texto (sem depender de um arquivo de imagem de logo).
export function BrandMark({ size = 'sm' }: BrandMarkProps) {
  const isLarge = size === 'lg';

  return (
    <div className={`flex items-center ${isLarge ? 'flex-col gap-3' : 'gap-2.5'}`}>
      <div
        className={`rounded-2xl bg-gradient-to-br from-[#324b2c] to-[#718f60] flex items-center justify-center shadow-sm flex-shrink-0 ${
          isLarge ? 'w-16 h-16' : 'w-9 h-9'
        }`}
      >
        <Sprout className={isLarge ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
      </div>

      <div className={isLarge ? 'text-center' : ''}>
        <p className={`font-bold text-[#324b2c] leading-tight ${isLarge ? 'text-xl' : 'text-sm'}`}>Garden Monitor</p>
        {!isLarge && <p className="text-[10px] text-[#718f60] font-semibold tracking-widest">WEB</p>}
      </div>
    </div>
  );
}
