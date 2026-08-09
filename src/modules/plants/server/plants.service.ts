// Acesso a dados do módulo "plantas": CRUD de plantas e ingestão das leituras
// enviadas pelo hub ESP8266 (umidade do solo/pH por planta + clima da horta).
import { sql } from '@/shared/lib/db';
import { calculateGrowthPercent, calculateStatus } from '@/shared/lib/plant-metrics';
import { createRecord } from '@/modules/records/server/records.service';
import type { Plant, PlantFormInput } from '@/modules/plants/types/plant.types';

interface PlantRow {
  id: string;
  name: string;
  scientific_name: string | null;
  slot: string;
  image_url: string | null;
  is_example: boolean;
  planted_date: string | null;
  estimated_harvest_date: string | null;
  ideal_moisture_min: string | null;
  ideal_moisture_max: string | null;
  ideal_ph_min: string | null;
  ideal_ph_max: string | null;
  ideal_temp_min: string | null;
  ideal_temp_max: string | null;
  auto_irrigation: boolean;
  irrigation_amount_ml: string | null;
  irrigation_interval_hours: string | null;
  irrigation_hardware_installed: boolean;
  notes: string | null;
  baseline_soil_moisture: string;
  baseline_ph: string;
  latest_soil_moisture: string | null;
  latest_ph: string | null;
  latest_reading_at: string | null;
  garden_temperature: string | null;
  latest_auto_irrigation_at: string | null;
}

function mapRowToPlant(row: PlantRow): Plant {
  const idealMoisture =
    row.ideal_moisture_min !== null && row.ideal_moisture_max !== null
      ? { min: Number(row.ideal_moisture_min), max: Number(row.ideal_moisture_max) }
      : undefined;
  const idealPH =
    row.ideal_ph_min !== null && row.ideal_ph_max !== null
      ? { min: Number(row.ideal_ph_min), max: Number(row.ideal_ph_max) }
      : undefined;
  const idealTemp =
    row.ideal_temp_min !== null && row.ideal_temp_max !== null
      ? { min: Number(row.ideal_temp_min), max: Number(row.ideal_temp_max) }
      : undefined;

  // Plantas de exemplo sempre mostram um valor (baseline, até chegar leitura real) -
  // é o que sustenta a demonstração pública. Plantas reais NUNCA mostram dado
  // simulado: sem leitura real, o valor fica null e a interface exibe "sem leitura".
  const hasRealReading = row.latest_reading_at !== null;
  const soilMoisture = hasRealReading
    ? Number(row.latest_soil_moisture)
    : row.is_example
      ? Number(row.baseline_soil_moisture)
      : null;
  const pH = hasRealReading && row.latest_ph !== null
    ? Number(row.latest_ph)
    : row.is_example
      ? Number(row.baseline_ph)
      : null;
  const gardenTemperature = row.garden_temperature !== null ? Number(row.garden_temperature) : null;

  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name ?? undefined,
    slot: row.slot,
    soilMoisture,
    pH,
    isExample: row.is_example,
    growth: calculateGrowthPercent(row.planted_date, row.estimated_harvest_date),
    status: calculateStatus(soilMoisture, pH, gardenTemperature, idealMoisture, idealPH, idealTemp),
    image: row.image_url ?? undefined,
    plantedDate: row.planted_date ?? undefined,
    estimatedDate: row.estimated_harvest_date ?? undefined,
    idealMoisture,
    idealPH,
    idealTemp,
    autoIrrigation: row.auto_irrigation,
    irrigationAmount: row.irrigation_amount_ml !== null ? Number(row.irrigation_amount_ml) : undefined,
    irrigationInterval: row.irrigation_interval_hours !== null ? Number(row.irrigation_interval_hours) : undefined,
    irrigationHardwareInstalled: row.irrigation_hardware_installed,
    lastAutoIrrigationAt: row.latest_auto_irrigation_at ?? undefined,
    notes: row.notes ?? undefined,
    hasRealReading,
    lastReadingAt: row.latest_reading_at ?? undefined,
  };
}

