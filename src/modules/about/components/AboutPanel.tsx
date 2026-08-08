// Página "Sobre": conteúdo institucional estático, reutilizado tanto no admin
// (/admin/about) quanto na demonstração pública (/demo/about). Sem interatividade,
// por isso não precisa de "use client".
import { Cpu, FileCode, Lightbulb, Sprout, Target } from 'lucide-react';

const CHANGELOG_ENTRIES = [
  { version: 'v0.1', description: 'Implementação do dashboard de monitoramento' },
  { version: 'v0.2', description: 'Sistema de alertas condicionais e notificações' },
  { version: 'v0.3', description: 'Upload de imagem para plantas e confirmação de exclusão' },
  { version: 'v1.0', description: 'Migração para Next.js com banco de dados Neon e ingestão real via ESP8266' },
  {
    version: 'v1.1',
    description:
      'Sensores por planta (solo/pH) e clima compartilhado da horta, área administrativa separada da demonstração pública, e clima real da região na landing page',
  },
];

const SDG_ITEMS = [
  'Promove práticas agrícolas resilientes',
  'Uso eficiente de recursos naturais',
  'Educação e segurança alimentar',
  'Otimização com tecnologia IoT',
];

export function AboutPanel() {
  return (
    <div className="h-screen bg-[#fbf7f1] ml-64 pt-16 flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col flex-1 w-full gap-5 overflow-hidden">
        <div className="flex-shrink-0">
          <h1 className="text-[28px] font-medium text-[#204a6f]">Garden Monitor</h1>
          <p className="text-sm text-[#616b75] mt-1">Conheça nossa missão e propósito</p>
        </div>

        <div className="flex-shrink-0 bg-[#204a6f] rounded-xl p-7 text-white">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-[20px] font-medium">Garden Monitor Web</h2>
              <p className="text-white/80 mt-1 text-sm">Plataforma de monitoramento de hortas inteligentes</p>
            </div>
          </div>
          <p className="mt-5 text-white/90 leading-relaxed text-sm max-w-2xl">
            Uma iniciativa para promover agricultura sustentável através da tecnologia e educação.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white rounded-xl p-7 border border-[rgba(0,0,0,.1)] shadow-sm">
                <h3 className="text-base font-medium text-[#204a6f] mb-3">O que é o Garden Monitor?</h3>
                <p className="text-sm text-[#616b75] leading-relaxed">
                  O Garden Monitor Web é uma plataforma de monitoramento de hortas inteligentes com sensores IoT,
                  desenvolvida para promover a agricultura sustentável e a educação ambiental. Através de tecnologia
                  de ponta, permitimos o acompanhamento em tempo real de plantas, garantindo condições ideais de
                  crescimento e aprendizado sobre práticas agrícolas sustentáveis.
                </p>
                <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,.1)] grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Cpu className="w-4 h-4 text-[#204a6f]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#204a6f]">Monitoramento IoT</p>
                      <p className="text-xs text-[#616b75] mt-0.5 leading-relaxed">
                        Sensores de umidade, pH e temperatura em tempo real via ESP8266.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-[#204a6f]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#204a6f]">Educação ambiental</p>
                      <p className="text-xs text-[#616b75] mt-0.5 leading-relaxed">
                        Ensino de práticas de agricultura sustentável.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-7 border border-[rgba(0,0,0,.1)] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-[#204a6f]" />
                  </div>
                  <h3 className="text-base font-medium text-[#204a6f]">Alinhamento ODS 2</h3>
                </div>
                <p className="text-sm text-[#616b75] leading-relaxed mb-4">
                  O Garden Monitor contribui diretamente para o Objetivo de Desenvolvimento Sustentável 2 da ONU -
                  Fome Zero e Agricultura Sustentável.
                </p>
                <ul className="space-y-2.5">
                  {SDG_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-[#204a6f]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#204a6f] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl p-7 border border-[rgba(0,0,0,.1)] shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0">
                  <FileCode className="w-4 h-4 text-[#204a6f]" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#204a6f]">Notas de atualização</h3>
                  <p className="text-xs text-[#616b75] mt-0.5">Histórico de versões do sistema</p>
                </div>
              </div>
              <div className="space-y-3">
                {CHANGELOG_ENTRIES.map((entry) => (
                  <div key={entry.version} className="flex items-center gap-3 py-2 border-b border-[rgba(32,74,111,.1)] last:border-0">
                    <span className="text-xs font-medium text-[#204a6f] bg-[rgba(32,74,111,.1)] px-2.5 py-1 rounded-md w-14 text-center flex-shrink-0">
                      {entry.version}
                    </span>
                    <p className="text-sm text-[#616b75]">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
