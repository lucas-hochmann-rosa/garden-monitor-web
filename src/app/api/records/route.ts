import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/shared/lib/session';
import { createRecord, listRecords } from '@/modules/records/server/records.service';

const newRecordSchema = z.object({
  type: z.enum(['system', 'user', 'auto-irrigation', 'manual-irrigation']).default('user'),
  title: z.string().min(1),
  description: z.string().min(1),
  plantId: z.string().optional(),
});

// GET /api/records - lista o histórico de atividades da horta.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const records = await listRecords();
  return NextResponse.json({ records });
}

// POST /api/records - cria um novo registro de atividade. O autor é sempre o
// administrador logado (única identidade autenticada do sistema).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = newRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Dados do registro inválidos.' }, { status: 400 });
  }

  const record = await createRecord({ ...parsed.data, author: 'Administrador' });
  return NextResponse.json({ record }, { status: 201 });
}
