import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/shared/lib/session';
import { deletePlant, updatePlant } from '@/modules/plants/server/plants.service';

const rangeSchema = z.object({ min: z.number(), max: z.number() }).optional();

const plantInputSchema = z.object({
  name: z.string().min(1),
  scientificName: z.string().optional(),
  slot: z.string().min(1),
  plantedDate: z.string().optional(),
  estimatedDate: z.string().optional(),
  idealMoisture: rangeSchema,
  idealPH: rangeSchema,
  idealTemp: rangeSchema,
  autoIrrigation: z.boolean().optional(),
  irrigationAmount: z.number().optional(),
  irrigationInterval: z.number().optional(),
  irrigationHardwareInstalled: z.boolean().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/plants/:id - atualiza os dados cadastrais de uma planta.
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = plantInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Dados da planta inválidos.', issues: parsed.error.issues }, { status: 400 });
  }

  const plant = await updatePlant(id, parsed.data);
  if (!plant) return NextResponse.json({ message: 'Planta não encontrada.' }, { status: 404 });

  return NextResponse.json({ plant });
}

// DELETE /api/plants/:id - remove a planta e o histórico de leituras associado.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const { id } = await params;
  await deletePlant(id);
  return NextResponse.json({ ok: true });
}
