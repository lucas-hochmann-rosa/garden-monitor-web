import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ingestReadingsBatch } from '@/modules/plants/server/plants.service';

const plantReadingSchema = z.object({
  slot: z.string().min(1),
  soilMoisture: z.number(),
  ph: z.number().optional(),
});

const readingsBatchSchema = z.object({
  climate: z
    .object({
      temperature: z.number().optional(),
      airHumidity: z.number().optional(),
    })
    .optional(),
  plants: z.array(plantReadingSchema).min(1),
});

// POST /api/readings - endpoint público (autenticado por API key) que o hub ESP8266
// chama a cada ciclo de leitura, publicando em um único payload: a leitura de clima
// da horta (DHT11, opcional) e a leitura de solo/pH de cada planta configurada no
// firmware (ver firmware/esp8266_garden_monitor). Slots sem planta cadastrada não
// derrubam a requisição inteira - vêm listados em "unknownSlots" na resposta.
export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
    return NextResponse.json({ message: 'Chave de API inválida.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = readingsBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'Payload de leitura inválido.' }, { status: 400 });
  }

  const result = await ingestReadingsBatch(parsed.data);
  return NextResponse.json({ ok: true, ...result }, { status: 201 });
}
