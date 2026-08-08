# 🌱 Garden Monitor Web

<p align="center">
  <a href="https://github.com/lucas-hochmann-rosa/garden-monitor-web">
    <img src="https://img.shields.io/badge/GitHub-garden--monitor--web-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://www.linkedin.com/in/lucas-hochmann-rosa">
    <img src="https://img.shields.io/badge/LinkedIn-Lucas_Hochmann_Rosa-0A66C2?style=for-the-badge&logo=linkedin">
  </a>
  <a href="#-tecnologias">
    <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs">
  </a>
  <a href="#-tecnologias">
    <img src="https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/Licença-MIT-2ea44f?style=for-the-badge">
  </a>
</p>

<p align="center">🇧🇷 Português · <a href="README.en.md">🇺🇸 English</a></p>

> Plataforma de monitoramento de horta via sensores IoT reais - um hub ESP8266 publica umidade do solo e pH por planta, além do clima da horta inteira, direto num banco Postgres (Neon).

---

## 📌 Visão Geral

O Garden Monitor Web nasceu como uma SPA em React com dados simulados e foi reescrito do zero como aplicação full-stack em Next.js: banco Postgres real (Neon), ingestão de sensores real via um hub ESP8266, e um modelo de acesso com dois caminhos bem separados:

- **`/admin`** - área autenticada de um único administrador (a pessoa que cuida da horta física), com CRUD completo de plantas e histórico de atividades gravados de verdade no banco.
- **`/demo`** - demonstração pública, sem login, com as plantas de exemplo semeadas no banco. Qualquer criação/edição/exclusão feita ali existe só em memória no navegador - nunca é salva.

---

## ✨ Funcionalidades

- **Sensores reais por planta:** umidade do solo (obrigatório) e pH (opcional, sonda PH4502C) - um hub ESP8266 publica as leituras via `POST /api/readings`.
- **Clima compartilhado da horta:** temperatura e umidade do ar (DHT11) medidos uma vez por ciclo do hub, não por planta.
- **Multiplexador analógico opcional:** o firmware suporta monitorar várias plantas com um único ESP8266 (CD74HC4051), com um modo simples de 1 sensor para quem ainda não montou o multiplexador.
- **Admin único:** login autenticado por variáveis de ambiente (usuário + hash SHA-256 da senha), sem tabela de usuários no banco.
- **Demonstração pública sem persistência:** mesma interface do admin, dados de exemplo, qualquer alteração é só local ao navegador - com um aviso fixo na tela.
- **Selo EXEMPLO/REAL:** toda planta exibe se é de demonstração ou da horta real.
- **Clima real da região:** a landing page pública busca o clima atual via Open-Meteo (sem chave de API), a partir da latitude/longitude configuradas.
- **Dashboard com alertas:** compara cada planta com suas faixas ideais de umidade, pH e temperatura, e sinaliza quando alguma está fora da faixa.
- **Histórico de atividades:** registros manuais e de irrigação, com autor e planta associada.

---

## 🧭 Sumário

- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Regras de construção do projeto](#-regras-de-construção-do-projeto)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Execução](#-execução)
- [Endpoints Principais](#-endpoints-principais)
- [Acesso: admin e demonstração](#-acesso-admin-e-demonstração)
- [Hardware e Firmware](#-hardware-e-firmware)
- [Autor](#-autor)
- [Licença](#-licença)

---

## 🏗️ Arquitetura

```text
garden-monitor-web/
|-- src/
|   |-- app/
|   |   |-- page.tsx                # landing page publica (nome da horta + clima real)
|   |   |-- admin/                  # area autenticada (login em /admin, paginas em (shell))
|   |   |-- demo/                   # demonstracao publica, sem sessao
|   |   `-- api/                    # route handlers (API REST)
|   |-- modules/                    # logica de dominio: auth, plants, records, dashboard, settings, about, support
|   |   `-- <modulo>/
|   |       |-- components/           # UI (client components)
|   |       |-- server/               # acesso a dados (SQL) - so roda no servidor
|   |       `-- types/
|   `-- shared/
|       |-- components/layout/        # AppShell, SidebarNav, Topbar, BrandMark
|       |-- demo/                     # DemoProvider (estado da demonstracao, so em memoria)
|       `-- lib/                      # db.ts, session.ts, weather.ts, plant-metrics.ts, formatters.ts
|-- db/
|   `-- schema.sql                  # schema do Postgres (Neon)
|-- scripts/
|   |-- migrate.ts                  # aplica db/schema.sql
|   |-- seed.ts                     # popula garden_settings + plantas/registros de exemplo
|   `-- hash-admin-password.ts      # gera o valor de ADMIN_PASSWORD_HASH
`-- firmware/
    `-- esp8266_garden_monitor/     # firmware Arduino do hub ESP8266
```

- `src/app/admin`: rotas protegidas pelo middleware - CRUD real contra o banco.
- `src/app/demo`: rotas públicas - o layout busca as plantas de exemplo uma vez e entrega ao `DemoProvider`, que passa a ser a fonte dos dados no client.
- `src/modules/*/server`: toda consulta SQL fica isolada aqui - nunca é importada por um Client Component.
- `src/shared/lib/plant-metrics.ts`: fórmulas de crescimento/status compartilhadas entre o servidor (admin) e o `DemoProvider` (client), para as duas trilhas calcularem exatamente igual.

---

## 🧰 Tecnologias

- **Next.js 15** (App Router, Route Handlers, Server Components) + TypeScript
- **Neon Postgres** via [`@neondatabase/serverless`](https://github.com/neondatabase/serverless) (driver HTTP, ideal para serverless)
- **Tailwind CSS v4**
- **jose** (JWT de sessão do admin) + **crypto (Node)** (hash SHA-256 da senha do admin)
- **zod** (validação de payloads das rotas de API)
- **Open-Meteo** (clima real da região, sem chave de API)
- **ESP8266** (Arduino/C++) para leitura real dos sensores

Deploy recomendado: **Vercel** (frontend + API routes) + **Neon** (banco). Não é necessário nenhum servidor separado - as rotas de API do Next.js já cobrem o backend.

---

## 📐 Regras de construção do projeto

- Identificadores, rotas, contratos de request/response e nomes de arquivo/pasta ficam em **inglês**.
- Interface visível (labels, mensagens de erro/sucesso, textos do dashboard) fica em **português**.
- Comentários no código ficam em **português**, incluindo um cabeçalho curto no topo de cada arquivo explicando seu papel - mais generoso que o normal, porque este projeto também serve como peça de portfólio.
- Logs do firmware (`Serial.print*`) mantêm os níveis `INFO`/`WARNING`/`ERROR` em inglês; o resto da mensagem fica em português.
- Nenhuma credencial é commitada: `.env.local` fica fora do repositório, só `.env.example` é versionado.

---

## ⚙️ Requisitos

- Node.js >= 20
- npm >= 10
- Uma conta [Neon](https://neon.tech) (camada gratuita é suficiente)

---

## 🔧 Instalação

```bash
git clone https://github.com/lucas-hochmann-rosa/garden-monitor-web.git
cd garden-monitor-web
npm install
cp .env.example .env.local
```

Edite `.env.local` com a connection string do seu banco Neon e gere os demais
segredos (ver seção seguinte). Depois, aplique o schema e o seed:

```bash
npm run db:migrate   # cria as tabelas (db/schema.sql)
npm run db:seed      # cria a horta e as plantas de exemplo (garden_settings, plants, records)
```

---

## 🔐 Variáveis de Ambiente

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | sim | Connection string do Neon Postgres |
| `SESSION_SECRET` | sim | Segredo (>= 32 caracteres) usado para assinar o cookie de sessão do admin |
| `DEVICE_API_KEY` | sim | Chave que o firmware do ESP8266 envia no header `X-Api-Key` |
| `ADMIN_USERNAME` | sim | Usuário do único administrador |
| `ADMIN_PASSWORD_HASH` | sim | Hash SHA-256 da senha do admin - gere com `npm run admin:hash -- "sua-senha"` |
| `GARDEN_NAME` | não | Nome padrão semeado em `garden_settings` (o admin pode trocar depois, sem redeploy) |
| `WEATHER_LATITUDE` / `WEATHER_LONGITUDE` | não | Coordenadas da horta, usadas como estimativa no card "Clima da horta" enquanto nenhum sensor real publicou uma leitura. Em branco, o card fica vazio até o primeiro dado real |
| `HIDE_EXAMPLE_PLANTS` | não | `"true"` esconde as plantas de exemplo do admin e da demonstração pública (as linhas continuam no banco) |

---

## ▶️ Execução

```bash
npm run dev
```

Acesse `http://localhost:3000`: a landing pública, `http://localhost:3000/demo/dashboard` para a demonstração, e `http://localhost:3000/admin` para entrar como administrador.

---

## 📡 Endpoints Principais

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| POST | `/api/auth/login` \| `/logout` | Login/logout do admin |
| GET | `/api/auth/me` | Sessão atual do admin |
| GET / POST | `/api/plants` | Listar / cadastrar plantas (admin) |
| PATCH / DELETE | `/api/plants/{id}` | Editar / excluir uma planta (admin) |
| GET / POST | `/api/records` | Listar / criar registros de atividade (admin) |
| POST | `/api/readings` | Ingestão do hub ESP8266 (autenticado por `X-Api-Key`), payload em lote de clima + plantas |

---

## 🔑 Acesso: admin e demonstração

**Admin (`/admin`):** login com `ADMIN_USERNAME`/senha (comparada ao hash em `ADMIN_PASSWORD_HASH`). Depois de logado, `/admin/dashboard`, `/admin/plants`, `/admin/records`, `/admin/about` e `/admin/support` operam contra o banco de verdade.

**Demonstração (`/demo`):** pública, sem login. Mostra só as plantas marcadas como `EXEMPLO`. Toda criação/edição/exclusão fica só em memória no navegador (via `DemoProvider`) - um aviso fixo no topo da tela lembra que nada ali é salvo.

Cada card de planta traz um selo `EXEMPLO` ou `REAL`, então mesmo dentro do admin (onde os dois tipos podem coexistir) fica claro qual dado vem de um sensor de verdade.

---

## 🔌 Hardware e Firmware

O dashboard exibe dados reais assim que o firmware do hub ESP8266 começa a publicar leituras. Guia completo de hardware, ligações (com e sem o multiplexador CD74HC4051) e calibração do sensor de solo/pH em [`firmware/README.md`](./firmware/README.md).

Resumo do protocolo:

```json
POST /api/readings
Header: X-Api-Key: <DEVICE_API_KEY>
{
  "climate": { "temperature": 24.1, "airHumidity": 58.7 },
  "plants": [{ "slot": "Slot 1", "soilMoisture": 62.4, "ph": 6.6 }]
}
```

---

## 🌳 Fluxo de branches

- `main`: versão estável, publicada em produção.
- `develop`: branch de integração para novas funcionalidades.

---

## 👨‍💻 Autor

**Lucas Hochmann Rosa**

- Repositório: <https://github.com/lucas-hochmann-rosa/garden-monitor-web>
- GitHub: <https://github.com/lucas-hochmann-rosa>
- LinkedIn: <https://www.linkedin.com/in/lucas-hochmann-rosa>

---

## 📄 Licença

Licenciado sob MIT. Sinta-se livre para usar, modificar e distribuir, mantendo o aviso de copyright e atribuindo crédito a Lucas Hochmann Rosa. Consulte [LICENSE](./LICENSE).
