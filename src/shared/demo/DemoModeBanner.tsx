// Faixa fixa exibida em toda tela do modo de demonstração pública, avisando que
// nada digitado ali é gravado no banco de verdade.
import { Info } from 'lucide-react';

export function DemoModeBanner() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium">
      <Info className="w-4 h-4 flex-shrink-0" />
      <span>
        Ambiente de demonstração: os dados aqui são de exemplo e qualquer criação, edição ou exclusão não é salva.
      </span>
    </div>
  );
}