// As três consultas abaixo repetem o mesmo par de "left join lateral" (última
// leitura de solo/pH da própria planta + última leitura de clima da horta) porque
// o driver HTTP do Neon (sql`...`) não compõe fragmentos de SQL entre chamadas -
// cada chamada de "sql" precisa ser uma tagged template completa e autocontida.

// Lista todas as plantas com a leitura mais recente já embutida. Usada tanto pelo
// admin quanto pelo layout de /demo - se HIDE_EXAMPLE_PLANTS estiver ligada, as
// plantas de exemplo somem dos dois lugares de uma vez só, sem precisar filtrar em
// cada chamador (útil quando a horta real já tem plantas suficientes e os exemplos
// só atrapalham).
export async function listPlants(): Promise<Plant[]> {
  const rows = (await sql`
    select
      p.*,
      pr.soil_moisture as latest_soil_moisture,
      pr.ph as latest_ph,
      pr.recorded_at as latest_reading_at,
      cr.temperature as garden_temperature,
      ai.created_at as latest_auto_irrigation_at
    from plants p
    left join lateral (
      select soil_moisture, ph, recorded_at from plant_readings
      where plant_id = p.id order by recorded_at desc limit 1
    ) pr on true
    left join lateral (
      select temperature from climate_readings order by recorded_at desc limit 1
    ) cr on true
    left join lateral (
      select created_at from records
      where plant_id = p.id and type = 'auto-irrigation'
      order by created_at desc limit 1
    ) ai on true
    order by p.slot
  `) as unknown as PlantRow[];

  const plants = rows.map(mapRowToPlant);
  const hideExamplePlants = process.env.HIDE_EXAMPLE_PLANTS === 'true';
  return hideExamplePlants ? plants.filter((plant) => !plant.isExample) : plants;
}

// Busca uma planta pelo id, com a leitura mais recente.
export async function getPlantById(id: string): Promise<Plant | null> {
  const rows = (await sql`
    select
      p.*,
      pr.soil_moisture as latest_soil_moisture,
      pr.ph as latest_ph,
      pr.recorded_at as latest_reading_at,
      cr.temperature as garden_temperature,
      ai.created_at as latest_auto_irrigation_at
    from plants p
    left join lateral (
      select soil_moisture, ph, recorded_at from plant_readings
      where plant_id = p.id order by recorded_at desc limit 1
    ) pr on true
    left join lateral (
      select temperature from climate_readings order by recorded_at desc limit 1
    ) cr on true
    left join lateral (
      select created_at from records
      where plant_id = p.id and type = 'auto-irrigation'
      order by created_at desc limit 1
    ) ai on true
    where p.id = ${id}
  `) as unknown as PlantRow[];

  const row = rows[0];
  return row ? mapRowToPlant(row) : null;
}

// Cadastra uma nova planta real (o cadastro pela API/admin nunca cria planta de
// exemplo - só o seed insere is_example = true diretamente via SQL).
export async function createPlant(input: PlantFormInput): Promise<Plant> {
  const rows = (await sql`
    insert into plants (
      name, scientific_name, slot, image_url, is_example, planted_date, estimated_harvest_date,
      ideal_moisture_min, ideal_moisture_max, ideal_ph_min, ideal_ph_max,
      ideal_temp_min, ideal_temp_max, auto_irrigation, irrigation_amount_ml,
      irrigation_interval_hours, irrigation_hardware_installed, notes
    )
    values (
      ${input.name}, ${input.scientificName || null}, ${input.slot}, ${input.image || null}, false,
      ${input.plantedDate || null}, ${input.estimatedDate || null},
      ${input.idealMoisture?.min ?? null}, ${input.idealMoisture?.max ?? null},
      ${input.idealPH?.min ?? null}, ${input.idealPH?.max ?? null},
      ${input.idealTemp?.min ?? null}, ${input.idealTemp?.max ?? null},
      ${input.autoIrrigation ?? false}, ${input.irrigationAmount ?? null},
      ${input.irrigationInterval ?? null}, ${input.irrigationHardwareInstalled ?? false}, ${input.notes || null}
    )
    returning id
  `) as unknown as { id: string }[];

  const created = await getPlantById(rows[0]!.id);
  return created!;
}

