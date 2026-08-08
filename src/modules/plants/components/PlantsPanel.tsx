'use client';

// Tela "Plantas": grade com todas as plantas cadastradas, cadastro/edição/exclusão
// e o modal de detalhes. Funciona tanto no admin (dados reais, ações via API) quanto
// na demonstração pública (dados de exemplo, ações só em memória - ver
// src/shared/demo/DemoProvider.tsx e o hook useDemoContext usado abaixo).
import { Plus, Sprout, Edit, Trash2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlantDetailsModal } from '@/modules/plants/components/PlantDetailsModal';
import { PlantFormModal } from '@/modules/plants/components/PlantFormModal';
import { PlantOriginBadge } from '@/modules/plants/components/PlantOriginBadge';
import type { Plant, PlantFormInput } from '@/modules/plants/types/plant.types';
import { useDemoContext } from '@/shared/demo/DemoProvider';

interface DeleteConfirmationModalProps {
  plantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ plantName, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-[440px] w-full shadow-2xl border border-[rgba(0,0,0,.1)] overflow-hidden">
        <div className="p-7">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-[rgba(163,43,60,.08)] flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-[#a32b3c]" />
            </div>
            <div>
              <h3 className="text-[20px] font-medium text-[#204a6f]">Confirmar exclusão</h3>
              <p className="text-sm text-[#616b75] mt-0.5">
                Tem certeza que deseja excluir a planta <span className="font-medium text-[#204a6f]">&quot;{plantName}&quot;</span>?
              </p>
            </div>
          </div>

          <p className="text-sm text-[#616b75] leading-relaxed mb-6">
            Todos os dados associados a esta planta serão perdidos.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-2.5 border border-[rgba(0,0,0,.1)] bg-[#fbf7f1] text-[#204a6f] rounded-xl font-medium hover:bg-white hover:border-[rgba(0,0,0,.18)] transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-5 py-2.5 bg-[#a32b3c] text-white rounded-xl font-medium hover:brightness-90 transition-colors text-sm"
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlantsPanelProps {
  plants: Plant[];
}

export function PlantsPanel({ plants: plantsFromServer }: PlantsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = useDemoContext();
  const plants = demo ? demo.plants : plantsFromServer;

  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Abre os detalhes da planta quando a URL trouxer o parâmetro ?plantId= (vindo do modal de alertas).
  useEffect(() => {
    const plantId = searchParams.get('plantId');
    if (!plantId) return;

    const foundPlant = plants.find((plant) => plant.id === plantId);
    if (foundPlant) setSelectedPlant(foundPlant);
  }, [searchParams, plants]);

  const getStatusBorderClass = (status: Plant['status']) =>
    status === 'healthy' ? 'border-[rgba(0,0,0,.1)]' : 'border-[rgba(138,106,16,.3)]';

  const savePlant = async (input: PlantFormInput) => {
    if (demo) {
      demo.savePlant(input, editingPlant?.id);
    } else if (editingPlant) {
      await fetch(`/api/plants/${editingPlant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      router.refresh();
    } else {
      await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      router.refresh();
    }

    setIsFormOpen(false);
    setEditingPlant(null);
  };

  const confirmDelete = async () => {
    if (!deletingPlant) return;

    if (demo) {
      demo.deletePlant(deletingPlant.id);
    } else {
      await fetch(`/api/plants/${deletingPlant.id}`, { method: 'DELETE' });
      router.refresh();
    }

    setDeletingPlant(null);
  };

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

  const filteredPlants = plants.filter((plant) => plant.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen bg-[#fbf7f1] ml-64 pt-16 flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col flex-1 w-full gap-5 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="text-[28px] font-medium text-[#204a6f]">Gerencie todas as plantas da horta</h1>

          <div className="flex items-center gap-3">
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

            <button
              onClick={() => {
                setEditingPlant(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-2.5 bg-[#204a6f] text-white rounded-xl font-medium hover:brightness-110 transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Inserir nova planta
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-5">
            {filteredPlants.map((plant) => (
              <div
                key={plant.id}
                className={`bg-white rounded-xl border-2 ${getStatusBorderClass(plant.status)} shadow-sm hover:shadow-md transition-all overflow-hidden`}
              >
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <h3 className="text-[20px] font-medium text-[#204a6f]">{plant.name}</h3>
                      <p className="text-xs font-mono text-[#616b75] mt-0.5">{plant.slot}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <PlantOriginBadge isExample={plant.isExample} />
                      {!plant.isExample && !plant.hasRealReading ? (
                        <span className="px-2.5 py-1 bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] text-[#616b75] text-xs font-medium rounded-full">
                          Aguardando sensor
                        </span>
                      ) : (
                        plant.status !== 'healthy' && (
                          <span className="px-2.5 py-1 bg-[rgba(138,106,16,.08)] border border-[rgba(138,106,16,.25)] text-[#8a6a10] text-xs font-medium rounded-full">
                            ⚠ Em alerta
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="h-44 bg-[#fbf7f1] border border-[rgba(0,0,0,.1)] rounded-xl flex items-center justify-center overflow-hidden mb-4">
                    {plant.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sprout className="w-14 h-14 text-[#204a6f] opacity-50" />
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#616b75]">Umidade do solo</span>
                      <span className="font-mono font-medium text-[#204a6f]">
                        {plant.soilMoisture !== null ? `${plant.soilMoisture}%` : 'Sem leitura'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#616b75]">pH do solo</span>
                      <span className="font-mono font-medium text-[#204a6f]">
                        {plant.pH !== null ? plant.pH : 'Sem leitura'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#616b75]">Crescimento</span>
                      <span className="font-mono font-medium text-[#204a6f]">{plant.growth}%</span>
                    </div>
                  </div>

                  <div className="h-1.5 bg-[rgba(0,0,0,.1)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#204a6f] rounded-full transition-all"
                      style={{ width: `${plant.growth}%` }}
                    />
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-[rgba(0,0,0,.1)] bg-[#fbf7f1] flex gap-2">
                  <button
                    onClick={() => setSelectedPlant(plant)}
                    className="flex-1 px-3 py-2 bg-[#204a6f] text-white rounded-lg text-sm font-medium hover:brightness-110 transition-colors"
                  >
                    Ver detalhes
                  </button>

                  <button
                    onClick={() => {
                      setEditingPlant(plant);
                      setIsFormOpen(true);
                    }}
                    className="px-3 py-2 border border-[rgba(0,0,0,.1)] bg-white rounded-lg hover:bg-[#fbf7f1] transition-colors"
                    title="Editar planta"
                  >
                    <Edit className="w-4 h-4 text-[#616b75]" />
                  </button>

                  <button
                    onClick={() => setDeletingPlant(plant)}
                    className="px-3 py-2 border border-[rgba(0,0,0,.1)] bg-white rounded-lg hover:bg-[rgba(163,43,60,.08)] hover:border-[rgba(163,43,60,.25)] transition-colors"
                    title="Excluir planta"
                  >
                    <Trash2 className="w-4 h-4 text-[#616b75]" />
                  </button>
                </div>
              </div>
            ))}

            {filteredPlants.length === 0 && plants.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                <Sprout className="w-16 h-16 text-[rgba(0,0,0,.1)] mb-4" />
                <h3 className="text-[20px] font-medium text-[#616b75] mb-2">Nenhuma planta cadastrada</h3>
                <p className="text-sm text-[rgba(0,0,0,.35)] mb-5">Clique em &quot;Inserir nova planta&quot; para começar</p>
                <button
                  onClick={() => {
                    setEditingPlant(null);
                    setIsFormOpen(true);
                  }}
                  className="px-5 py-2.5 bg-[#204a6f] text-white rounded-xl font-medium hover:brightness-110 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" /> Inserir nova planta
                </button>
              </div>
            )}

            {filteredPlants.length === 0 && plants.length > 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-16 h-16 text-[rgba(0,0,0,.1)] mb-4" />
                <h3 className="text-[20px] font-medium text-[#616b75] mb-2">Nenhuma planta encontrada</h3>
                <p className="text-sm text-[rgba(0,0,0,.35)]">Tente buscar com outros termos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPlant && (
        <PlantDetailsModal plant={selectedPlant} onClose={() => setSelectedPlant(null)} onIrrigate={handleIrrigate} />
      )}

      {isFormOpen && (
        <PlantFormModal
          onClose={() => {
            setIsFormOpen(false);
            setEditingPlant(null);
          }}
          onSave={savePlant}
          initialPlant={editingPlant ?? undefined}
          isEditMode={!!editingPlant}
        />
      )}

      {deletingPlant && (
        <DeleteConfirmationModal
          plantName={deletingPlant.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingPlant(null)}
        />
      )}
    </div>
  );
}
