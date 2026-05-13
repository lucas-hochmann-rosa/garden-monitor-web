'use client';

// Tela "Registros": histórico de atividades da horta + formulário para criar um
// novo registro manual. No modo de demonstração, o registro criado só existe em
// memória (ver useDemoContext), nunca é gravado no banco.
import { Plus, Droplet, User, Code, Calendar, UserRound, Sprout, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { GardenRecord } from '@/modules/records/types/record.types';
import { RECORD_TYPE_LABELS } from '@/modules/records/types/record.types';
import { useDemoContext } from '@/shared/demo/DemoProvider';

const TYPE_STYLES: Record<GardenRecord['type'], { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  system: {
    bg: 'bg-[#f8f9fa]',
    border: 'border-[#dee2e6]',
    text: 'text-[#6c757d]',
    icon: <Code className="w-4 h-4 text-[#6c757d]" />,
  },
  user: {
    bg: 'bg-[#f1f5f0]',
    border: 'border-[#c8d9c0]',
    text: 'text-[#324b2c]',
    icon: <User className="w-4 h-4 text-[#324b2c]" />,
  },
  'auto-irrigation': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: <Droplet className="w-4 h-4 text-blue-500" />,
  },
  'manual-irrigation': {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: <Droplet className="w-4 h-4 text-cyan-500" />,
  },
};

interface RecordsPanelProps {
  records: GardenRecord[];
}

export function RecordsPanel({ records: recordsFromServer }: RecordsPanelProps) {
  const router = useRouter();
  const demo = useDemoContext();
  const records = demo ? demo.records : recordsFromServer;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ title: '', description: '' });

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (demo) {
      demo.createRecord({ type: 'user', ...newRecord });
    } else {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'user', ...newRecord }),
      });
      router.refresh();
    }

    setNewRecord({ title: '', description: '' });
    setIsFormOpen(false);
  };

  const inputClassName =
    'w-full px-4 py-2.5 border border-[#dee2e6] bg-[#f8f9fa] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#324b2c] text-sm';

  return (
    <div className="h-screen bg-[#f8f9fa] ml-64 pt-16 flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col flex-1 w-full gap-5 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="text-2xl font-bold text-[#324b2c]">Histórico de atividades da horta</h1>

          <button
            onClick={() => setIsFormOpen((previous) => !previous)}
            className="px-5 py-2.5 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#718f60] transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Novo registro
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-5">
            {isFormOpen && (
              <div className="bg-white rounded-2xl border border-[#dee2e6] shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-[#dee2e6] flex items-center justify-between">
                  <h3 className="font-bold text-[#324b2c]">Novo registro</h3>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 hover:bg-[#f8f9fa] rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-[#6c757d]" />
                  </button>
                </div>

                <form onSubmit={saveRecord} className="p-7 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#324b2c] mb-1.5">Título</label>
                      <input
                        type="text"
                        value={newRecord.title}
                        onChange={(event) => setNewRecord((previous) => ({ ...previous, title: event.target.value }))}
                        required
                        className={inputClassName}
                        placeholder="Ex: Poda realizada"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#324b2c] mb-1.5">Descrição</label>
                      <input
                        type="text"
                        value={newRecord.description}
                        onChange={(event) =>
                          setNewRecord((previous) => ({ ...previous, description: event.target.value }))
                        }
                        required
                        className={inputClassName}
                        placeholder="Descreva a atividade..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-6 py-2.5 border border-[#dee2e6] text-[#324b2c] rounded-xl font-semibold hover:bg-[#f8f9fa] transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#718f60] transition-colors text-sm"
                    >
                      Salvar registro
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {records.map((record) => {
                const style = TYPE_STYLES[record.type];

                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-2xl border border-[#dee2e6] shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1">
                          <h3 className="font-semibold text-[#324b2c] text-sm">{record.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.border} ${style.text} flex-shrink-0`}>
                            {RECORD_TYPE_LABELS[record.type]}
                          </span>
                        </div>

                        <p className="text-sm text-[#6c757d]">{record.description}</p>

                        <div className="flex items-center gap-4 mt-2.5 text-xs text-[#adb5bd]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {record.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <UserRound className="w-3.5 h-3.5" />
                            {record.author}
                          </span>
                          {record.plant && (
                            <span className="flex items-center gap-1.5">
                              <Sprout className="w-3.5 h-3.5" />
                              {record.plant}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {records.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#dee2e6]">
                <Sprout className="w-12 h-12 text-[#dee2e6] mb-3" />
                <p className="text-sm text-[#6c757d]">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
