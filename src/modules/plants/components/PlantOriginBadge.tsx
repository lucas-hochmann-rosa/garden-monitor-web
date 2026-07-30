// Selo "EXEMPLO"/"REAL" fixado no canto de cada card/detalhe de planta - deixa
// explícito, em qualquer tela onde os dois tipos possam aparecer juntos (o admin
// vê ambos; a demonstração só vê EXEMPLO), de onde vem aquele dado.
interface PlantOriginBadgeProps {
  isExample: boolean;
}

export function PlantOriginBadge({ isExample }: PlantOriginBadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
        isExample
          ? 'bg-[#f8f9fa] border-[#dee2e6] text-[#6c757d]'
          : 'bg-[#f1f5f0] border-[#c8d9c0] text-[#324b2c]'
      }`}
    >
      {isExample ? 'EXEMPLO' : 'REAL'}
    </span>
  );
}
