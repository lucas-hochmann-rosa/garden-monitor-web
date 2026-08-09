'use client';

// Formulário de cadastro/edição de planta (modal). Não lida com is_example - toda
// planta criada por aqui (admin ou demonstração) é sempre uma planta "normal" do
// ponto de vista do formulário; quem decide o rótulo é o backend (admin) ou o
// DemoProvider (demonstração).
import { ImagePlus, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Plant, PlantFormInput } from '@/modules/plants/types/plant.types';
import { SelectField } from '@/shared/components/form/SelectField';
import { DateField } from '@/shared/components/form/DateField';

// 16 cobre até dois multiplexadores CD74HC4051 encadeados (8 canais cada) - a
// capacidade real de um hub ESP8266 com o hardware documentado em
// firmware/README.md, não um número arbitrário como antes.
const CULTIVATION_SLOTS = Array.from({ length: 16 }, (_, index) => `Slot ${index + 1}`);

// Estado interno do formulário - campos numéricos ficam como string para os inputs controlados
// e são convertidos para o formato aninhado (PlantFormInput) apenas no envio.
interface PlantFormState {
  name: string;
  scientificName: string;
  slot: string;
  plantedDate: string;
  estimatedDate: string;
  idealMoistureMin: string;
  idealMoistureMax: string;
  idealPHMin: string;
  idealPHMax: string;
  idealTempMin: string;
  idealTempMax: string;
  irrigationAmount: string;
  irrigationInterval: string;
  autoIrrigation: boolean;
  irrigationHardwareInstalled: boolean;
  notes: string;
  image: string;
}

function toFormState(plant?: Plant): PlantFormState {
  return {
    name: plant?.name ?? '',
    scientificName: plant?.scientificName ?? '',
    slot: plant?.slot ?? '',
    plantedDate: plant?.plantedDate ?? '',
    estimatedDate: plant?.estimatedDate ?? '',
    idealMoistureMin: plant?.idealMoisture?.min !== undefined ? String(plant.idealMoisture.min) : '',
    idealMoistureMax: plant?.idealMoisture?.max !== undefined ? String(plant.idealMoisture.max) : '',
    idealPHMin: plant?.idealPH?.min !== undefined ? String(plant.idealPH.min) : '',
    idealPHMax: plant?.idealPH?.max !== undefined ? String(plant.idealPH.max) : '',
    idealTempMin: plant?.idealTemp?.min !== undefined ? String(plant.idealTemp.min) : '',
    idealTempMax: plant?.idealTemp?.max !== undefined ? String(plant.idealTemp.max) : '',
    irrigationAmount: plant?.irrigationAmount !== undefined ? String(plant.irrigationAmount) : '',
    irrigationInterval: plant?.irrigationInterval !== undefined ? String(plant.irrigationInterval) : '',
    autoIrrigation: plant?.autoIrrigation ?? false,
    irrigationHardwareInstalled: plant?.irrigationHardwareInstalled ?? false,
    notes: plant?.notes ?? '',
    image: plant?.image ?? '',
  };
}

function toPlantFormInput(state: PlantFormState): PlantFormInput {
  const toNumber = (value: string) => (value === '' ? undefined : Number(value));
  const toRange = (min: string, max: string) => {
    const minValue = toNumber(min);
    const maxValue = toNumber(max);
    return minValue !== undefined && maxValue !== undefined ? { min: minValue, max: maxValue } : undefined;
  };

  return {
    name: state.name,
    scientificName: state.scientificName || undefined,
    slot: state.slot,
    plantedDate: state.plantedDate || undefined,
    estimatedDate: state.estimatedDate || undefined,
    idealMoisture: toRange(state.idealMoistureMin, state.idealMoistureMax),
    idealPH: toRange(state.idealPHMin, state.idealPHMax),
    idealTemp: toRange(state.idealTempMin, state.idealTempMax),
    autoIrrigation: state.autoIrrigation,
    irrigationAmount: toNumber(state.irrigationAmount),
    irrigationInterval: toNumber(state.irrigationInterval),
    irrigationHardwareInstalled: state.irrigationHardwareInstalled,
    notes: state.notes || undefined,
    image: state.image || undefined,
  };
}

interface PlantFormModalProps {
  onClose: () => void;
  onSave: (input: PlantFormInput) => void;
  initialPlant?: Plant;
  isEditMode?: boolean;
}

