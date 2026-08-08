'use client';

// Tela "Dashboard": resumo (última leitura, umidade média, alertas, clima da horta)
// + grade de plantas monitoradas. Como PlantsPanel, funciona tanto no admin quanto
// na demonstração pública, lendo de useDemoContext() quando presente.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Clock, Droplets, Search, Sprout, Thermometer, TriangleAlert } from 'lucide-react';
import { PlantDetailsModal } from '@/modules/plants/components/PlantDetailsModal';
import { PlantOriginBadge } from '@/modules/plants/components/PlantOriginBadge';
import type { Plant } from '@/modules/plants/types/plant.types';
import type { DashboardSummary } from '@/modules/dashboard/types/dashboard.types';
import { formatRelativeTime } from '@/shared/lib/formatters';
import { useDemoContext } from '@/shared/demo/DemoProvider';

interface DashboardPanelProps {
  plants: Plant[];
  summary: DashboardSummary;
}

export function DashboardPanel({ plants: plantsFromServer, summary: summaryFromServer }: DashboardPanelProps) {
  const router = useRouter();
  const demo = useDemoContext();
  const plants = demo ? demo.plants : plantsFromServer;
  const summary = demo ? demo.summary : summaryFromServer;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const filteredPlants = plants.filter((plant) => plant.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusBorderClass = (status: Plant['status']) =>
    status === 'healthy' ? 'border-[rgba(0,0,0,.1)]' : 'border-[#8a6a10]';

  // Registra a irrigação manual como um novo registro de atividade e atualiza a tela.
  const handleIrrigate = async (milliliters: number) => {
    if (!selectedPlant) return;

    const recordInput = {
      type: 'manual-irrigation' as const,
      title: 'Irrigação manual',
      description: `Irrigação manual realizada - ${milliliters}ml`,
      plantId: selectedPlant.id,
    };

    if (demo) {
      demo.createRecord(recordInput);
    } else {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordInput),
      });
      router.refresh();
    }

    setSelectedPlant(null);
  };

  return (
    <div className="h-screen bg-[#fbf7f1] ml-64 pt-16 flex flex-col overflow-hidden">
      <div className="relative p-6 flex flex-col flex-1 w-full gap-4 overflow-hidden">
        <div className="w-full h-32 rounded-xl overflow-hidden shadow-sm border border-[rgba(0,0,0,.1)] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/dashboard-header.png"
            alt="Garden Monitor"
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 75%' }}
          />
        </div>

        <div className="grid grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,.1)] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(92,157,214,.1)] flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-[#5c9dd6]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#616b75] uppercase tracking-widest mb-1">
                Última leitura
              </span>
              <p className="text-[20px] font-mono font-medium text-[#204a6f] leading-none">
                {summary.lastReadingAt ? formatRelativeTime(summary.lastReadingAt) : 'Sem leituras ainda'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,.1)] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0">
              <Droplets className="w-6 h-6 text-[#204a6f]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#616b75] uppercase tracking-widest mb-1">
                Umidade média do solo
              </span>
              <p className="text-[28px] font-mono font-medium text-[#204a6f] leading-none">
                {summary.averageSoilMoisture !== null ? `${summary.averageSoilMoisture}%` : '-'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,.1)] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(178,86,16,.1)] flex items-center justify-center flex-shrink-0">
              <Thermometer className="w-6 h-6 text-[#b25610]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#616b75] uppercase tracking-widest mb-1">
                Clima da horta
              </span>
              <p className="text-[20px] font-mono font-medium text-[#204a6f] leading-none">
                {summary.climate.temperature !== null ? `${summary.climate.temperature}°C` : '-'}
                {summary.climate.airHumidity !== null && (
                  <span className="text-sm font-medium text-[#616b75]"> · {summary.climate.airHumidity}% ar</span>
                )}
              </p>
              {summary.climate.temperature !== null && (
                <span className="text-[10px] text-[rgba(0,0,0,.35)] mt-0.5">
                  {summary.climate.recordedAt ? 'Sensor da horta (DHT11)' : 'Estimado pelo clima da região'}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,.1)] shadow-sm flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${summary.alerts.length > 0 ? 'bg-[rgba(138,106,16,.08)]' : 'bg-[rgba(47,122,84,.08)]'}`}
            >
              <TriangleAlert className={`w-6 h-6 ${summary.alerts.length > 0 ? 'text-[#8a6a10]' : 'text-[#2f7a54]'}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[#616b75] uppercase tracking-widest mb-1">
                Alertas ativos
              </span>
              <p className="text-[28px] font-mono font-medium text-[#204a6f] leading-none">{summary.alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[rgba(0,0,0,.1)] shadow-sm flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-[20px] font-medium text-[#204a6f]">Plantas monitoradas</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#616b75]" />
              <input
                type="text"
                placeholder="Procurar"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 pr-4 py-2 border border-[rgba(0,0,0,.1)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#204a6f] bg-[#fbf7f1]"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-1">
            {filteredPlants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sprout className="w-14 h-14 text-[rgba(0,0,0,.1)] mb-3" />
                <p className="text-sm text-[#616b75]">
                  {plants.length === 0 ? 'Nenhuma planta cadastrada' : 'Nenhuma planta encontrada'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredPlants.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedPlant(plant)}
                    className={`bg-white rounded-xl p-4 border-2 ${getStatusBorderClass(plant.status)} shadow-sm hover:shadow-md transition-shadow text-left`}
                  >
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h3 className="font-medium text-[#204a6f] text-sm">{plant.name}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <PlantOriginBadge isExample={plant.isExample} />
                        {!plant.isExample && !plant.hasRealReading ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-[#616b75] bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] px-2 py-0.5 rounded-full">
                            Aguardando sensor
                          </span>
                        ) : (
                          plant.status === 'warning' && (
                            <span className="flex items-center gap-1 text-xs font-medium text-[#8a6a10] bg-[rgba(138,106,16,.08)] px-2 py-0.5 rounded-full">
                              ⚠ Alerta
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mb-3">
                      <div className="w-[150px] h-[150px] flex-shrink-0 bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] rounded-lg overflow-hidden">
                        {plant.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sprout className="w-10 h-10 text-[#204a6f] opacity-40" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-center gap-2.5">
                        <div>
                          <p className="text-xs text-[#616b75]">Umidade do solo</p>
                          <p className="text-[22px] font-mono font-medium text-[#204a6f] leading-tight">
                            {plant.soilMoisture !== null ? `${plant.soilMoisture}%` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#616b75]">pH</p>
                          <p className="text-[22px] font-mono font-medium text-[#204a6f] leading-tight">
                            {plant.pH !== null ? plant.pH : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#616b75]">Crescimento</span>
                        <span className="text-xs font-mono font-medium text-[#204a6f]">{plant.growth}%</span>
                      </div>
                      <div className="h-1.5 bg-[rgba(0,0,0,.1)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#204a6f] rounded-full transition-all"
                          style={{ width: `${plant.growth}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPlant && (
        <PlantDetailsModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} onIrrigate={handleIrrigate} />
      )}
    </div>
  );
}
