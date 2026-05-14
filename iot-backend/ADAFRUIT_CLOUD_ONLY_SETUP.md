# 🌐 Adafruit IO Cloud Only - Backend Setup

**Simplify IoT Setup**: No local MQTT broker needed. All data goes through **Adafruit IO Cloud**.

---

## 📋 Architecture

```
IoT Devices (Microbit/etc)
    ↓
Backend (REST API)
    ↓
Adafruit Cloud (REST API)
    ↓
SQL Server (Cache)
    ↓
Frontend Dashboard
```

---

## ✅ What Changed?

### ❌ REMOVED:
- ~~Local MQTT Broker (localhost:1883)~~
- ~~MQTTService for local message broker~~
- ~~MQTT topics configuration~~
- ~~Mosquitto dependency~~

### ✅ KEPT:
- **Adafruit IO Cloud** (Primary data transport)
- **SQL Server** (Local cache)
- **Express Backend** (REST API endpoints)
- **WebSocket** events for real-time updates

---

## 🚀 Quick Start

### 1️⃣ Create Adafruit Feeds

Go to: https://io.adafruit.com/

Login with: `w7thm` / password

Create **7 feeds** with EXACT names:
```
1. smartHome.temperature
2. smartHome.humidity
3. smartHome.brightness
4. smartHome.fan
5. smartHome.mode
6. smartHome.rgb
7. smartHome.lcd
```

**Or run Python script to auto-create:**

```bash
pip install requests
python create_feeds.py
```

**create_feeds.py:**
```python
import requests

USERNAME = "w7thm"
KEY = "aio_RsOh51gGEAZtkkgzdTwN5PjRENnb"

feeds = [
    "smartHome.temperature",
    "smartHome.humidity",
    "smartHome.brightness",
    "smartHome.fan",
    "smartHome.mode",
    "smartHome.rgb",
    "smartHome.lcd"
]

headers = {"X-AIO-Key": KEY}

for feed_name in feeds:
    url = f"https://io.adafruit.com/api/v2/{USERNAME}/feeds"
    data = {"name": feed_name}
    
    try:
        r = requests.post(url, json=data, headers=headers)
        if r.status_code == 201:
            print(f"✅ Created: {feed_name}")
        elif r.status_code == 400:
            print(f"⚠️ {feed_name} exists")
        else:
            print(f"❌ {feed_name}: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
```

### 2️⃣ Start Backend

```bash
cd iot-backend
npm install
npm run dev
```

**Expected output:**
```
🏠 IoT Smart Home Backend
✅ Kết nối SQL Server thành công!
✅ Adafruit IO Cloud: Connected
Server running on port 3000
```

### 3️⃣ Test Connection

```bash
curl http://localhost:3000/api/health

# Response:
{
  "status": "ok",
  "service": "IoT Backend (Adafruit Cloud Only)",
  "database": "connected",
  "adafruit_cloud": "connected",
  "timestamp": "2026-05-11T..."
}
```

---

## 📡 API Endpoints

### **Read Sensor Data**
```bash
GET /api/devices/sensors
# Response:
{
  "status": "success",
  "source": "adafruit",
  "data": {
    "temperature": 27.5,
    "humidity": 65,
    "brightness": 80,
    "updatedAt": "2026-05-11T..."
  }
}
```

### **Send Control Commands**

```bash
# Control Fan (0-100)
POST /api/devices/fan
Body: { "value": 75 }

# Control Mode (0 or 1)
POST /api/devices/mode
Body: { "value": 1 }

# Control RGB Light (0, 1, or 2)
POST /api/devices/rgb
Body: { "value": 2 }

# Display on LCD
POST /api/devices/lcd
Body: { "text": "Hello World" }

# Response (all):
{
  "status": "success",
  "transport": "adafruit-cloud",
  "value": 75,
  "timestamp": "2026-05-11T..."
}
```

### **Get All Feeds**
```bash
GET /api/devices/feeds
# Returns all current sensor values from Adafruit
```

### **Get Device Status**
```bash
GET /api/devices/status
# Current device state (fan, mode, rgb, lcd)
```

### **Get Sensor History**
```bash
GET /api/devices/history/smartHome.temperature?hours=24
# Get last 24 hours of temperature data
```

---

## 🔧 Configuration

### **.env File**