export function PlantFormModal({ onClose, onSave, initialPlant, isEditMode = false }: PlantFormModalProps) {
  const [formState, setFormState] = useState<PlantFormState>(() => toFormState(initialPlant));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(toPlantFormInput(formState));
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormState((previous) => ({ ...previous, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormState((previous) => ({ ...previous, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputClassName =
    'w-full px-3 py-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#324b2c] transition-colors placeholder:text-[#adb5bd]';
  const labelClassName = 'block text-xs font-semibold text-[#324b2c] mb-1';
  const sectionClassName = 'block text-[10px] font-semibold text-[#adb5bd] uppercase tracking-widest mb-2';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[780px] max-h-[92vh] flex flex-col shadow-2xl border border-[#dee2e6]">
        <div className="px-6 py-4 border-b border-[#dee2e6] flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-[#324b2c]">{isEditMode ? 'Editar planta' : 'Cadastrar nova planta'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-[#f8f9fa] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#6c757d]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="plant-form" onSubmit={handleSubmit}>
            <div className="px-6 py-5 grid grid-cols-3 gap-x-6 gap-y-0 items-start">
              <div className="flex flex-col">
                <span className={sectionClassName}>Dados básicos</span>

                <div className="mb-3">
                  <label className={labelClassName}>
                    Apelido <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleFieldChange}
                    required
                    placeholder="Ex: Alface 1"
                    className={inputClassName}
                  />
                </div>

                <div className="mb-3">
                  <label className={labelClassName}>Nome científico</label>
                  <input
                    type="text"
                    name="scientificName"
                    value={formState.scientificName}
                    onChange={handleFieldChange}
                    placeholder="Ex: Lactuca sativa"
                    className={inputClassName}
                  />
                </div>

                <div className="mb-3">
                  <label className={labelClassName}>
                    Slot de cultivo <span className="text-amber-500">*</span>
                    <span className="ml-1 text-[#adb5bd] font-normal">(1-16)</span>
                  </label>
                  <SelectField
                    value={formState.slot}
                    onChange={(slot) => setFormState((previous) => ({ ...previous, slot }))}
                    options={CULTIVATION_SLOTS}
                    placeholder="Selecione um slot"
                    required
                  />
                </div>

                <div>
                  <label className={labelClassName}>Notas</label>
                  <textarea
                    name="notes"
                    value={formState.notes}
                    onChange={handleFieldChange}
                    rows={6}
                    placeholder="Observações sobre a planta..."
                    className={`${inputClassName} resize-none`}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <span className={sectionClassName}>Datas</span>

                <div className="mb-3">
                  <label className={labelClassName}>
                    Data de plantio <span className="text-amber-500">*</span>
                  </label>
                  <DateField
                    value={formState.plantedDate}
                    onChange={(plantedDate) => setFormState((previous) => ({ ...previous, plantedDate }))}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className={labelClassName}>Colheita estimada</label>
                  <DateField
                    value={formState.estimatedDate}
                    onChange={(estimatedDate) => setFormState((previous) => ({ ...previous, estimatedDate }))}
                  />
                </div>

                <span className={sectionClassName}>Foto da planta</span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="plant-image-upload"
                />

                {formState.image ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#dee2e6] bg-[#f8f9fa]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formState.image}
                      alt="Pré-visualização"
                      className="w-full object-cover"
                      style={{ height: '205px' }}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-[#f1f5f0] rounded-lg text-xs font-semibold text-[#324b2c] flex items-center gap-1.5 shadow transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" /> Trocar
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="plant-image-upload"
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#dee2e6] rounded-xl cursor-pointer hover:border-[#718f60] hover:bg-[#f8f9fa] transition-all"
                    style={{ height: '205px' }}
                  >
                    <ImagePlus className="w-7 h-7 text-[#adb5bd]" />
                    <span className="text-sm text-[#adb5bd]">Clique para adicionar uma foto</span>
                    <span className="text-xs text-[#adb5bd]/60">PNG, JPG, WEBP</span>
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <span className={sectionClassName}>Faixas ideais</span>

                <div className="mb-3">
                  <label className={labelClassName}>Umidade ideal (%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="idealMoistureMin"
                      value={formState.idealMoistureMin}
                      onChange={handleFieldChange}
                      placeholder="Mín."
                      className={inputClassName}
                    />
                    <input
                      type="number"
                      name="idealMoistureMax"
                      value={formState.idealMoistureMax}
                      onChange={handleFieldChange}
                      placeholder="Máx."
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className={labelClassName}>pH ideal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      name="idealPHMin"
                      value={formState.idealPHMin}
                      onChange={handleFieldChange}
                      placeholder="Mín."
                      className={inputClassName}
                    />
                    <input
                      type="number"
                      step="0.1"
                      name="idealPHMax"
                      value={formState.idealPHMax}
                      onChange={handleFieldChange}
                      placeholder="Máx."
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className={labelClassName}>Temperatura ideal (°C)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="idealTempMin"
                      value={formState.idealTempMin}
                      onChange={handleFieldChange}
                      placeholder="Mín."
                      className={inputClassName}
                    />
                    <input
                      type="number"
                      name="idealTempMax"
                      value={formState.idealTempMax}
                      onChange={handleFieldChange}
                      placeholder="Máx."
                      className={inputClassName}
                    />
                  </div>
                </div>

                <span className={sectionClassName}>Irrigação automática</span>
                <label className="flex items-start gap-2.5 p-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-xl cursor-pointer hover:border-[#718f60] transition-colors mb-3">
                  <input
                    type="checkbox"
                    name="autoIrrigation"
                    checked={formState.autoIrrigation}
                    onChange={handleFieldChange}
                    className="w-4 h-4 accent-[#324b2c] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#324b2c]">Ativar irrigação automática</p>
                    <p className="text-xs text-[#6c757d] mt-0.5">Desabilita a irrigação manual</p>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`${labelClassName} ${!formState.autoIrrigation ? 'opacity-40' : ''}`}>
                      Quantidade (ml) {formState.autoIrrigation && <span className="text-amber-500">*</span>}
                    </label>
                    <input
                      type="number"
                      name="irrigationAmount"
                      value={formState.irrigationAmount}
                      onChange={handleFieldChange}
                      placeholder="Ex: 250"
                      disabled={!formState.autoIrrigation}
                      required={formState.autoIrrigation}
                      className={`${inputClassName} ${!formState.autoIrrigation ? 'opacity-40 cursor-not-allowed bg-[#f0f0f0]' : ''}`}
                    />
                  </div>
                  <div>
                    <label className={`${labelClassName} ${!formState.autoIrrigation ? 'opacity-40' : ''}`}>
                      Intervalo (horas) {formState.autoIrrigation && <span className="text-amber-500">*</span>}
                    </label>
                    <input
                      type="number"
                      name="irrigationInterval"
                      value={formState.irrigationInterval}
                      onChange={handleFieldChange}
                      placeholder="Ex: 12"
                      disabled={!formState.autoIrrigation}
                      required={formState.autoIrrigation}
                      className={`${inputClassName} ${!formState.autoIrrigation ? 'opacity-40 cursor-not-allowed bg-[#f0f0f0]' : ''}`}
                    />
                  </div>
                </div>

                {formState.autoIrrigation && (
                  <label className="flex items-start gap-2.5 p-3 bg-[#f8f9fa] border border-[#dee2e6] rounded-xl cursor-pointer hover:border-[#718f60] transition-colors mt-3">
                    <input
                      type="checkbox"
                      name="irrigationHardwareInstalled"
                      checked={formState.irrigationHardwareInstalled}
                      onChange={handleFieldChange}
                      className="w-4 h-4 accent-[#324b2c] mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#324b2c]">Hardware de irrigação instalado</p>
                      <p className="text-xs text-[#6c757d] mt-0.5">
                        Marque só depois que o relé e a bomba estiverem fisicamente montados neste slot. Sem isso,
                        nenhum comando de irrigação é enviado ao hub, mesmo com a irrigação automática ativada.
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-[#dee2e6] flex gap-3 flex-shrink-0 bg-[#f8f9fa]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#dee2e6] bg-white text-[#324b2c] rounded-xl font-semibold hover:bg-[#f0f0f0] transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="plant-form"
            className="flex-1 py-2.5 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#4a6b40] transition-colors shadow-sm text-sm"
          >
            {isEditMode ? 'Salvar alterações' : 'Cadastrar planta'}
          </button>
        </div>
      </div>
    </div>
  );
}
