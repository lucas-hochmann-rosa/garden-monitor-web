// Selo "EXEMPLO"/"REAL" fixado no canto de cada card/detalhe de planta - deixa
// explícito, em qualquer tela onde os dois tipos possam aparecer juntos (o admin
// vê ambos; a demonstração só vê EXEMPLO), de onde vem aquele dado.
interface PlantOriginBadgeProps {
  isExample: boolean;
}

export function PlantOriginBadge({ isExample }: PlantOriginBadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border ${
        isExample
          ? 'bg-[#fbf7f1] border-[rgba(0,0,0,.1)] text-[#616b75]'
          : 'bg-[rgba(32,74,111,.1)] border-[rgba(32,74,111,.2)] text-[#204a6f]'
      }`}
    >
      {isExample ? 'EXEMPLO' : 'REAL'}
    </span>
  );
}
