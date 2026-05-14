# 🏠 IoT Smart Home Backend

Backend cho hệ thống nhà thông minh với MQTT + Adafruit IO

## 📋 Stack Công Nghệ
- **Node.js** + **Express** - Web Framework
- **MQTT** - Giao tiếp với thiết bị IoT
- **Adafruit IO** - Cloud platform lưu trữ dữ liệu
- **Axios** - HTTP client

## 📁 Cấu trúc Folder

```
iot-backend/
├── src/
│   ├── config/           # Cấu hình
│   │   ├── mqtt.js      # MQTT config
│   │   └── adafruit.js  # Adafruit IO config
│   ├── services/         # Business logic
│   │   ├── mqttService.js       # MQTT client
│   │   └── adafruitService.js   # Adafruit API
│   ├── controllers/      # Request handlers
│   │   └── deviceController.js
│   ├── routes/           # API routes
│   │   └── deviceRoutes.js
│   └── server.js         # Entry point
├── .env                  # Biến môi trường
├── package.json
└── README.md
```

## 🚀 Cài Đặt & Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình .env
```
MQTT_BROKER_URL=mqtt://localhost:1883
ADAFRUIT_IO_KEY=your_key
ADAFRUIT_IO_USERNAME=your_username
PORT=3000
```

### 3. Chạy server
```bash
npm start          # Production
npm run dev        # Development (watch mode)
```

## 📡 API Endpoints

### Lấy dữ liệu cảm biến
```bash
GET /api/devices/sensors
```
Response:
```json
{
  "status": "success",
  "data": {
    "temperature": 28.5,
    "humidity": 65,
    "light": 800
  }
}
```

### Điều khiển quạt
```bash
POST /api/devices/fan
```
Body:
```json
{ "state": "on" }     // hoặc "off" hoặc 0-100 (PWM)
```

### Điều khiển LED RGB
```bash
POST /api/devices/led
```
Body:
```json
{ "color": "#FF0000" }  // hoặc "#00FF00", "#0000FF"
```

### Hiển thị LCD
```bash
POST /api/devices/lcd
```
Body:
```json
{ "text": "Hello IoT!" }
```

### Kiểm tra trạng thái
```bash
GET /api/devices/status
```

## 🔌 MQTT Topics

| Topic | Mô tả | Type |
|-------|-------|------|
| `smartHome/sensors/temperature` | Nhiệt độ (°C) | Input |
| `smartHome/sensors/humidity` | Độ ẩm (%) | Input |
| `smartHome/sensors/light` | Cảm biến ánh sáng (lux) | Input |
| `smartHome/devices/fan` | Điều khiển quạt | Output |
| `smartHome/devices/led` | Điều khiển LED | Output |
| `smartHome/devices/lcd` | Điều khiển LCD | Output |

## 🔑 Adafruit IO Setup

1. Tạo tài khoản: https://io.adafruit.com
2. Tạo Feeds cho mỗi device:
   - `temperature`
   - `humidity`
   - `light`
   - `fan`
   - `led`
   - `lcd`
3. Lấy API Key từ trang Account
4. Thêm vào `.env`:
   ```
   ADAFRUIT_IO_KEY=your_key
   ADAFRUIT_IO_USERNAME=your_username
   ```

## 📱 Luồng Dữ Liệu

```
Sensors (Arduino/ESP32)
    ↓ MQTT Publish
MQTT Broker
    ↓ Backend Subscribe
Backend (Node.js)
    ↓ Process & Send
Adafruit IO Cloud
    │
    ├→ Mobile App
    ├→ Web Dashboard
    └→ API Access
```

## 🛠️ Troubleshooting

- **MQTT không kết nối?** → Kiểm tra broker URL và credentials
- **Adafruit API error?** → Kiểm tra API Key và Feed names
- **Port đã bị dùng?** → Thay PORT trong `.env`

## 📝 Ghi chú

- Thay `your_*` trong `.env` bằng thông tin thực tế
- MQTT topics có thể tùy chỉnh trong config
- Hỗ trợ local MQTT broker (Mosquitto) hoặc Adafruit MQTT
