# 🌱 Garden Monitor Web

<p align="center">
  <a href="https://github.com/lucas-hochmann-rosa/garden-monitor-web">
    <img src="https://img.shields.io/badge/GitHub-garden--monitor--web-181717?style=for-the-badge&logo=github">
  </a>
  <a href="https://www.linkedin.com/in/lucas-hochmann-rosa">
    <img src="https://img.shields.io/badge/LinkedIn-Lucas_Hochmann_Rosa-0A66C2?style=for-the-badge&logo=linkedin">
  </a>
  <a href="#-tech-stack">
    <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs">
  </a>
  <a href="#-tech-stack">
    <img src="https://img.shields.io/badge/Neon-Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-2ea44f?style=for-the-badge">
  </a>
</p>

<p align="center"><a href="README.md">🇧🇷 Português</a> · 🇺🇸 English</p>

> Garden monitoring platform powered by real IoT sensors - an ESP8266 hub publishes per-plant soil moisture and pH, plus garden-wide climate, straight into a Postgres database (Neon). 

---

## 📌 Overview

Garden Monitor Web started as a React SPA with simulated data and was rewritten from scratch as a full-stack Next.js app: a real Postgres database (Neon), real sensor ingestion via an ESP8266 hub, and an access model split into two clearly separated paths:

- **`/admin`** - authenticated area for a single administrator (the person taking care of the physical garden), with full plant CRUD and an activity history actually persisted to the database.
- **`/demo`** - public demo, no login required, showing the example plants seeded in the database. Any create/edit/delete action there only exists in the browser's memory - it is never saved.

---

## ✨ Key Features

- **Real per-plant sensors:** soil moisture (required) and pH (optional, PH4502C probe) - an ESP8266 hub publishes readings via `POST /api/readings`.
- **Shared garden climate:** temperature and air humidity (DHT11) measured once per hub cycle, not per plant.
- **Optional analog multiplexer:** the firmware supports monitoring several plants with a single ESP8266 (CD74HC4051), with a simple single-sensor fallback mode for anyone who hasn't wired the multiplexer yet.
- **Single admin:** login authenticated via environment variables (username + SHA-256 password hash), no user table in the database.
- **Non-persistent public demo:** the same interface as the admin, example data, any change is local to the browser only - with a fixed on-screen warning.
- **EXAMPLE/REAL badge:** every plant shows whether it's a demo plant or part of the real garden.
- **Real regional weather:** the public landing page fetches current weather via Open-Meteo (no API key), based on the configured latitude/longitude.
- **Dashboard with alerts:** compares each plant against its ideal moisture, pH and temperature ranges, and flags whichever one is out of range.
- **Activity history:** manual and irrigation records, with author and related plant.

---

