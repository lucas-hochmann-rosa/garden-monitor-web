'use client';

// Modal aberto pelo sino de alertas na Topbar: lista as plantas fora da faixa
// ideal e permite pular direto para os detalhes de cada uma.
import { AlertTriangle, Sprout, X } from 'lucide-react';
import type { DashboardAlert } from '@/modules/dashboard/types/dashboard.types';

interface DashboardAlertModalProps {
  alerts: DashboardAlert[];
  onClose: () => void;
  onNavigateToPlant: (plantId: string) => void;
}

export function DashboardAlertModal({ alerts, onClose, onNavigateToPlant }: DashboardAlertModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[560px] flex flex-col shadow-2xl border border-[#dee2e6]">
        <div className="px-7 py-5 border-b border-[#dee2e6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#324b2c]">Alertas do sistema</h2>
              <p className="text-xs text-[#6c757d] mt-0.5">Atenção requerida nas seguintes plantas</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-[#f8f9fa] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#6c757d]" />
          </button>
        </div>

        <div className="p-6">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sprout className="w-5 h-5 text-[#324b2c]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#324b2c] text-sm">{alert.name}</h3>
                      <p className="text-xs text-amber-700 mt-0.5">{alert.issue}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToPlant(alert.id)}
                    className="px-4 py-2 bg-[#324b2c] text-white rounded-lg text-sm font-semibold hover:bg-[#718f60] transition-colors flex-shrink-0 ml-3"
                  >
                    Ver detalhes
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Sprout className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-[#324b2c]">Nenhum alerta no momento</p>
              <p className="text-xs text-[#6c757d] mt-1">Todas as plantas estão saudáveis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