// Atualiza os dados cadastrais de uma planta existente.
export async function updatePlant(id: string, input: PlantFormInput): Promise<Plant | null> {
  const rows = (await sql`
    update plants set
      name = ${input.name},
      scientific_name = ${input.scientificName || null},
      slot = ${input.slot},
      image_url = ${input.image || null},
      planted_date = ${input.plantedDate || null},
      estimated_harvest_date = ${input.estimatedDate || null},
      ideal_moisture_min = ${input.idealMoisture?.min ?? null},
      ideal_moisture_max = ${input.idealMoisture?.max ?? null},
      ideal_ph_min = ${input.idealPH?.min ?? null},
      ideal_ph_max = ${input.idealPH?.max ?? null},
      ideal_temp_min = ${input.idealTemp?.min ?? null},
      ideal_temp_max = ${input.idealTemp?.max ?? null},
      auto_irrigation = ${input.autoIrrigation ?? false},
      irrigation_amount_ml = ${input.irrigationAmount ?? null},
      irrigation_interval_hours = ${input.irrigationInterval ?? null},
      irrigation_hardware_installed = ${input.irrigationHardwareInstalled ?? false},
      notes = ${input.notes || null}
    where id = ${id}
    returning id
  `) as unknown as { id: string }[];

  if (!rows[0]) return null;
  return getPlantById(id);
}

// Remove uma planta (as leituras de sensor associadas são removidas em cascata).
export async function deletePlant(id: string): Promise<void> {
  await sql`delete from plants where id = ${id}`;
}

interface PlantReadingInput {
  slot: string;
  soilMoisture: number;
  ph?: number;
}

interface ReadingsBatchInput {
  climate?: { temperature?: number; airHumidity?: number };
  plants: PlantReadingInput[];
}

interface IrrigationCommand {
  slot: string;
  milliliters: number;
}

interface ReadingsBatchResult {
  climateRecorded: boolean;
  plantsUpdated: string[];
  unknownSlots: string[];
  irrigationCommands: IrrigationCommand[];
}

// Planta candidata a irrigação automática: só o que o cálculo de "está devendo
// irrigação?" precisa, já filtrado por auto_irrigation = true e is_example = false.
interface AutoIrrigationPlantRow {
  id: string;
  auto_irrigation: boolean;
  irrigation_amount_ml: string | null;
  irrigation_interval_hours: string | null;
  irrigation_hardware_installed: boolean;
}

// "Dispara e esquece": sem sensor de fluxo no hardware, não dá pra confirmar que a
// água realmente saiu - então isso decide só se já passou tempo suficiente desde o
// último comando emitido (reaproveita o histórico de "records" tipo
// "auto-irrigation" em vez de guardar isso numa coluna nova), e o registro criado
// representa "o comando foi mandado pro hub", não "a planta foi molhada de verdade".
// Planta com auto_irrigation ligada mas irrigation_hardware_installed = false não
// gera comando nem registro nenhum - o admin ainda não montou o relé/bomba, então
// não existe nada de verdade pra acionar (a interface mostra esse estado, ver
// PlantDetailsModal.tsx).
async function checkAndRecordAutoIrrigation(plant: AutoIrrigationPlantRow): Promise<IrrigationCommand | null> {
  if (!plant.auto_irrigation || !plant.irrigation_hardware_installed) return null;
  if (!plant.irrigation_amount_ml || !plant.irrigation_interval_hours) return null;

  const lastRows = (await sql`
    select created_at from records
    where plant_id = ${plant.id} and type = 'auto-irrigation'
    order by created_at desc
    limit 1
  `) as unknown as { created_at: string }[];

  const intervalMs = Number(plant.irrigation_interval_hours) * 60 * 60 * 1000;
  const lastAt = lastRows[0]?.created_at;
  const isDue = !lastAt || Date.now() - new Date(lastAt).getTime() >= intervalMs;
  if (!isDue) return null;

  const milliliters = Number(plant.irrigation_amount_ml);
  await createRecord({
    type: 'auto-irrigation',
    title: 'Irrigação automática',
    description: `Comando de irrigação automática enviado ao hub - ${milliliters}ml`,
    author: 'Sistema',
    plantId: plant.id,
  });

  return { slot: '', milliliters }; // slot preenchido pelo chamador, que já o conhece
}

