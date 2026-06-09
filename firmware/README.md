# Firmware do ESP8266 - Garden Monitor Web

Sketch Arduino que roda em um único ESP8266, atuando como hub da horta: lê o
clima (DHT11, compartilhado por todas as plantas) e a umidade do solo/pH de
cada planta configurada, publicando tudo num único ciclo em
`POST /api/readings`.

## Hardware necessário

- Placa ESP8266 (NodeMCU, Wemos D1 Mini, etc.)
- Sensor DHT11 (temperatura e umidade do ar da horta)
- Um sensor capacitivo de umidade do solo por planta monitorada
- Opcional, por planta: sonda de pH + módulo PH4502C
- Multiplexador analógico CD74HC4051 - **obrigatório apenas se você for
  monitorar mais de uma planta com sensor real** (o ESP8266 só tem um pino
  analógico, A0; o multiplexador é o que permite alternar entre vários
  sensores nesse único pino)
- Jumpers e protoboard

## Ligações

### Sem multiplexador (setup atual: 1 planta com sensor real)

| Componente | Pino no ESP8266 |
|---|---|
| Sensor de umidade do solo (sinal) | A0 |
| DHT11 (dados) | D4 (GPIO2) |
| DHT11 (VCC) | 3V3 |
| DHT11 (GND) | GND |

### Com multiplexador CD74HC4051 (N plantas)

| Componente | Pino no ESP8266 |
|---|---|
| Saída comum do multiplexador (Z) | A0 |
| Seleção de canal S0 | D5 |
| Seleção de canal S1 | D6 |
| Seleção de canal S2 | D7 |
| DHT11 (dados) | D4 (GPIO2) |

Cada sensor de solo (e cada sonda de pH, quando houver) é ligado a um canal
diferente do multiplexador (C0-C7), e o código escolhe qual canal ler
alternando os pinos de seleção antes de cada `analogRead`.

## Bibliotecas (Arduino IDE)

Instale via *Sketch > Include Library > Manage Libraries*:

- **ArduinoJson** (Benoit Blanchon)
- **DHT sensor library** (Adafruit) + **Adafruit Unified Sensor**
- Pacote de placas **esp8266 by ESP8266 Community** (inclui `ESP8266WiFi`/`ESP8266HTTPClient`)

## Configuração

Abra `esp8266_garden_monitor.ino` e edite as constantes no topo do arquivo:

1. `WIFI_SSID` / `WIFI_PASSWORD` - credenciais da sua rede Wi-Fi.
2. `API_URL` - URL pública do deploy na Vercel, terminando em `/api/readings`.
3. `DEVICE_API_KEY` - **precisa ser idêntica** à variável de ambiente
   `DEVICE_API_KEY` configurada no backend (ver `.env.example` na raiz do projeto).
4. `USE_ANALOG_MULTIPLEXER` - `false` para o setup simples (1 sensor), `true`
   quando o CD74HC4051 estiver instalado.
5. `PLANT_SENSORS` - um item por planta monitorada, com o `slot` já cadastrado
   em `/admin/plants` e (só com o multiplexador) o canal do sensor de solo e,
   se houver, o canal da sonda de pH.

## Calibração do sensor de umidade

Os valores `SOIL_MOISTURE_DRY_VALUE` (sensor no ar/seco) e
`SOIL_MOISTURE_WET_VALUE` (sensor em água) variam entre sensores. Para
calibrar: grave o sketch com `Serial.println(analogRead(A0))` no `loop()`,
anote a leitura seca e a leitura molhada, e ajuste as duas constantes.

## Calibração do pH (PH4502C)

O código já suporta o módulo PH4502C, mas os valores padrão de
`PH_NEUTRAL_READING`/`PH_ACID_READING` são só estimativas de referência -
**este projeto ainda não tem o módulo físico montado**, então essas
constantes não foram validadas com hardware real. Para calibrar quando o
módulo chegar: submerja a sonda em uma solução tampão de pH 7.0, anote a
leitura bruta do ADC no canal correspondente do multiplexador, repita com uma
solução de pH 4.0, e ajuste as duas constantes com os valores encontrados.

## Protocolo enviado à API

```json
POST /api/readings
Headers: X-Api-Key: <DEVICE_API_KEY>
{
  "climate": { "temperature": 24.1, "airHumidity": 58.7 },
  "plants": [
    { "slot": "Slot 1", "soilMoisture": 62.4 },
    { "slot": "Slot 2", "soilMoisture": 55.1, "ph": 6.6 }
  ]
}
```

A API responde `201` com um resumo do que foi gravado
(`climateRecorded`, `plantsUpdated`, `unknownSlots`) - slots sem planta
cadastrada não derrubam o restante do ciclo, só aparecem em `unknownSlots`.
