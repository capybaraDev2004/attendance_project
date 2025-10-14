#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>

/* ====== Wi-Fi + Backend ====== */
const char* WIFI_SSID   = "165";            // SSID cùng mạng 192.168.1.x với máy 192.168.1.24
const char* WIFI_PASS   = "14112004";
const char* SERVER_HOST = "192.168.1.24";   // IP backend (máy chạy Node)
const int   SERVER_PORT = 3001;
const int   DEVICE_ID   = 2;

// IP tĩnh cho ESP (Cách 1)
IPAddress STATIC_IP(192, 168, 1, 29);
IPAddress GATEWAY  (192, 168, 1, 1);
IPAddress SUBNET   (255, 255, 255, 0);
IPAddress DNS_IP   (8, 8, 8, 8);

/* ====== Hardware pins ====== */
#define RC522_SS   D2
#define RC522_RST  D1
#define I2C_SDA    D3
#define I2C_SCL    D4
#define BUZZER_PIN D8

MFRC522 rfid(RC522_SS, RC522_RST);
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ====== Helpers ====== */
String uidHexNoSpace(const MFRC522::Uid &u) {
  String s; 
  for (byte i=0;i<u.size;i++){ 
    if(u.uidByte[i]<0x10)s+='0'; 
    s+=String(u.uidByte[i],HEX); 
  }
  s.toUpperCase(); 
  return s;
}

String jsonEscape(const String& s) {
  String o; o.reserve(s.length()+8);
  for (size_t i=0;i<s.length();i++){ 
    char c=s[i];
    if(c=='\"')o+="\\\""; 
    else if(c=='\\')o+="\\\\"; 
    else if(c=='\n')o+="\\n"; 
    else if(c=='\r')o+="\\r";
    else if(c=='\t')o+="\\t"; 
    else o+=c;
  } 
  return o;
}

void show(const String& l1,const String& l2="",int ms=0){
  lcd.clear(); 
  lcd.setCursor(0,0); lcd.print(l1);
  lcd.setCursor(0,1); lcd.print(l2); 
  if(ms>0) delay(ms);
}

/* ====== Buzzer ====== */
void beep(unsigned onMs=120,unsigned offMs=60){ 
  digitalWrite(BUZZER_PIN,HIGH); 
  delay(onMs); 
  digitalWrite(BUZZER_PIN,LOW); 
  delay(offMs); 
}
void buzzerSuccessOnce(){ beep(120,0); }
void buzzerErrorTwice(){ beep(100,60); beep(100,0); }

/* ====== Wi-Fi ====== */
void wifiConnect(){
  if(WiFi.status()==WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);

  // CẤU HÌNH IP TĨNH (phải gọi trước WiFi.begin)
  if (!WiFi.config(STATIC_IP, GATEWAY, SUBNET, DNS_IP)) {
    Serial.println("[WiFi] WiFi.config FAILED (static IP)");
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  show("Dang ket noi","WiFi...");

  uint8_t tries=0;
  while(WiFi.status()!=WL_CONNECTED && tries<40){ // ~20s
    delay(500);
    tries++;
  }

  if(WiFi.status()==WL_CONNECTED){
    Serial.print("[WiFi] Connected: "); Serial.println(WiFi.localIP());
    show("WiFi OK", WiFi.localIP().toString(), 800);
  } else {
    Serial.println("[WiFi] Connect FAIL");
    show("WiFi FAIL","Thu offline", 1000);
  }
}

/* ====== HTTP helpers ====== */
bool httpPostJson(const String& path, const String& body, int& codeOut, String& respOut){
  if(WiFi.status()!=WL_CONNECTED) wifiConnect();
  if(WiFi.status()!=WL_CONNECTED){ codeOut=-5; respOut=""; return false; }
  WiFiClient client; HTTPClient http; 
  http.setTimeout(5000); 
  http.setReuse(false);
  if(!http.begin(client, SERVER_HOST, SERVER_PORT, path, false)){
    Serial.println("[HTTP] begin() FAIL " + path); 
    codeOut=-1; 
    respOut=""; 
    return false;
  }
  http.addHeader("Content-Type","application/json");
  Serial.println("[HTTP] POST " + path + " body=" + body);
  codeOut = http.POST(body); 
  respOut = http.getString(); 
  http.end();
  Serial.printf("[HTTP] code=%d\n", codeOut); 
  Serial.println("[HTTP] resp=" + respOut);
  return (codeOut>0);
}

/* ====== Attendance ====== */
String postScanAttendance(const String& uid){
  int code; String resp;
  String body = "{\"uid\":\""+uid+"\",\"device_id\":"+String(DEVICE_ID)+"}";
  if(!httpPostJson("/api/attendance/scan-rfid", body, code, resp)){
    show("Gui FAIL","No WiFi/HTTP",1000); 
    buzzerErrorTwice(); 
    return "";
  }
  if(code==200){
    if(resp.indexOf("\"action\":\"Check-in\"")>=0) return "Check-in";
    if(resp.indexOf("\"action\":\"Check-out\"")>=0) return "Check-out";
    return "ok";
  }
  show("Gui FAIL","Code:"+String(code),1000); 
  buzzerErrorTwice(); 
  return "";
}

/* ====== Utils ====== */
void waitCardRemoved(){
  rfid.PICC_HaltA(); 
  rfid.PCD_StopCrypto1();
  unsigned long t0=millis();
  while(millis()-t0<2000){ 
    if(!rfid.PICC_IsNewCardPresent() && !rfid.PICC_ReadCardSerial()) break; 
    delay(50); 
  }
}

/* ====== Setup / Loop ====== */
void setup(){
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT); 
  digitalWrite(BUZZER_PIN, LOW);
  Wire.begin(I2C_SDA, I2C_SCL); 
  lcd.init(); 
  lcd.backlight(); 
  show("Booting...");
  wifiConnect();

  SPI.begin(); 
  SPI.setFrequency(1000000); 
  rfid.PCD_Init();

  show("RFID Ready","Moi quet...");
  Serial.println("[READY] Waiting...");
  Serial.print("[INFO] My IP: "); Serial.println(WiFi.localIP());
}

void loop(){
  if(!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;
  
  String uid = uidHexNoSpace(rfid.uid); 
  Serial.println("UID: "+uid);
  
  String action = postScanAttendance(uid);
  if(action=="Check-in"){ 
    buzzerSuccessOnce(); 
    show("Check-in OK", uid, 1000); 
  }
  else if(action=="Check-out"){ 
    buzzerSuccessOnce(); 
    show("Check-out OK", uid, 1000); 
  }
  else if(action=="ok"){ 
    buzzerSuccessOnce(); 
    show("Server OK", uid, 1000); 
  }
  
  waitCardRemoved();
  show("Moi quet tiep...","",0);
}

