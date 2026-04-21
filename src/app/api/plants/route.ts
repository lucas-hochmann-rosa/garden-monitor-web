import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/shared/lib/session';
import { createPlant, listPlants } from '@/modules/plants/server/plants.service';

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
  notes: z.string().optional(),
  image: z.string().optional(),
});

// GET /api/plants - lista todas as plantas (exemplo + reais) com a leitura mais
// recente. Só o admin autenticado acessa esta rota (a demonstração pública lê
// plantas de exemplo direto do servidor, sem passar por aqui).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const plants = await listPlants();
  return NextResponse.json({ plants });
}

// POST /api/plants - cadastra uma nova planta real da horta.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = plantInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Dados da planta inválidos.', issues: parsed.error.issues }, { status: 400 });
  }

  const plant = await createPlant(parsed.data);
  return NextResponse.json({ plant }, { status: 201 });
}
