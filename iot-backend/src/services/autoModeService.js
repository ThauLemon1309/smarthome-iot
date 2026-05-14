const adafruitConfig = require('../config/adafruit');
const dbService = require('./dbService');

const POLL_INTERVAL_MS = 10000; // 10s - giữ trong giới hạn rate limit AdafruitIO

// Default config dùng khi chưa load được từ DB
const DEFAULT_CONFIG = {
  FanTempLow: 25, FanTempMid: 28, FanTempHigh: 32,
  FanSpeed1: 30, FanSpeed2: 60, FanSpeed3: 100,
  HumiThreshold: 70, HumiBoost: 20,
  LedBrigOff: 60, LedBrigYellow: 40,
};

class AutoModeService {
  constructor(adafruitService, deviceController) {
    this.adafruitService = adafruitService;
    this.deviceController = deviceController;
    this.intervalId = null;
    this.lastFanSpeed = null;
    this.lastLedLevel = null;
    this.config = { ...DEFAULT_CONFIG };
    this.configDirty = true; // reload ngay lần đầu
    // Cache sensor device IDs để tránh query DB mỗi chu kỳ
    this.tempDeviceId = null;
    this.humiDeviceId = null;
    this.brigDeviceId = null;
    this.thresholdAlertService = null;
  }

  setThresholdAlertService(service) {
    this.thresholdAlertService = service;
  }

  // Được gọi từ controller khi user lưu config mới
  markConfigDirty() {
    this.configDirty = true;
  }

  // ========== LOGIC TÍNH TOÁN (dùng config động) ==========

  calcFanSpeed(temp, humidity) {
    const { FanTempLow, FanTempMid, FanTempHigh, FanSpeed1, FanSpeed2, FanSpeed3, HumiThreshold, HumiBoost } = this.config;
    let speed;
    if (temp < FanTempLow) speed = 0;
    else if (temp < FanTempMid) speed = FanSpeed1;
    else if (temp < FanTempHigh) speed = FanSpeed2;
    else speed = FanSpeed3;

    if (humidity > HumiThreshold) speed = Math.min(speed + HumiBoost, 100);
    return speed;
  }

  calcLedLevel(brightness) {
    const { LedBrigOff, LedBrigYellow } = this.config;
    if (brightness > LedBrigOff) return 0;   // tắt đèn
    if (brightness >= LedBrigYellow) return 1; // đèn vàng (mức 1)
    return 2;                                   // đèn trắng (mức 2)
  }

  // ========== VÒNG LẶP CHÍNH ==========

