'use client';

// Contexto do modo de demonstração pública (/demo). Guarda em memória, só no
// navegador, o estado das plantas/registros de exemplo carregados do servidor uma
// única vez; toda criação/edição/exclusão feita aqui muda só esse estado local -
// nunca chama a API real, então nada é persistido no banco (por construção, não por
// uma checagem de permissão que poderia ser esquecida em algum lugar).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { calculateGrowthPercent, calculateStatus } from '@/shared/lib/plant-metrics';
import { summarizePlants } from '@/modules/dashboard/lib/summarize-plants';
import type { Plant, PlantFormInput } from '@/modules/plants/types/plant.types';
import type { GardenRecord, RecordType } from '@/modules/records/types/record.types';
import type { DashboardSummary, GardenClimate } from '@/modules/dashboard/types/dashboard.types';

interface NewDemoRecordInput {
  type: RecordType;
  title: string;
  description: string;
  plantId?: string;
}

interface DemoContextValue {
  plants: Plant[];
  records: GardenRecord[];
  summary: DashboardSummary;
  savePlant: (input: PlantFormInput, editingId?: string) => void;
  deletePlant: (id: string) => void;
  createRecord: (input: NewDemoRecordInput) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Retorna o contexto de demonstração, ou null quando renderizado fora dele (ou seja,
// dentro do admin de verdade) - é esse null que os painéis usam para decidir se
// falam com a API real ou só com o estado local.
export function useDemoContext(): DemoContextValue | null {
  return useContext(DemoContext);
}

// Monta uma planta "de mentira" a partir do formulário, sem nenhuma leitura real de
// sensor (a demonstração nunca recebe dado do ESP8266) - solo/pH ficam nos mesmos
// valores padrão de referência usados no banco (ver db/schema.sql).
function buildPlantFromForm(input: PlantFormInput, id: string, previous?: Plant): Plant {
  const soilMoisture = previous?.soilMoisture ?? 50;
  const pH = previous?.pH ?? 6.5;

  return {
    id,
    name: input.name,
    scientificName: input.scientificName,
    slot: input.slot,
    soilMoisture,
    pH,
    growth: calculateGrowthPercent(input.plantedDate, input.estimatedDate),
    status: calculateStatus(soilMoisture, pH, null, input.idealMoisture, input.idealPH, input.idealTemp),
    image: input.image,
    isExample: true,
    plantedDate: input.plantedDate,
    estimatedDate: input.estimatedDate,
    idealMoisture: input.idealMoisture,
    idealPH: input.idealPH,
    idealTemp: input.idealTemp,
    autoIrrigation: input.autoIrrigation,
    irrigationAmount: input.irrigationAmount,
    irrigationInterval: input.irrigationInterval,
    notes: input.notes,
    hasRealReading: previous?.hasRealReading ?? false,
    lastReadingAt: previous?.lastReadingAt,
  };
}

interface DemoProviderProps {
  initialPlants: Plant[];
  initialRecords: GardenRecord[];
  climate: GardenClimate;
  children: ReactNode;
}

export function DemoProvider({ initialPlants, initialRecords, climate, children }: DemoProviderProps) {
  const [plants, setPlants] = useState<Plant[]>(initialPlants);
  const [records, setRecords] = useState<GardenRecord[]>(initialRecords);

  const savePlant = useCallback((input: PlantFormInput, editingId?: string) => {
    setPlants((previousPlants) => {
      if (editingId) {
        return previousPlants.map((plant) =>
          plant.id === editingId ? buildPlantFromForm(input, editingId, plant) : plant,
        );
      }
      return [...previousPlants, buildPlantFromForm(input, crypto.randomUUID())];
    });
  }, []);

  const deletePlant = useCallback((id: string) => {
    setPlants((previousPlants) => previousPlants.filter((plant) => plant.id !== id));
  }, []);

  const createRecord = useCallback(
    (input: NewDemoRecordInput) => {
      const relatedPlant = plants.find((plant) => plant.id === input.plantId);
      const record: GardenRecord = {
        id: crypto.randomUUID(),
        type: input.type,
        title: input.title,
        description: input.description,
        author: 'Visitante (demonstração)',
        plant: relatedPlant?.name,
        date: new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setRecords((previousRecords) => [record, ...previousRecords]);
    },
    [plants],
  );

  const summary = useMemo(() => summarizePlants(plants, climate), [plants, climate]);

  const value = useMemo(
    () => ({ plants, records, summary, savePlant, deletePlant, createRecord }),
    [plants, records, summary, savePlant, deletePlant, createRecord],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
