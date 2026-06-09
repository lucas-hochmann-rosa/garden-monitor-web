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
 * Todas as leituras do ciclo (clima + cada planta) são enviadas num único
 * POST para a API, no formato:
 *   { "climate": { "temperature": 24.1, "airHumidity": 58.7 },
 *     "plants": [{ "slot": "Slot 1", "soilMoisture": 62.4, "ph": 6.6 }] }
 *
 * Bibliotecas necessárias (Arduino IDE > Sketch > Include Library > Manage Libraries):
 *   - ESP8266WiFi / ESP8266HTTPClient / WiFiClientSecure (inclusas no pacote esp8266 do Arduino)
 *   - ArduinoJson (por Benoit Blanchon)
 *   - DHT sensor library (por Adafruit) + Adafruit Unified Sensor
 *
 * Ligações (ver firmware/README.md para o diagrama completo):
 *   - DHT11 (dados)                                 -> D4 (GPIO2)
 *   - Sem multiplexador: sensor de solo (analógico)  -> A0
 *   - Com multiplexador: saída do CD74HC4051         -> A0
 *                        pinos de seleção S0/S1/S2    -> D5/D6/D7
 *   - PH4502C (analógico, quando presente)            -> um canal do multiplexador
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

// Um item por planta monitorada por este hub. "soilMoistureChannel"/"phChannel" só
// importam quando USE_ANALOG_MULTIPLEXER é true (canal 0-7 do CD74HC4051).
struct PlantSensorConfig {
  const char *slot; // precisa bater com o slot cadastrado em /admin/plants
  int soilMoistureChannel;
  bool hasPhSensor;
  int phChannel;
};

#if USE_ANALOG_MULTIPLEXER
PlantSensorConfig PLANT_SENSORS[] = {
  {"Slot 1", 0, false, -1},
  {"Slot 2", 1, true, 2}, // exemplo de planta com sonda de pH no canal 2 do mux
};
#else
PlantSensorConfig PLANT_SENSORS[] = {
  {"Slot 1", -1, false, -1}, // único sensor de solo, ligado direto no A0
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

// Monta o payload JSON do ciclo (clima + leitura de cada planta) e envia para a API.
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
    Serial.printf("INFO: resposta da API: %d - %s\n", statusCode, http.getString().c_str());
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
