import Link from 'next/link';
import { Sprout, Thermometer } from 'lucide-react';
import { BrandMark } from '@/shared/components/layout/BrandMark';
import { getGardenName } from '@/modules/settings/server/garden-settings.service';
import { getCurrentWeather } from '@/shared/lib/weather';

// Sempre renderizada sob demanda: o nome da horta vem do banco e o clima vem de uma
// API externa, nenhum dos dois deve ficar congelado no HTML gerado em build.
export const dynamic = 'force-dynamic';

// Landing page pública: nome da horta (banco), clima real da região (se
// WEATHER_LATITUDE/LONGITUDE estiverem configuradas) e os dois pontos de entrada -
// a demonstração aberta e, discretamente, a área administrativa.
export default async function LandingPage() {
  const [gardenName, weather] = await Promise.all([getGardenName(), getCurrentWeather()]);

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
      <BrandMark size="lg" />

      <h1 className="text-3xl font-bold text-[#324b2c] mt-6">{gardenName}</h1>
      <p className="text-sm text-[#6c757d] mt-2 max-w-md">
        Monitoramento em tempo real de umidade do solo, pH e clima da horta, com sensores reais publicando dados via
        ESP8266.
      </p>

      {weather && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white border border-[#dee2e6] rounded-xl shadow-sm text-sm text-[#324b2c]">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <span>
            {weather.temperature}°C - {weather.description} - {weather.airHumidity}% de umidade do ar na região
          </span>
        </div>
      )}

      <Link
        href="/demo/dashboard"
        className="mt-8 px-6 py-3 bg-[#324b2c] text-white rounded-xl font-semibold hover:bg-[#718f60] transition-colors flex items-center gap-2 shadow-sm"
      >
        <Sprout className="w-4 h-4" /> Ver demonstração
      </Link>

      <Link href="/admin" className="mt-10 text-xs text-[#adb5bd] hover:text-[#6c757d] transition-colors">
        Área administrativa
      </Link>
    </main>
  );
}