```env
# ========== ADAFRUIT IO CLOUD ONLY ==========
ADAFRUIT_IO_KEY=aio_RsOh51gGEAZtkkgzdTwN5PjRENnb
ADAFRUIT_IO_USERNAME=w7thm
ADAFRUIT_API_URL=https://io.adafruit.com/api/v2

# Server
PORT=3000
NODE_ENV=development

# Database (for cache)
DB_SERVER=GIGARBAGE
DB_INSTANCE=SQLEXPRESS
DB_DATABASE=DADN
DB_USER=thaulemon
DB_PASSWORD=Yang@0487
```

---

## 📊 Workflow

### **Sending Data to Cloud**

```
Device (Microbit) sends data
    ↓
Express API receives `/api/devices/fan` (POST)
    ↓
Backend processes & validates
    ↓
REST API → Adafruit Cloud (HTTP POST)
    ↓
✅ Data stored in Adafruit feeds
```

### **Reading Data from Cloud**

```
Frontend requests `/api/devices/sensors` (GET)
    ↓
Backend queries Adafruit Cloud (HTTP GET)
    ↓
Adafruit returns latest values
    ↓
Backend caches in memory & SQL Server
    ↓
Frontend displays data
```

---

## 🧪 Testing with curl

### **Test Adafruit Connection**
```bash
curl -H "X-AIO-Key: aio_RsOh51gGEAZtkkgzdTwN5PjRENnb" \
  https://io.adafruit.com/api/v2/w7thm
# Should return user info (200 OK)
```

### **Test Send Temperature**
```bash
curl -X POST http://localhost:3000/api/devices/send-sensor \
  -H "Content-Type: application/json" \
  -d '{
    "feedName": "smartHome.temperature",
    "value": 25.5
  }'
```

### **Test Get All Feeds**
```bash
curl http://localhost:3000/api/devices/feeds
# Returns all current sensor values
```

---

## 🚨 Troubleshooting

### **❌ Error: Request failed with status code 404**
- **Cause**: Adafruit feeds not created yet
- **Fix**: Create feeds manually at https://io.adafruit.com/feeds or run `create_feeds.py`

### **❌ Error: X-AIO-Key header missing**
- **Cause**: Invalid API key in `.env`
- **Fix**: Check `ADAFRUIT_IO_KEY` matches your account settings

### **❌ Error: Cannot connect to database**
- **Cause**: SQL Server not running
- **Fix**: Start SQL Server service or update `DB_SERVER` in `.env`

### **❌ Error: 401 Unauthorized**
- **Cause**: Wrong username or API key
- **Fix**: Verify `ADAFRUIT_IO_USERNAME` and `ADAFRUIT_IO_KEY` in `.env`

---

## 📚 File Structure

```
iot-backend/
├── src/
│   ├── server.js                 # ✅ Updated: Adafruit only
│   ├── config/
│   │   ├── adafruit.js           # Adafruit config
│   │   ├── database.js           # SQL Server config
│   │   └── mqtt.js               # ⛔ Not used anymore
│   ├── services/
│   │   ├── adafruitService.js    # ✅ Primary service
│   │   ├── dbService.js          # SQL cache
│   │   └── mqttService.js        # ⛔ Not used
│   ├── controllers/
│   │   └── deviceController.js   # ✅ Updated: No MQTT
│   └── routes/
│       └── deviceRoutes.js
├── .env                          # ✅ Updated: Adafruit only
├── package.json
└── ADAFRUIT_CLOUD_ONLY_SETUP.md  # This file
```

---

## 🔐 Security Notes

⚠️ **Never commit `.env` to Git** (contains API keys)

```bash
echo ".env" >> .gitignore
```

---

## 🎯 Next Steps

1. ✅ Create Adafruit feeds
2. ✅ Start backend: `npm run dev`
3. ✅ Test `/api/health`
4. ✅ Send test data via curl
5. ✅ Connect frontend to backend
6. ✅ Monitor data in Adafruit dashboard

---

## 📞 Support

- **Adafruit Docs**: https://io.adafruit.com/api/docs
- **Backend Logs**: Check terminal output for errors
- **Adafruit Dashboard**: https://io.adafruit.com/

---

**Last Updated**: May 11, 2026
**Status**: ✅ Adafruit Cloud Only (No Local MQTT)
