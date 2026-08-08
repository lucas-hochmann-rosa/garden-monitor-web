'use client';

import { X, Droplet, FlaskConical, Sprout, Calendar, Timer, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Plant } from '@/modules/plants/types/plant.types';
import { formatDatePtBr, formatRelativeTime } from '@/shared/lib/formatters';
import { PlantOriginBadge } from '@/modules/plants/components/PlantOriginBadge';

interface IrrigationModalProps {
  onConfirm: (milliliters: number) => void;
  onCancel: () => void;
}

function IrrigationModal({ onConfirm, onCancel }: IrrigationModalProps) {
  const [milliliters, setMilliliters] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (milliliters) onConfirm(Number(milliliters));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-[420px] w-full shadow-2xl border border-[rgba(0,0,0,.1)] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[rgba(92,157,214,.1)] flex items-center justify-center flex-shrink-0">
              <Droplet className="w-6 h-6 text-[#5c9dd6]" />
            </div>
            <div>
              <h3 className="text-[20px] font-medium text-[#204a6f]">Irrigação manual</h3>
              <p className="text-sm text-[#616b75] mt-0.5">Registre a irrigação realizada</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#204a6f] mb-1.5">
                Quantidade irrigada (ml) <span className="text-[#8a6a10]">*</span>
              </label>
              <input
                type="number"
                value={milliliters}
                onChange={(event) => setMilliliters(event.target.value)}
                required
                min="0"
                step="any"
                placeholder="Ex: 235"
                className="w-full px-3 py-2.5 bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#204a6f] text-sm"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-5 py-2.5 border border-[rgba(0,0,0,.1)] bg-[#fbf7f1] text-[#204a6f] rounded-xl font-medium hover:bg-white hover:border-[rgba(0,0,0,.18)] transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-5 py-2.5 bg-[#204a6f] text-white rounded-xl font-medium hover:brightness-110 transition-colors text-sm"
              >
                Confirmar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PhGradientBar({ ph, idealPH }: { ph: number; idealPH?: { min: number; max: number } }) {
  const markerPercent = Math.min(Math.max((ph / 14) * 100, 0), 100);
  const gradient =
    'linear-gradient(to right, #e74c3c 0%, #e67e22 14%, #f1c40f 28%, #27ae60 42%, #27ae60 50%, #1abc9c 57%, #2980b9 71%, #8e44ad 85%, #6c3483 100%)';

  return (
    <div className="relative" style={{ paddingBottom: '16px' }}>
      <div className="relative h-2.5 rounded-full overflow-visible" style={{ background: gradient }}>
        {idealPH && (
          <div
            className="absolute top-0 h-full bg-white/20 rounded-full"
            style={{
              left: `${(idealPH.min / 14) * 100}%`,
              width: `${((idealPH.max - idealPH.min) / 14) * 100}%`,
            }}
          />
        )}

        <div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `calc(${markerPercent}% - 5px)` }}
        >
          <div
            className="w-[10px] h-[18px] rounded-sm flex items-center justify-center shadow-md border border-white/60"
            style={{ background: 'rgba(255,255,255,0.92)', top: '-4px', position: 'relative' }}
          >
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#204a6f', lineHeight: 1, userSelect: 'none' }}>
              I
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[rgba(0,0,0,.35)]">0</span>
        <span className="text-[10px] text-[rgba(0,0,0,.35)]">7</span>
        <span className="text-[10px] text-[rgba(0,0,0,.35)]">14</span>
      </div>
    </div>
  );
}

interface PlantDetailsModalProps {
  plant: Plant;
  onClose: () => void;
  onIrrigate?: (milliliters: number) => void;
}

