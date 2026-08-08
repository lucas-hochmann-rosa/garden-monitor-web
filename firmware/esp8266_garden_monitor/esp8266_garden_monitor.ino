/*
 * Firmware do hub ESP8266 do Garden Monitor Web
 * --------------------------------------------------------------------------
 * Um único ESP8266 atua como "hub" da horta: lê o DHT11 (temperatura/umidade
 * do ar da horta inteira, uma vez por ciclo) e, para cada planta configurada
 * em PLANT_SENSORS, lê o sensor de umidade do solo e, opcionalmente, o pH
 * (PH4502C). Como o ESP8266 só tem um pino analógico (A0), monitorar mais de
 * uma planta com sensor real exige um multiplexador analógico CD74HC4051
 * (8 canais) alternando qual sensor está conectado ao A0 a cada leitura -
 * ver USE_ANALOG_MULTIPLEXER abaixo. Sem o multiplexador, o firmware ainda
 * funciona no modo simples (1 sensor de solo ligado direto no A0), que é o
 * setup físico atual.
 *
 * Além de publicar leituras, o hub também aciona a irrigação automática: cada
 * planta pode ter um relé próprio (irrigationRelayPin em PLANT_SENSORS), e a
 * cada ciclo a API devolve, na resposta do próprio POST de leituras, quais
 * plantas estão com irrigação vencida - ver processIrrigationCommands() e o
 * comentário de ingestReadingsBatch em src/modules/plants/server/plants.service.ts.
 *
 * Todas as leituras do ciclo (clima + cada planta) são enviadas num único
 * POST para a API, no formato:
 *   { "climate": { "temperature": 24.1, "airHumidity": 58.7 },
 *     "plants": [{ "slot": "Slot 1", "soilMoisture": 62.4, "ph": 6.6 }] }
 * E a resposta pode trazer:
 *   { "irrigationCommands": [{ "slot": "Slot 1", "milliliters": 250 }] }
 *
 * Bibliotecas necessárias (Arduino IDE > Sketch > Include Library > Manage Libraries):
 *   - ESP8266WiFi / ESP8266HTTPClient / WiFiClientSecure (inclusas no pacote esp8266 do Arduino)
 *   - ArduinoJson (por Benoit Blanchon)
 *   - DHT sensor library (por Adafruit) + Adafruit Unified Sensor
 *
 * Ligações (ver firmware/README.md para o diagrama completo e o guia de custo):
 *   - DHT11 (dados)                                 -> D4 (GPIO2)
 *   - Sem multiplexador: sensor de solo (analógico)  -> A0
 *   - Com multiplexador: saída do CD74HC4051         -> A0
 *                        pinos de seleção S0/S1/S2    -> D5/D6/D7
 *   - PH4502C (analógico, quando presente)            -> um canal do multiplexador
 *   - Módulo relé de cada planta irrigada              -> um pino digital livre (D1/D2/...)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ==================== CONFIGURAÇÃO - edite antes de gravar ====================

// Credenciais da rede Wi-Fi.
const char *WIFI_SSID = "NOME_DA_SUA_REDE";
const char *WIFI_PASSWORD = "SENHA_DA_SUA_REDE";

// URL da API (a mesma URL do deploy na Vercel), terminando em /api/readings.
const char *API_URL = "https://SEU-PROJETO.vercel.app/api/readings";

// Deve ser idêntica à variável de ambiente DEVICE_API_KEY configurada no backend.
const char *DEVICE_API_KEY = "troque-por-uma-chave-aleatoria-para-o-esp8266";

// Intervalo entre ciclos de leitura enviados para a API (5 minutos por padrão).
// Também é, na prática, a resolução da irrigação automática: o hub só percebe que
// uma planta está devendo água na próxima vez que publicar uma leitura dela.
const unsigned long READING_INTERVAL_MS = 5UL * 60UL * 1000UL;

// Pino de dados do DHT11 (clima da horta - compartilhado por todas as plantas).
const int DHT_PIN = D4;
DHT dhtSensor(DHT_PIN, DHT11);

// Mude para "true" quando o multiplexador CD74HC4051 estiver instalado. Com "false",
// PLANT_SENSORS abaixo deve ter uma única entrada (sensor de solo ligado direto no A0).
#define USE_ANALOG_MULTIPLEXER false

#if USE_ANALOG_MULTIPLEXER
const int MUX_SELECT_PIN_0 = D5;
const int MUX_SELECT_PIN_1 = D6;
const int MUX_SELECT_PIN_2 = D7;
const int MUX_SIGNAL_PIN = A0;
#else
const int SOIL_MOISTURE_PIN = A0;
#endif

// Calibração do sensor de umidade do solo (ajuste conforme o seu sensor: grave o
// sketch com Serial.println(analogRead(A0)) e anote a leitura seca/molhada).
const int SOIL_MOISTURE_DRY_VALUE = 1024; // leitura do sensor completamente seco
const int SOIL_MOISTURE_WET_VALUE = 300;  // leitura do sensor completamente molhado

// Calibração do PH4502C: leitura bruta do ADC (0-1023) submergindo a sonda em
// soluções tampão de pH 7.0 e pH 4.0. Valores abaixo são só estimativas de
// referência - recalibre com o módulo físico antes de confiar na leitura.
const float PH_NEUTRAL_READING = 512.0; // leitura em pH 7.0
const float PH_ACID_READING = 660.0;    // leitura em pH 4.0

// ---- Irrigação automática (relé + mini-bomba submersível, ver firmware/README.md) ----

// A maioria dos módulos-relé de 1 canal baratos é "ativa em LOW" (o pino em LOW liga
// o relé). Se o seu módulo for o contrário, inverta estas duas constantes.
const int RELAY_ON = LOW;
const int RELAY_OFF = HIGH;

// Vazão da bomba em ml/segundo - calibre cronometrando 10s de bomba ligada
// despejando água num recipiente medidor e dividindo o volume coletado por 10.
const float PUMP_FLOW_RATE_ML_PER_SEC = 8.0; // estimativa - recalibre com a bomba real

// Trava de segurança: nunca deixa um comando (ou uma conta errada) manter a bomba
// ligada além disso, mesmo que a vazão calibrada esteja muito errada.
const unsigned long MAX_IRRIGATION_DURATION_MS = 60UL * 1000UL;

// Pinos de relé livres mesmo com o multiplexador de sensores ligado (D5/D6/D7 ficam
// ocupados pelo mux nesse caso) - use quantos precisar em PLANT_SENSORS abaixo.
const int IRRIGATION_RELAY_PIN_1 = D1;
const int IRRIGATION_RELAY_PIN_2 = D2;

// Um item por planta monitorada por este hub. "soilMoistureChannel"/"phChannel" só
// importam quando USE_ANALOG_MULTIPLEXER é true (canal 0-7 do CD74HC4051).
// "irrigationRelayPin" é -1 quando a planta não tem irrigação automática nesse hub.
struct PlantSensorConfig {
  const char *slot; // precisa bater com o slot cadastrado em /admin/plants
  int soilMoistureChannel;
  bool hasPhSensor;
  int phChannel;
  int irrigationRelayPin;
};

#if USE_ANALOG_MULTIPLEXER
PlantSensorConfig PLANT_SENSORS[] = {
  {"Slot 1", 0, false, -1, IRRIGATION_RELAY_PIN_1},
  {"Slot 2", 1, true, 2, IRRIGATION_RELAY_PIN_2}, // exemplo com sonda de pH no canal 2 do mux
};
#else
PlantSensorConfig PLANT_SENSORS[] = {
  {"Slot 1", -1, false, -1, IRRIGATION_RELAY_PIN_1}, // único sensor de solo, ligado direto no A0
};
#endif

const int PLANT_SENSOR_COUNT = sizeof(PLANT_SENSORS) / sizeof(PLANT_SENSORS[0]);

// ================================================================================

#if USE_ANALOG_MULTIPLEXER
// Seleciona o canal do multiplexador (0-7) e lê o valor bruto do ADC no A0.
int readMultiplexerChannel(int channel) {
  digitalWrite(MUX_SELECT_PIN_0, channel & 0x01);
  digitalWrite(MUX_SELECT_PIN_1, (channel >> 1) & 0x01);
  digitalWrite(MUX_SELECT_PIN_2, (channel >> 2) & 0x01);
  delay(5); // tempo de acomodação do multiplexador antes da leitura
  return analogRead(MUX_SIGNAL_PIN);
}
#endif

// Lê o valor bruto de umidade do solo de uma planta, via multiplexador ou direto no A0.
int readSoilMoistureRaw(const PlantSensorConfig &sensorConfig) {
#if USE_ANALOG_MULTIPLEXER
  return readMultiplexerChannel(sensorConfig.soilMoistureChannel);
#else
  (void)sensorConfig;
  return analogRead(SOIL_MOISTURE_PIN);
#endif
}

// Converte a leitura analógica bruta em um percentual de umidade do solo (0-100%).
float soilMoistureRawToPercent(int rawValue) {
  float percent = map(rawValue, SOIL_MOISTURE_DRY_VALUE, SOIL_MOISTURE_WET_VALUE, 0, 100);
  return constrain(percent, 0, 100);
}

// Converte a leitura bruta do PH4502C em pH, por interpolação linear entre os dois
// pontos de calibração (pH 7.0 e pH 4.0 - ver PH_NEUTRAL_READING/PH_ACID_READING).
float phRawToValue(int rawValue) {
  float slopePerReading = (7.0 - 4.0) / (PH_NEUTRAL_READING - PH_ACID_READING);
  return 7.0 + (rawValue - PH_NEUTRAL_READING) * slopePerReading;
}

// Aciona o relé da planta "slot" pelo tempo necessário pra liberar "milliliters" de
// água, calculado a partir de PUMP_FLOW_RATE_ML_PER_SEC. Chamada bloqueante (igual o
// resto do sketch) - por isso é sempre a última coisa feita no ciclo, depois de já
// ter enviado as leituras.
void triggerIrrigation(const char *slot, float milliliters) {
  for (int i = 0; i < PLANT_SENSOR_COUNT; i++) {
    if (strcmp(PLANT_SENSORS[i].slot, slot) != 0) continue;

    int relayPin = PLANT_SENSORS[i].irrigationRelayPin;
    if (relayPin < 0) {
      Serial.printf("WARNING: comando de irrigacao para \"%s\" ignorado - nenhum rele configurado nesse slot.\n", slot);
      return;
    }

    unsigned long durationMs = (unsigned long)((milliliters / PUMP_FLOW_RATE_ML_PER_SEC) * 1000.0);
    durationMs = min(durationMs, MAX_IRRIGATION_DURATION_MS);

    Serial.printf("INFO: irrigando \"%s\" por %lums (~%.0fml)\n", slot, durationMs, milliliters);
    digitalWrite(relayPin, RELAY_ON);
    delay(durationMs);
    digitalWrite(relayPin, RELAY_OFF);
    return;
  }

  Serial.printf("WARNING: comando de irrigacao para \"%s\" ignorado - slot nao configurado neste hub.\n", slot);
}

// Lê "irrigationCommands" da resposta de /api/readings e aciona o relé de cada
// planta pendente, uma de cada vez (ver triggerIrrigation). Se a resposta não vier
// no formato esperado, só ignora - o próximo ciclo tenta de novo.
void processIrrigationCommands(const String &responseBody) {
  JsonDocument response;
  DeserializationError parseError = deserializeJson(response, responseBody);
  if (parseError) {
    Serial.printf("WARNING: nao foi possivel interpretar a resposta da API (%s) - nenhuma irrigacao neste ciclo.\n", parseError.c_str());
    return;
  }

  JsonArray commands = response["irrigationCommands"].as<JsonArray>();
  for (JsonObject command : commands) {
    const char *slot = command["slot"];
    float milliliters = command["milliliters"];
    triggerIrrigation(slot, milliliters);
  }
}

// Conecta-se à rede Wi-Fi configurada, aguardando até obter um endereço IP.
void connectToWifi() {
  Serial.printf("INFO: conectando a wi-fi \"%s\"...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\nINFO: wi-fi conectado. IP: %s\n", WiFi.localIP().toString().c_str());
}

// Monta o payload JSON do ciclo (clima + leitura de cada planta), envia para a API e,
// com a resposta, aciona a irrigação automática das plantas que estiverem devendo.
void sendReadingsBatch(float temperature, float airHumidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WARNING: wi-fi desconectado, tentando reconectar antes de enviar.");
    connectToWifi();
  }

  JsonDocument payload;

  if (!isnan(temperature)) payload["climate"]["temperature"] = temperature;
  if (!isnan(airHumidity)) payload["climate"]["airHumidity"] = airHumidity;

  JsonArray plantsJson = payload["plants"].to<JsonArray>();
  for (int i = 0; i < PLANT_SENSOR_COUNT; i++) {
    PlantSensorConfig sensorConfig = PLANT_SENSORS[i];

    int soilRaw = readSoilMoistureRaw(sensorConfig);
    JsonObject plantReading = plantsJson.add<JsonObject>();
    plantReading["slot"] = sensorConfig.slot;
    plantReading["soilMoisture"] = soilMoistureRawToPercent(soilRaw);

#if USE_ANALOG_MULTIPLEXER
    if (sensorConfig.hasPhSensor) {
      int phRaw = readMultiplexerChannel(sensorConfig.phChannel);
      plantReading["ph"] = phRawToValue(phRaw);
    }
#endif
  }

  String payloadJson;
  serializeJson(payload, payloadJson);

  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // simplifica o TLS para o ESP8266; para produção, prefira validar o certificado.

  HTTPClient http;
  http.begin(secureClient, API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Api-Key", DEVICE_API_KEY);

  Serial.printf("INFO: enviando leituras do ciclo: %s\n", payloadJson.c_str());
  int statusCode = http.POST(payloadJson);

  if (statusCode > 0) {
    String responseBody = http.getString();
    Serial.printf("INFO: resposta da API: %d - %s\n", statusCode, responseBody.c_str());
    processIrrigationCommands(responseBody);
  } else {
    Serial.printf("ERROR: falha ao enviar leituras: %s\n", http.errorToString(statusCode).c_str());
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  dhtSensor.begin();

#if USE_ANALOG_MULTIPLEXER
  pinMode(MUX_SELECT_PIN_0, OUTPUT);
  pinMode(MUX_SELECT_PIN_1, OUTPUT);
  pinMode(MUX_SELECT_PIN_2, OUTPUT);
#endif

  for (int i = 0; i < PLANT_SENSOR_COUNT; i++) {
    if (PLANT_SENSORS[i].irrigationRelayPin < 0) continue;
    pinMode(PLANT_SENSORS[i].irrigationRelayPin, OUTPUT);
    digitalWrite(PLANT_SENSORS[i].irrigationRelayPin, RELAY_OFF); // começa desligado
  }

  connectToWifi();
}

void loop() {
  float airHumidity = dhtSensor.readHumidity();
  float temperature = dhtSensor.readTemperature();

  if (isnan(airHumidity) || isnan(temperature)) {
    Serial.println("WARNING: falha ao ler o sensor DHT11 - o clima da horta não será enviado neste ciclo.");
  }

  sendReadingsBatch(temperature, airHumidity);

  delay(READING_INTERVAL_MS);
}
