import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

// Metadados globais do site (idioma português, título exibido no navegador).
// O ícone da aba é resolvido automaticamente pelo Next.js a partir de src/app/icon.svg.
export const metadata: Metadata = {
  title: 'Garden Monitor',
  description: 'Plataforma web de monitoramento de hortas IoT em tempo real, com sensores reais via ESP8266.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