// Registra um ciclo de leituras enviado pelo hub ESP8266: uma leitura de clima da
// horta (opcional, se o DHT11 respondeu) e uma leitura de solo/pH por planta do
// payload. Plantas de exemplo (is_example) são ignoradas - o sensor real nunca
// sobrescreve dado de demonstração - e slots sem planta cadastrada são reportados
// em unknownSlots em vez de interromper o processamento das demais. Além de gravar
// as leituras, verifica quais das plantas recebidas estão com irrigação automática
// vencida e devolve os comandos correspondentes na resposta (ver
// checkAndRecordAutoIrrigation) - o firmware aciona o relé configurado pra cada slot.
export async function ingestReadingsBatch(input: ReadingsBatchInput): Promise<ReadingsBatchResult> {
  let climateRecorded = false;
  if (input.climate && (input.climate.temperature !== undefined || input.climate.airHumidity !== undefined)) {
    await sql`
      insert into climate_readings (temperature, air_humidity)
      values (${input.climate.temperature ?? null}, ${input.climate.airHumidity ?? null})
    `;
    climateRecorded = true;
  }

  const plantsUpdated: string[] = [];
  const unknownSlots: string[] = [];
  const irrigationCommands: IrrigationCommand[] = [];

  for (const reading of input.plants) {
    const plantRows = (await sql`
      select id, auto_irrigation, irrigation_amount_ml, irrigation_interval_hours, irrigation_hardware_installed
      from plants where slot = ${reading.slot} and is_example = false
    `) as unknown as AutoIrrigationPlantRow[];
    const plant = plantRows[0];

    if (!plant) {
      unknownSlots.push(reading.slot);
      continue;
    }

    await sql`
      insert into plant_readings (plant_id, soil_moisture, ph)
      values (${plant.id}, ${reading.soilMoisture}, ${reading.ph ?? null})
    `;
    plantsUpdated.push(plant.id);

    const command = await checkAndRecordAutoIrrigation(plant);
    if (command) irrigationCommands.push({ ...command, slot: reading.slot });
  }

  return { climateRecorded, plantsUpdated, unknownSlots, irrigationCommands };
}

export interface LatestClimate {
  temperature: number | null;
  airHumidity: number | null;
  recordedAt: string | null;
}

// Última leitura de clima da horta (independente de qualquer planta), usada no
// resumo do dashboard.
export async function getLatestClimate(): Promise<LatestClimate> {
  const rows = (await sql`
    select temperature, air_humidity, recorded_at
    from climate_readings
    order by recorded_at desc
    limit 1
  `) as unknown as { temperature: string | null; air_humidity: string | null; recorded_at: string | null }[];

  const row = rows[0];
  if (!row) return { temperature: null, airHumidity: null, recordedAt: null };

  return {
    temperature: row.temperature !== null ? Number(row.temperature) : null,
    airHumidity: row.air_humidity !== null ? Number(row.air_humidity) : null,
    recordedAt: row.recorded_at,
  };
}
