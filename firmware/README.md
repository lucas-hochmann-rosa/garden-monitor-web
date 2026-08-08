# Firmware do ESP8266 - Garden Monitor Web

Sketch Arduino que roda em um único ESP8266, atuando como hub da horta: lê o
clima (DHT11, compartilhado por todas as plantas), a umidade do solo/pH de
cada planta configurada, publica tudo num único ciclo em `POST /api/readings`
e aciona a irrigação automática das plantas que estiverem devendo água.

## Hardware necessário

- Placa ESP8266 (NodeMCU, Wemos D1 Mini, etc.)
- Sensor DHT11 (temperatura e umidade do ar da horta)
- Um sensor capacitivo de umidade do solo por planta monitorada
- Opcional, por planta: sonda de pH + módulo PH4502C
- Multiplexador analógico CD74HC4051 - **obrigatório apenas se você for
  monitorar mais de uma planta com sensor real** (o ESP8266 só tem um pino
  analógico, A0; o multiplexador é o que permite alternar entre vários
  sensores nesse único pino)
- Opcional, por planta com irrigação automática: módulo relé 1 canal (5V) +
  mini-bomba submersível (3-6V) num reservatório de água - ver seção
  [Irrigação automática](#irrigação-automática) para custos e ligação
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
   em `/admin/plants`, (só com o multiplexador) o canal do sensor de solo e o
   canal da sonda de pH quando houver, e o pino do relé de irrigação quando a
   planta tiver um (`-1` se não tiver).

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

## Irrigação automática

Pensada pra ser barata de montar por planta e reaproveitar o que o hub já faz
- não existe um endpoint novo nem uma segunda conexão: a cada ciclo, a própria
resposta de `POST /api/readings` já diz quais plantas estão devendo água (ver
[Protocolo](#protocolo-enviado-à-api)), e o firmware aciona o relé
correspondente antes de dormir até o próximo ciclo.

### Hardware por planta irrigada (estimativa de custo)

| Item | Preço de referência |
|---|---|
| Módulo relé 1 canal (5V) | ~R$6-8 |
| Mini-bomba submersível (3-6V) | ~R$12-15 |
| Mangueira/tubo de silicone + reservatório | ~R$10 |
| **Total por planta** | **~R$30-35** |

Mais barato e mais simples de canalizar do que uma bomba única + uma válvula
solenoide por planta (~R$25-40 só a válvula) - a desvantagem é precisar de uma
mini-bomba por planta em vez de compartilhar uma bomba maior, mas pra uma
horta pequena/média o custo total ainda sai menor e a instalação (sem
manifold, sem pressurizar linha nenhuma) é bem mais simples.

**Nunca ligue a bomba direto num pino do ESP8266** - o pino só aciona o relé
(baixa corrente), e o relé é quem chaveia a alimentação externa da bomba
(bateria ou fonte própria). Isso isola a lógica do ESP8266 da carga da bomba e
evita que o pico de corrente da bomba derrube o Wi-Fi ou reinicie a placa.

### Ligação (por planta irrigada)

| Componente | Pino no ESP8266 |
|---|---|
| Sinal (IN) do módulo relé | Um pino digital livre (`D1`, `D2`, ... - ver `IRRIGATION_RELAY_PIN_*`) |
| VCC/GND do módulo relé | 5V/GND do ESP8266 (o relé em si consome pouco) |
| COM/NO do relé | Em série com a alimentação **externa** da bomba |

Com o multiplexador de sensores ligado, `D5`/`D6`/`D7` já estão ocupados -
sobram `D0`/`D1`/`D2`/`D3`/`D8` para relés (até ~5 plantas com irrigação
independente num único hub). Sem multiplexador, `D5`/`D6`/`D7` também ficam
livres.

### Calibração da vazão

`PUMP_FLOW_RATE_ML_PER_SEC` converte "quantos ml irrigar" (cadastrado em
`/admin/plants`) em "quanto tempo manter o relé ligado". Pra calibrar: ligue a
bomba por 10 segundos despejando água num recipiente medidor, anote o volume
coletado e divida por 10. `MAX_IRRIGATION_DURATION_MS` é uma trava de
segurança fixa (60s por padrão) que limita qualquer comando, mesmo que a
calibração ou o valor cadastrado estejam errados.

### Limitação: "dispara e esquece"

Sem um sensor de fluxo em cada linha, o hub não tem como confirmar que a água
realmente saiu - ele só sabe que **mandou o comando**. O registro
`auto-irrigation` que aparece no histórico de atividades representa isso: o
comando foi emitido, não necessariamente que a planta foi molhada de verdade
(reservatório vazio, mangueira entupida ou relé com mau contato não geram
nenhum aviso). Pra esse nível de confiança seria preciso um sensor de fluxo
(mais um item de hardware, fora do escopo custo-benefício deste primeiro
setup) - fica registrado como uma extensão possível.

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

A API responde `201` com um resumo do que foi gravado e o que precisa ser
irrigado agora:

```json
{
  "ok": true,
  "climateRecorded": true,
  "plantsUpdated": ["<uuid>"],
  "unknownSlots": [],
  "irrigationCommands": [{ "slot": "Slot 1", "milliliters": 250 }]
}
```

Slots sem planta cadastrada não derrubam o restante do ciclo, só aparecem em
`unknownSlots`. `irrigationCommands` só traz plantas com irrigação automática
ativada em `/admin/plants` **e** cujo intervalo configurado já venceu - o
firmware aciona o relé de cada uma (ver
[Irrigação automática](#irrigação-automática)).
