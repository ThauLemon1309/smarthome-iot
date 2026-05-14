require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool, closePool } = require('./config/database');
const AdafruitService = require('./services/adafruitService');
const AdafruitMqttService = require('./services/adafruitMqttService');
const AdafruitSyncService = require('./services/adafruitSyncService');
const AutoModeService = require('./services/autoModeService');
const AutoModeConfigController = require('./controllers/autoModeConfigController');
const ThresholdAlertService = require('./services/thresholdAlertService');
const AlertController = require('./controllers/alertController');
const ScheduleExecutorService = require('./services/scheduleExecutorService');
const DeviceController = require('./controllers/deviceController');
const deviceRoutes = require('./routes/deviceRoutes');
const authRoutes = require('./routes/authRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const logRoutes = require('./routes/logRoutes');
const autoModeConfigRoutes = require('./routes/autoModeConfigRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const alertRoutes = require('./routes/alertRoutes');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Khởi tạo Adafruit Service (kết nối đến Adafruit Cloud)
const adafruitService = new AdafruitService();

// Check Adafruit Connection on startup
(async () => {
  try {
    const connectionStatus = await adafruitService.checkConnection();
    if (connectionStatus.connected) {
      console.log('✅ Adafruit IO Cloud: Connected');
    } else {
      console.error('❌ Adafruit IO Cloud: Connection failed!');
    }
  } catch (error) {
    console.error('❌ Adafruit IO Cloud startup check failed:', error.message);
  }
})();

// ✅ Khởi tạo Adafruit MQTT Service (Real-time sync)
let adafruitMqtt = null;
let deviceController = null;

// Khởi tạo Device Controller (Adafruit only)
deviceController = new DeviceController(adafruitService);

// Khởi tạo Adafruit MQTT Service với callback để sync dữ liệu real-time
const adafruitConfig = require('./config/adafruit');
adafruitMqtt = new AdafruitMqttService((topic, message) => {
  console.log(`🔄 Real-time update từ Adafruit MQTT: ${topic} = ${message}`);
  
  // Xác định feed từ topic
  const mode_topic = `${adafruitConfig.mqttUsername}/feeds/${adafruitConfig.feeds.mode}`;
  const temp_topic = `${adafruitConfig.mqttUsername}/feeds/${adafruitConfig.feeds.temperature}`;
  const humi_topic = `${adafruitConfig.mqttUsername}/feeds/${adafruitConfig.feeds.humidity}`;
  const brig_topic = `${adafruitConfig.mqttUsername}/feeds/${adafruitConfig.feeds.brightness}`;
  
  try {
    if (topic === mode_topic) {
      const modeValue = parseInt(message);
      if (![0, 1].includes(modeValue)) return;
      
      console.log(`📡 Mode thay đổi từ cloud: ${modeValue === 1 ? 'AUTO' : 'MANUAL'}`);
      deviceController.deviceState.mode = modeValue;
      deviceController.deviceState.updatedAt = new Date().toISOString();
      
      // Trigger auto mode nếu mode = 1
      if (modeValue === 1 && deviceController.autoModeService) {
        deviceController.clearManualLocks();
        deviceController.autoModeService.start();
        console.log('🤖 AutoMode: bật từ cloud');
      } else if (modeValue === 0 && deviceController.autoModeService) {
        deviceController.autoModeService.stop();
        console.log('🤖 AutoMode: tắt từ cloud');
      }
    } 
    else if (topic === temp_topic) {
      deviceController.sensorData.temperature = parseFloat(message);
      deviceController.sensorData.updatedAt = new Date().toISOString();
    }
    else if (topic === humi_topic) {
      deviceController.sensorData.humidity = parseFloat(message);
      deviceController.sensorData.updatedAt = new Date().toISOString();
    }
    else if (topic === brig_topic) {
      deviceController.sensorData.brightness = parseFloat(message);
      deviceController.sensorData.updatedAt = new Date().toISOString();
    }
  } catch (e) {
    console.error('❌ Error processing MQTT message:', e.message);
  }
});

// Kết nối MQTT
adafruitMqtt.connect();

// Khởi tạo Auto Mode Service và kết nối với Device Controller
const autoModeService = new AutoModeService(adafruitService, deviceController);
deviceController.setAutoModeService(autoModeService);
const autoModeConfigController = new AutoModeConfigController(autoModeService);

// Khởi tạo Threshold Alert Service
const thresholdAlertService = new ThresholdAlertService(deviceController);
autoModeService.setThresholdAlertService(thresholdAlertService);
const alertController = new AlertController(thresholdAlertService);

// Khởi tạo Schedule Executor Service
const scheduleExecutor = new ScheduleExecutorService(adafruitService, deviceController);
scheduleExecutor.start();

// Khởi tạo Adafruit Sync Service (persist sensor data to DB)
const adafruitSync = new AdafruitSyncService(adafruitService, deviceController);
adafruitSync.setThresholdAlertService(thresholdAlertService);
adafruitSync.start();

// Khôi phục trạng thái thiết bị từ Adafruit khi khởi động
(async () => {
  try {
    const cfg = require('./config/adafruit');
    const [modeValue, fanValue, rgbValue] = await Promise.all([
      adafruitService.getLastValue(cfg.feeds.mode),
      adafruitService.getLastValue(cfg.feeds.fan),
      adafruitService.getLastValue(cfg.feeds.rgb),
    ]);

    if (fanValue !== null) {
      deviceController.deviceState.fanSpeed = Number(fanValue);
      console.log(`🔄 Khôi phục: quạt = ${fanValue}%`);
    }
    if (rgbValue !== null) {
      deviceController.deviceState.ledLevel = Number(rgbValue);
      console.log(`🔄 Khôi phục: đèn = mức ${rgbValue}`);
    }
    if (Number(modeValue) === 1) {
      deviceController.deviceState.mode = 1;
      await autoModeService.start();
      console.log('🤖 AutoMode: khôi phục từ trạng thái trước (mode=1)');
    }
  } catch (error) {
    console.error('❌ Startup state restore failed:', error.message);
  }
})();

// Routes
app.use('/api/devices', deviceRoutes(deviceController));
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/schedules', scheduleRoutes(deviceController));
app.use('/api/logs', logRoutes);
app.use('/api/auto-mode', autoModeConfigRoutes(autoModeConfigController));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/alerts', alertRoutes(alertController));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let adafruitStatus = 'disconnected';
  
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  // Check Adafruit connection
  try {
    const adafruitCheck = await adafruitService.checkConnection();
    adafruitStatus = adafruitCheck.connected ? 'connected' : 'error';
  } catch {
    adafruitStatus = 'error';
  }

  res.json({
    status: 'ok',
    service: 'IoT Backend (Adafruit Cloud Only)',
    database: dbStatus,
    adafruit_cloud: adafruitStatus,
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint không tồn tại'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server — kết nối DB trước
async function startServer() {
  try {
    // Kết nối SQL Server
    await getPool();
    console.log('✅ Database sẵn sàng');

    // Start Express
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════╗
║   🏠 IoT Smart Home Backend           ║
║   Port: ${PORT}                         ║
║   Database: SQL Server ✅              ║
║   Status: Chạy                       ║
╚══════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Đang dừng server...');
  scheduleExecutor.stop();
  autoModeService.stop();
  adafruitSync.stop();
  if (adafruitMqtt) adafruitMqtt.disconnect();
  await closePool();
  process.exit(0);
});

module.exports = app;
