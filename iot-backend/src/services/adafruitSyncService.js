/**
 * 🔄 Adafruit Sync Service
 * Automatically persist Adafruit sensor data to local database (SensorData table)
 * Runs every 30 seconds to keep historical data
 */

const dbService = require('./dbService');

class AdafruitSyncService {
  constructor(adafruitService, deviceController) {
    this.adafruitService = adafruitService;
    this.deviceController = deviceController;
    this.syncInterval = null;
    this.isRunning = false;
    this._sensorIdCache = null;
    this.thresholdAlertService = null;
  }

  setThresholdAlertService(service) {
    this.thresholdAlertService = service;
  }

  async _resolveSensorIds() {
    if (this._sensorIdCache) return this._sensorIdCache;
    // Tìm DeviceID của từng loại sensor theo TypeCode
    const rows = await dbService.getSensorDeviceIdsByType();
    this._sensorIdCache = rows; // { temperature: id, humidity: id, brightness: id }
    return this._sensorIdCache;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🔄 Adafruit Sync Service: Started');
    this.sync();
    this.syncInterval = setInterval(() => this.sync(), 30000);
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️  Adafruit Sync Service: Stopped');
  }

  async sync() {
    try {
      const sensors = this.deviceController.sensorData;
      if (!sensors.temperature && !sensors.humidity && !sensors.brightness) {
        console.log('⏭️  No sensor data to sync');
        return;
      }

      const ids = await this._resolveSensorIds();
      const syncs = [];

      if (sensors.temperature != null && ids.temperature) {
        syncs.push(
          dbService.saveSensorData(ids.temperature, sensors.temperature)
            .then(() => console.log(`✅ Synced temp: ${sensors.temperature}°C`))
            .catch((e) => console.error(`❌ Temp sync failed:`, e.message))
        );
      }

      if (sensors.humidity != null && ids.humidity) {
        syncs.push(
          dbService.saveSensorData(ids.humidity, sensors.humidity)
            .then(() => console.log(`✅ Synced humi: ${sensors.humidity}%`))
            .catch((e) => console.error(`❌ Humi sync failed:`, e.message))
        );
      }

      if (sensors.brightness != null && ids.brightness) {
        syncs.push(
          dbService.saveSensorData(ids.brightness, sensors.brightness)
            .then(() => console.log(`✅ Synced brig: ${sensors.brightness}%`))
            .catch((e) => console.error(`❌ Brig sync failed:`, e.message))
        );
      }

      await Promise.allSettled(syncs);

      // Kiểm tra ngưỡng cảnh báo (chạy kể cả khi auto mode tắt)
      if (this.thresholdAlertService && !this.deviceController.autoModeService?.isRunning) {
        const s = this.deviceController.sensorData;
        this.thresholdAlertService.checkRules({
          temperature: s.temperature,
          humidity: s.humidity,
          brightness: s.brightness,
        }).catch(() => {});
      }
    } catch (error) {
      console.error('❌ Adafruit sync error:', error.message);
    }
  }
}

module.exports = AdafruitSyncService;
