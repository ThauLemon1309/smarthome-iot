# 🚀 Hướng Dẫn Chạy IoT Backend

## 📋 Yêu cầu
- Node.js cài đặt
- npm
- Credentials Adafruit IO (đã cập nhật trong `.env`)

---

## ✅ Bước 1: Chuẩn bị

### Mở PowerShell và vào thư mục project:
```powershell
cd d:\ThauLemon\bku\study\hk252\đa\ đn\iot-backend
```

### Cài dependencies (chỉ cần lần đầu):
```powershell
npm install
```

---

## 🎯 Bước 2: Chạy Server

### **Cách 1: Chạy server Adafruit IO Backend** (Khuyến nghị)
```powershell
npm start
```

**Output thành công:**
```
╔══════════════════════════════════════╗ 
║   🏠 IoT Smart Home Backend           ║
║   Port: 3000                         ║
║   Status: Chạy                       ║
╚══════════════════════════════════════╝

✅ Server đang chạy trên port 3000
```

---

## 🔍 Bước 3: Monitor Feeds (Trong Terminal khác)

### Mở Terminal PowerShell thứ 2:
```powershell
cd d:\ThauLemon\bku\study\hk252\đa\ đn\iot-backend
```

### Chạy monitor script:
```powershell
node monitor-feeds.js
```

**Output:**
```
✅ Kết nối Adafruit IO thành công!

🔍 Bắt đầu monitor các feeds từ Adafruit IO...

📊 [14:30:25] Temperature (°C) (da-temp)
   Cũ: 28.5  ➜  Mới: 29.2
```

- Mỗi khi bạn thay đổi value trên **Adafruit IO Dashboard**, terminal sẽ hiển thị thay đổi
- Nhấn `Ctrl+C` để dừng

---

## 🧪 Bước 4: Kiểm tra API

### Terminal thứ 3 - Mở PowerShell mới hoặc dùng Postman:

#### 📊 Lấy dữ liệu tất cả feeds:
```powershell
curl http://localhost:3000/api/devices/feeds
```

#### 🌡️ Điều khiển quạt:
```powershell
$body = @{ state = "75" } | ConvertTo-Json
curl -Method POST `
  -Uri "http://localhost:3000/api/devices/fan" `
  -ContentType "application/json" `
  -Body $body
```

#### 🌈 Điều khiển LED RGB:
```powershell
$body = @{ color = "#FF0000" } | ConvertTo-Json
curl -Method POST `
  -Uri "http://localhost:3000/api/devices/led" `
  -ContentType "application/json" `
  -Body $body
```

#### 📱 Hiển thị LCD:
```powershell
$body = @{ text = "Hello IoT" } | ConvertTo-Json
curl -Method POST `
  -Uri "http://localhost:3000/api/devices/lcd" `
  -ContentType "application/json" `
  -Body $body
```

#### ✅ Kiểm tra trạng thái:
```powershell
curl http://localhost:3000/api/devices/status
```

---

## 📚 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/devices/feeds` | Lấy dữ liệu tất cả 7 feeds |
| POST | `/api/devices/fan` | Điều khiển quạt |
| POST | `/api/devices/led` | Điều khiển LED RGB |
| POST | `/api/devices/lcd` | Hiển thị text LCD |
| GET | `/api/devices/status` | Kiểm tra trạng thái |
| GET | `/api/health` | Health check |

---

## 📝 Danh sách Feeds

| Feed ID | Display Name | Endpoint |
|---------|-------------|----------|
| `da-temp` | Temperature (°C) | https://io.adafruit.com/api/v2/w7thm/feeds/da-temp |
| `da-brig` | Brightness (%) | https://io.adafruit.com/api/v2/w7thm/feeds/da-brig |
| `da-fan` | Fan Speed | https://io.adafruit.com/api/v2/w7thm/feeds/da-fan |
| `da-humi` | Humidity (%) | https://io.adafruit.com/api/v2/w7thm/feeds/da-humi |
| `da-lcd` | LCD Display | https://io.adafruit.com/api/v2/w7thm/feeds/da-lcd |
| `da-mode` | Mode | https://io.adafruit.com/api/v2/w7thm/feeds/da-mode |
| `da-rbg` | RGB Color | https://io.adafruit.com/api/v2/w7thm/feeds/da-rbg |

---

## 🛑 Dừng Server

Nhấn `Ctrl+C` trong terminal chạy server

---

## 🔧 Troubleshooting

### ❌ Lỗi "Cannot find module"
```powershell
npm install
```

### ❌ Lỗi Port 3000 đang sử dụng
Thay đổi PORT trong `.env`:
```
PORT=3001
```

### ❌ Lỗi Adafruit IO Key
Kiểm tra `.env`:
```
ADAFRUIT_IO_KEY=aio_RsOh51gGEAZtkkgzdTwN5PjRENnb
ADAFRUIT_IO_USERNAME=w7thm
```

---

## 📱 Kết nối với Mobile App

Backend API sẵn sàng để kết nối với:
- **React Native**
- **Flutter**
- **Native Android/iOS**
- **Web App**

**Base URL:** `http://<your-machine-ip>:3000`

---

**✅ Xong! Backend đã sẵn sàng**