export function PlantDetailsModal({ plant, onClose, onIrrigate }: PlantDetailsModalProps) {
  const [isIrrigationModalOpen, setIsIrrigationModalOpen] = useState(false);

  const confirmIrrigation = (milliliters: number) => {
    onIrrigate?.(milliliters);
    setIsIrrigationModalOpen(false);
  };

  const isHealthy = plant.status === 'healthy';
  const isAwaitingSensor = !plant.isExample && !plant.hasRealReading;

  const getMoistureStatus = () => {
    if (plant.soilMoisture === null || !plant.idealMoisture) return 'ok';
    if (plant.soilMoisture < plant.idealMoisture.min) return 'low';
    if (plant.soilMoisture > plant.idealMoisture.max) return 'high';
    return 'ok';
  };

  const moistureStatus = getMoistureStatus();

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-[720px] shadow-2xl border border-[rgba(0,0,0,.1)] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[rgba(0,0,0,.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(32,74,111,.1)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {plant.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <Sprout className="w-5 h-5 text-[#204a6f]" />
              )}
            </div>
            <div>
              <h2 className="text-[20px] font-medium text-[#204a6f] leading-tight">{plant.name}</h2>
              <p className="text-xs font-mono text-[#204a6f]">{plant.slot}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-[rgba(32,74,111,.1)] border border-[rgba(32,74,111,.2)] rounded-xl">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${plant.hasRealReading ? 'bg-[#2f7a54] animate-pulse' : 'bg-[rgba(0,0,0,.35)]'}`}
            />
            <Clock className="w-3.5 h-3.5 text-[#204a6f] flex-shrink-0" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-medium text-[#204a6f]">Última leitura</span>
              <span className="text-xs font-mono text-[#616b75]">
                {plant.hasRealReading && plant.lastReadingAt
                  ? formatRelativeTime(plant.lastReadingAt)
                  : 'aguardando sensor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PlantOriginBadge isExample={plant.isExample} />
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                isAwaitingSensor
                  ? 'bg-[#fbf7f1] text-[#616b75] border-[rgba(0,0,0,.1)]'
                  : isHealthy
                    ? 'bg-[rgba(47,122,84,.08)] text-[#2f7a54] border-[rgba(47,122,84,.25)]'
                    : 'bg-[rgba(138,106,16,.08)] text-[#8a6a10] border-[rgba(138,106,16,.25)]'
              }`}
            >
              {isAwaitingSensor ? 'Aguardando sensor' : isHealthy ? '✓ Saudável' : '⚠ Em alerta'}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-[#fbf7f1] rounded-lg transition-colors">
              <X className="w-4 h-4 text-[#616b75]" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-[1fr_1.2fr] gap-6">
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl overflow-hidden bg-[rgba(32,74,111,.1)] border border-[rgba(0,0,0,.1)] flex items-center justify-center"
              style={{ height: '180px' }}
            >
              {plant.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <Sprout className="w-14 h-14 text-[#204a6f] opacity-60" />
              )}
            </div>

            <div>
              <p className="text-[10px] font-medium text-[rgba(0,0,0,.35)] uppercase tracking-widest mb-2">Informações</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2.5 bg-[#fbf7f1] rounded-xl border border-[rgba(0,0,0,.1)]">
                  <Calendar className="w-3.5 h-3.5 text-[#204a6f] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[rgba(0,0,0,.35)]">Plantio</p>
                    <p className="text-xs font-medium text-[#204a6f]">
                      {plant.plantedDate ? formatDatePtBr(plant.plantedDate) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-[#fbf7f1] rounded-xl border border-[rgba(0,0,0,.1)]">
                  <Calendar className="w-3.5 h-3.5 text-[#204a6f] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-[rgba(0,0,0,.35)]">Colheita prevista</p>
                    <p className="text-xs font-medium text-[#204a6f]">
                      {plant.estimatedDate ? formatDatePtBr(plant.estimatedDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#616b75]">Progresso de crescimento</span>
                <span className="text-xs font-mono font-medium text-[#204a6f]">{plant.growth}%</span>
              </div>
              <div className="h-2 bg-[rgba(0,0,0,.1)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#204a6f] rounded-full transition-all"
                  style={{ width: `${plant.growth}%` }}
                />
              </div>
              {plant.plantedDate && plant.estimatedDate && (
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[rgba(0,0,0,.35)]">
                    {new Date(plant.plantedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-[10px] text-[rgba(0,0,0,.35)]">
                    {new Date(plant.estimatedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-medium text-[rgba(0,0,0,.35)] uppercase tracking-widest mb-3">
                Leituras dos sensores
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-[#5c9dd6]" />
                    <span className="text-sm font-medium text-[#204a6f]">Umidade do solo</span>
                  </div>
                  <span className="text-[20px] font-mono font-medium text-[#204a6f]">
                    {plant.soilMoisture !== null ? `${plant.soilMoisture}%` : 'Sem leitura'}
                  </span>
                </div>
                {plant.idealMoisture && (
                  <p className="text-[11px] text-[rgba(0,0,0,.35)] mb-1.5">
                    Ideal: {plant.idealMoisture.min}% - {plant.idealMoisture.max}%
                  </p>
                )}
                <div className="relative h-2 bg-[rgba(0,0,0,.1)] rounded-full overflow-hidden">
                  <div
                    className={`absolute h-full rounded-full transition-all ${
                      moistureStatus === 'ok' ? 'bg-[#5c9dd6]' : 'bg-[#8a6a10]'
                    }`}
                    style={{ width: plant.soilMoisture !== null ? `${Math.min(plant.soilMoisture, 100)}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-[#204a6f]" />
                    <span className="text-sm font-medium text-[#204a6f]">pH do solo</span>
                  </div>
                  <span className="text-[20px] font-mono font-medium text-[#204a6f]">
                    {plant.pH !== null ? plant.pH : 'Sem leitura'}
                  </span>
                </div>
                {plant.idealPH && (
                  <p className="text-[11px] text-[rgba(0,0,0,.35)] mb-1.5">
                    Ideal: {plant.idealPH.min} - {plant.idealPH.max}
                  </p>
                )}
                {plant.pH !== null ? (
                  <PhGradientBar ph={plant.pH} idealPH={plant.idealPH} />
                ) : (
                  <div className="h-2.5 rounded-full bg-[rgba(0,0,0,.1)]" />
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium text-[rgba(0,0,0,.35)] uppercase tracking-widest mb-2">Irrigação</p>
              <div className="p-3 rounded-xl border border-[rgba(0,0,0,.1)] bg-[#fbf7f1]">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-[#204a6f]">Irrigação automática</span>
                  <span
                    className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                      plant.autoIrrigation ? 'bg-[rgba(47,122,84,.14)] text-[#2f7a54]' : 'bg-[rgba(0,0,0,.1)] text-[#616b75]'
                    }`}
                  >
                    {plant.autoIrrigation ? 'ATIVADA' : 'DESATIVADA'}
                  </span>
                </div>

                {plant.autoIrrigation && (plant.irrigationAmount || plant.irrigationInterval) && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[rgba(0,0,0,.1)]">
                    <Timer className="w-3.5 h-3.5 text-[#5c9dd6]" />
                    <span className="text-xs text-[#616b75]">Configuração:</span>
                    <span className="text-xs font-medium text-[#204a6f] bg-[rgba(92,157,214,.1)] px-2 py-0.5 rounded-full ml-auto">
                      {plant.irrigationAmount ?? '-'}ml a cada {plant.irrigationInterval ?? '-'}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {!plant.autoIrrigation && (
            <button
              onClick={() => setIsIrrigationModalOpen(true)}
              className="w-full py-3.5 bg-[#204a6f] text-white rounded-xl font-medium hover:brightness-110 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Droplet className="w-4 h-4" />
              Irrigar
            </button>
          )}
        </div>
      </div>

      {isIrrigationModalOpen && (
        <IrrigationModal onConfirm={confirmIrrigation} onCancel={() => setIsIrrigationModalOpen(false)} />
      )}
    </div>
  );
}
