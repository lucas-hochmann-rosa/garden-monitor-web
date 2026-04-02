-- Schema do Garden Monitor Web no Neon Postgres.
-- Rode com: npm run db:migrate (executa este arquivo via scripts/migrate.ts)
--
-- Modelo de dados: uma horta tem N plantas cadastradas; cada planta tem seu próprio
-- histórico de umidade do solo/pH (plant_readings); temperatura e umidade do ar são
-- medidas uma vez por hub ESP8266 e valem para a horta inteira (climate_readings),
-- não por planta.

create extension if not exists pgcrypto;

-- Configurações globais da horta. Linha única (id sempre "true") para não precisar
-- de uma tabela de "settings" com chave/valor genérica só para 1 campo.
create table if not exists garden_settings (
  id boolean primary key default true,
  garden_name text not null,
  constraint garden_settings_single_row check (id)
);

-- Plantas cadastradas na horta.
-- is_example distingue plantas de demonstração (visíveis publicamente em /demo,
-- nunca recebem leitura real de sensor) das plantas reais da horta física do
-- administrador (visíveis só em /admin, alimentadas pelo ESP8266).
-- baseline_soil_moisture/baseline_ph alimentam o dashboard só enquanto a planta
-- ainda não recebeu nenhuma leitura real de sensor (plant_readings vazio).
create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scientific_name text,
  slot text not null unique,
  image_url text,
  is_example boolean not null default false,
  planted_date date,
  estimated_harvest_date date,
  ideal_moisture_min numeric,
  ideal_moisture_max numeric,
  ideal_ph_min numeric,
  ideal_ph_max numeric,
  ideal_temp_min numeric,
  ideal_temp_max numeric,
  auto_irrigation boolean not null default false,
  irrigation_amount_ml numeric,
  irrigation_interval_hours numeric,
  notes text,
  baseline_soil_moisture numeric not null default 50,
  baseline_ph numeric not null default 6.5,
  created_at timestamptz not null default now()
);

-- Leituras de umidade do solo/pH por planta, enviadas pelo ESP8266 (uma linha por
-- planta a cada ciclo de leitura do hub).
create table if not exists plant_readings (
  id bigserial primary key,
  plant_id uuid not null references plants(id) on delete cascade,
  soil_moisture numeric not null,
  ph numeric,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_plant_readings_plant_recorded
  on plant_readings (plant_id, recorded_at desc);

-- Leituras de clima da horta (temperatura/umidade do ar), uma por ciclo do hub
-- ESP8266 (sensor DHT11 compartilhado, não vinculado a uma planta específica).
create table if not exists climate_readings (
  id bigserial primary key,
  temperature numeric,
  air_humidity numeric,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_climate_readings_recorded on climate_readings (recorded_at desc);

-- Histórico de atividades da horta (ações do sistema e irrigações).
create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('system', 'user', 'auto-irrigation', 'manual-irrigation')),
  title text not null,
  description text not null,
  author text not null,
  plant_id uuid references plants(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_records_created_at on records (created_at desc);
