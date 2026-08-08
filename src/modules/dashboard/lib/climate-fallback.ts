// Enquanto nenhum hub ESP8266 publicou uma leitura real de clima, o card "Clima da
// horta" ficaria vazio - então usamos o clima regional (Open-Meteo, sem custo de
// API) como uma estimativa provisória. Nunca sobrescreve uma leitura real: assim
// que o sensor DHT11 publicar algo, climate_readings passa a valer.
import type { GardenClimate } from '@/modules/dashboard/types/dashboard.types';
import type { CurrentWeather } from '@/shared/lib/weather';

export function mergeClimateWithWeatherFallback(
  climate: GardenClimate,
  weather: CurrentWeather | null,
): GardenClimate {
  if (climate.temperature !== null || !weather) return climate;

  return {
    temperature: weather.temperature,
    airHumidity: weather.airHumidity,
    recordedAt: null,
  };
}