## 🧭 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Ground Rules](#-project-ground-rules)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Usage](#-usage)
- [Main Endpoints](#-main-endpoints)
- [Access: admin and demo](#-access-admin-and-demo)
- [Hardware and Firmware](#-hardware-and-firmware)
- [Author](#-author)
- [License](#-license)

---

## 🏗️ Architecture

```text
garden-monitor-web/
|-- src/
|   |-- app/
|   |   |-- page.tsx                # public landing page (garden name + real weather)
|   |   |-- admin/                  # authenticated area (login at /admin, pages under (shell))
|   |   |-- demo/                   # public demo, no session
|   |   `-- api/                    # route handlers (REST API)
|   |-- modules/                    # domain logic: auth, plants, records, dashboard, settings, about, support
|   |   `-- <module>/
|   |       |-- components/           # UI (client components)
|   |       |-- server/               # data access (SQL) - server-only
|   |       `-- types/
|   `-- shared/
|       |-- components/layout/        # AppShell, SidebarNav, Topbar, BrandMark
|       |-- demo/                     # DemoProvider (demo state, in-memory only)
|       `-- lib/                      # db.ts, session.ts, weather.ts, plant-metrics.ts, formatters.ts
|-- db/
|   `-- schema.sql                  # Postgres schema (Neon)
|-- scripts/
|   |-- migrate.ts                  # applies db/schema.sql
|   |-- seed.ts                     # seeds garden_settings + example plants/records
|   `-- hash-admin-password.ts      # generates the ADMIN_PASSWORD_HASH value
`-- firmware/
    `-- esp8266_garden_monitor/     # Arduino firmware for the ESP8266 hub
```

- `src/app/admin`: routes protected by the middleware - real CRUD against the database.
- `src/app/demo`: public routes - the layout fetches the example plants once and hands them to `DemoProvider`, which becomes the data source on the client from then on.
- `src/modules/*/server`: every SQL query lives here - never imported by a Client Component.
- `src/shared/lib/plant-metrics.ts`: growth/status formulas shared between the server (admin) and `DemoProvider` (client), so both tracks compute the exact same thing.

---

## 🧰 Tech Stack

- **Next.js 15** (App Router, Route Handlers, Server Components) + TypeScript
- **Neon Postgres** via [`@neondatabase/serverless`](https://github.com/neondatabase/serverless) (HTTP driver, ideal for serverless)
- **Tailwind CSS v4**
- **jose** (admin session JWT) + **Node's crypto** (SHA-256 hash for the admin password)
- **zod** (API payload validation)
- **Open-Meteo** (real regional weather, no API key)
- **ESP8266** (Arduino/C++) for real sensor readings

Recommended deploy: **Vercel** (frontend + API routes) + **Neon** (database). No separate server is needed - Next.js API routes already cover the backend.

---

## 📐 Project Ground Rules

- Identifiers, routes, request/response contracts and file/folder names stay in **English**.
- Visible interface copy (labels, error/success messages, dashboard text) stays in **Portuguese**.
- Code comments stay in **Portuguese**, including a short header at the top of every file explaining its role - more generous than usual, since this project also serves as a portfolio piece.
- Firmware logs (`Serial.print*`) keep the `INFO`/`WARNING`/`ERROR` levels in English; the rest of the message stays in Portuguese.
- No credentials are committed: `.env.local` stays out of the repository, only `.env.example` is versioned.

---

## ⚙️ Requirements

- Node.js >= 20
- npm >= 10
- A [Neon](https://neon.tech) account (the free tier is enough)

---

## 🔧 Installation

```bash
git clone https://github.com/lucas-hochmann-rosa/garden-monitor-web.git
cd garden-monitor-web
npm install
cp .env.example .env.local
```

Edit `.env.local` with your Neon connection string and generate the remaining
secrets (see the next section). Then apply the schema and the seed:

```bash
npm run db:migrate   # creates the tables (db/schema.sql)
npm run db:seed      # creates the garden and example plants (garden_settings, plants, records)
```

---

## 🔐 Environment Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres connection string |
| `SESSION_SECRET` | yes | Secret (>= 32 characters) used to sign the admin's session cookie |
| `DEVICE_API_KEY` | yes | Key the ESP8266 firmware sends in the `X-Api-Key` header |
| `ADMIN_USERNAME` | yes | The single administrator's username |
| `ADMIN_PASSWORD_HASH` | yes | SHA-256 hash of the admin password - generate with `npm run admin:hash -- "your-password"` |
| `GARDEN_NAME` | no | Default name seeded into `garden_settings` (the admin can change it later, no redeploy needed) |
| `WEATHER_LATITUDE` / `WEATHER_LONGITUDE` | no | Garden coordinates, used as an estimate on the "Garden climate" card while no real sensor reading has arrived yet. Leave blank to keep the card empty until real data shows up |
| `HIDE_EXAMPLE_PLANTS` | no | `"true"` hides example plants from both the admin and the public demo (the rows stay in the database) |

---

## ▶️ Usage

```bash
npm run dev
```

Visit `http://localhost:3000`: the public landing page, `http://localhost:3000/demo/dashboard` for the demo, and `http://localhost:3000/admin` to log in as the administrator.

---

## 📡 Main Endpoints

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/api/auth/login` \| `/logout` | Admin login/logout |
| GET | `/api/auth/me` | Current admin session |
| GET / POST | `/api/plants` | List / create plants (admin) |
| PATCH / DELETE | `/api/plants/{id}` | Edit / delete a plant (admin) |
| GET / POST | `/api/records` | List / create activity records (admin) |
| POST | `/api/readings` | ESP8266 hub ingestion (authenticated via `X-Api-Key`), batched climate + plants payload |

---

## 🔑 Access: admin and demo

**Admin (`/admin`):** log in with `ADMIN_USERNAME`/password (compared against the `ADMIN_PASSWORD_HASH`). Once logged in, `/admin/dashboard`, `/admin/plants`, `/admin/records`, `/admin/about` and `/admin/support` operate against the real database.

**Demo (`/demo`):** public, no login. Shows only plants flagged as `EXAMPLE`. Every create/edit/delete stays in the browser's memory only (via `DemoProvider`) - a fixed banner at the top reminds visitors that nothing there is saved.

Every plant card carries an `EXAMPLE` or `REAL` badge, so even inside the admin (where both types can coexist) it's clear which data comes from a real sensor.

---

## 🔌 Hardware and Firmware

The dashboard shows real data as soon as the ESP8266 hub firmware starts publishing readings. Full hardware guide, wiring (with and without the CD74HC4051 multiplexer) and soil/pH sensor calibration in [`firmware/README.md`](./firmware/README.md).

Protocol summary:

```json
POST /api/readings
Header: X-Api-Key: <DEVICE_API_KEY>
{
  "climate": { "temperature": 24.1, "airHumidity": 58.7 },
  "plants": [{ "slot": "Slot 1", "soilMoisture": 62.4, "ph": 6.6 }]
}
```

---

## 🌳 Branch Flow

- `main`: stable version, published to production.
- `develop`: integration branch for new features.

---

## 👨‍💻 Author

**Lucas Hochmann Rosa**

- Repository: <https://github.com/lucas-hochmann-rosa/garden-monitor-web>
- GitHub: <https://github.com/lucas-hochmann-rosa>
- LinkedIn: <https://www.linkedin.com/in/lucas-hochmann-rosa>

---

## 📄 License

Licensed under the MIT License. Feel free to use, modify, and distribute, provided you retain the copyright notice and give credit to Lucas Hochmann Rosa. See [LICENSE](./LICENSE).
