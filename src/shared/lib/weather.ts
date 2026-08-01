// Clima real da região onde a horta está instalada, usado só na landing page pública.
// Usa a API gratuita da Open-Meteo (sem chave de API) - se WEATHER_LATITUDE/
// WEATHER_LONGITUDE não estiverem configuradas, ou a chamada falhar, retorna null e
// a landing page simplesmente não mostra o widget de clima (nunca quebra a página).
export interface CurrentWeather {
  temperature: number;
  airHumidity: number;
  description: string;
}

// Subconjunto dos códigos WMO usados pela Open-Meteo, traduzido para português.
// Referência: https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa forte',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva fortes',
  95: 'Tempestade',
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? 'Condição indisponível';
}

// Busca o clima atual (temperatura + umidade do ar) para a latitude/longitude
// configuradas via env. Cacheia por 10 minutos (revalidate) para não bater na API
// externa a cada carregamento da landing page.
export async function getCurrentWeather(): Promise<CurrentWeather | null> {
  const latitude = process.env.WEATHER_LATITUDE;
  const longitude = process.env.WEATHER_LONGITUDE;
  if (!latitude || !longitude) return null;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code');
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number };
    };
    const current = data.current;
    if (!current || current.temperature_2m === undefined || current.relative_humidity_2m === undefined) return null;

    return {
      temperature: current.temperature_2m,
      airHumidity: current.relative_humidity_2m,
      description: describeWeatherCode(current.weather_code ?? -1),
    };
  } catch {
    // Falha de rede/timeout não deve derrubar a landing page: só ocultamos o widget.
    return null;
  }
}
