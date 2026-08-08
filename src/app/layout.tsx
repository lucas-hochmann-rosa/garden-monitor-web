import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Inter (interface/corpo) e JetBrains Mono (dados "de máquina": leituras,
// timestamps, slot, hash) - auto-hospedadas pelo next/font (baixadas no build,
// servidas pelo próprio domínio, sem chamada a CDN externa). Só os pesos que o
// sistema de design permite (400/500 - o 600 do mono fica só para inline se
// algum dia precisar de ênfase pontual).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
  display: 'swap',
});

// Metadados globais do site (idioma português, título exibido no navegador).
// O ícone da aba é resolvido automaticamente pelo Next.js a partir de src/app/icon.svg.
export const metadata: Metadata = {
  title: 'Garden Monitor',
  description: 'Plataforma web de monitoramento de hortas IoT em tempo real, com sensores reais via ESP8266.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