  async runCycle() {
    try {
      // Reload config từ DB nếu đã bị đánh dấu dirty
      if (this.configDirty) {
        try {
          this.config = await dbService.getAutoModeConfig();
          this.configDirty = false;
          console.log('🔄 AutoMode: đã tải lại cấu hình từ DB');
        } catch {
          console.warn('⚠️ AutoMode: không thể tải config từ DB, dùng config hiện tại');
        }
      }

      const [rawTemp, rawHumi, rawBrig] = await Promise.all([
        this.adafruitService.getLastValue(adafruitConfig.feeds.temperature),
        this.adafruitService.getLastValue(adafruitConfig.feeds.humidity),
        this.adafruitService.getLastValue(adafruitConfig.feeds.brightness),
      ]);

      if (rawTemp === null || rawHumi === null || rawBrig === null) {
        console.warn('⚠️ AutoMode: thiếu dữ liệu cảm biến, bỏ qua chu kỳ');
        return;
      }

      const temp = Number(rawTemp);
      const humidity = Number(rawHumi);
      const brightness = Number(rawBrig);

      // Cập nhật sensor cache trong deviceController → frontend nhận qua SSE
      this.deviceController.sensorData = {
        temperature: temp,
        humidity,
        brightness,
        updatedAt: new Date().toISOString(),
      };
      this.deviceController.emitEvent('sensor', { temperature: temp, humidity, brightness });

      // Log sensor snapshot mỗi 5 phút (không phải mỗi 10s)
      this._sensorLogTick = (this._sensorLogTick || 0) + 1;
      if (this._sensorLogTick >= 30) { // 30 × 10s = 5 phút
        this._sensorLogTick = 0;
        dbService.logActivity('SENSOR', `Nhiệt độ: ${temp}°C | Độ ẩm: ${humidity}% | Ánh sáng: ${brightness}%`).catch(() => {});
      }

      const fanSpeed = this.calcFanSpeed(temp, humidity);
      const ledLevel = this.calcLedLevel(brightness);

      let stateChanged = false;

      if (fanSpeed !== this.lastFanSpeed) {
        if (this.deviceController.isLocked('fan', 'AUTO_MODE')) {
          console.log(`🔒 AutoMode: quạt bị khoá bởi ưu tiên cao hơn, bỏ qua`);
        } else {
          await this.adafruitService.sendData(adafruitConfig.feeds.fan, fanSpeed);
          this.deviceController.deviceState.fanSpeed = fanSpeed;
          this.lastFanSpeed = fanSpeed;
          stateChanged = true;
          console.log(`🤖 AutoMode: quạt → ${fanSpeed}% (temp=${temp}°C, humi=${humidity}%)`);
          dbService.getControlDeviceByTypeCode('fan').then((id) => {
            if (id) dbService.logAction(null, id, 'AUTO_MODE', null, 'SUCCESS', `Quạt → ${fanSpeed}% (auto)`).catch(() => {});
          }).catch(() => {});
          dbService.logActivity('DEVICE', `[Tự động] Quạt → ${fanSpeed}% (nhiệt độ ${temp}°C, độ ẩm ${humidity}%)`).catch(() => {});
        }
      }

      if (ledLevel !== this.lastLedLevel) {
        if (this.deviceController.isLocked('rgb-led', 'AUTO_MODE')) {
          console.log(`🔒 AutoMode: đèn bị khoá bởi ưu tiên cao hơn, bỏ qua`);
        } else {
          await this.adafruitService.sendData(adafruitConfig.feeds.rgb, ledLevel);
          this.deviceController.deviceState.ledLevel = ledLevel;
          this.lastLedLevel = ledLevel;
          stateChanged = true;
          console.log(`🤖 AutoMode: đèn → mức ${ledLevel} (brig=${brightness}%)`);
          dbService.getControlDeviceByTypeCode('rgb-led').then((id) => {
            if (id) dbService.logAction(null, id, 'AUTO_MODE', null, 'SUCCESS', `Đèn → mức ${ledLevel} (auto)`).catch(() => {});
          }).catch(() => {});
          dbService.logActivity('DEVICE', `[Tự động] Đèn → mức ${ledLevel} (ánh sáng ${brightness}%)`).catch(() => {});
        }
      }

      if (stateChanged) {
        this.deviceController.deviceState.updatedAt = new Date().toISOString();
        this.deviceController.emitEvent('state', this.deviceController.deviceState);
      }

      // Lưu dữ liệu cảm biến vào DB (không quan trọng, bỏ qua nếu lỗi)
      this._logSensorData(temp, humidity, brightness).catch(() => {});

      // Kiểm tra cảnh báo ngưỡng
      if (this.thresholdAlertService) {
        this.thresholdAlertService.checkRules({ temperature: temp, humidity, brightness }).catch(() => {});
      }
    } catch (error) {
      console.error('❌ AutoMode cycle error:', error.message);
    }
  }

  async _initSensorDeviceIds() {
    try {
      [this.tempDeviceId, this.humiDeviceId, this.brigDeviceId] = await Promise.all([
        dbService.getSensorDeviceByTypeCode('temperature-sensor'),
        dbService.getSensorDeviceByTypeCode('humidity-sensor'),
        dbService.getSensorDeviceByTypeCode('light-sensor'),
      ]);
      if (this.tempDeviceId || this.humiDeviceId || this.brigDeviceId) {
        console.log(`🗄️ AutoMode: sensor device IDs - temp:${this.tempDeviceId}, humi:${this.humiDeviceId}, brig:${this.brigDeviceId}`);
      }
    } catch {
      // Không cần xử lý - DB logging là tùy chọn
    }
  }

  async _logSensorData(temp, humidity, brightness) {
    const saves = [];
    if (this.tempDeviceId) saves.push(dbService.saveSensorData(this.tempDeviceId, temp));
    if (this.humiDeviceId) saves.push(dbService.saveSensorData(this.humiDeviceId, humidity));
    if (this.brigDeviceId) saves.push(dbService.saveSensorData(this.brigDeviceId, brightness));
    if (saves.length > 0) await Promise.allSettled(saves);
  }

  // ========== QUẢN LÝ VÒNG LẶP ==========

  async start() {
    if (this.intervalId) return;
    this.lastFanSpeed = null;
    this.lastLedLevel = null;
    this.configDirty = true; // force reload config khi start
    await this._initSensorDeviceIds();
    console.log('🟢 AutoMode: bắt đầu vòng lặp tự động (mỗi 10 giây)');
    await this.runCycle(); // Chạy ngay lập tức
    this.intervalId = setInterval(() => this.runCycle(), POLL_INTERVAL_MS);
  }

  stop() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.lastFanSpeed = null;
    this.lastLedLevel = null;
    console.log('🔴 AutoMode: dừng vòng lặp tự động');
  }

  get isRunning() {
    return this.intervalId !== null;
  }
}

module.exports = AutoModeService;
