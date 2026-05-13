// Tipos de registro de atividade da horta. Valores internos em inglês; rótulos em português.
export type RecordType = 'system' | 'user' | 'auto-irrigation' | 'manual-irrigation';

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  system: 'Sistema',
  user: 'Usuário',
  'auto-irrigation': 'Auto irrigação',
  'manual-irrigation': 'Irrigação manual',
};

export interface GardenRecord {
  id: string;
  type: RecordType;
  title: string;
  description: string;
  date: string;
  author: string;
  plant?: string;
}

export interface NewRecordInput {
  type: RecordType;
  title: string;
  description: string;
  author: string;
  plantId?: string;
}
