const { EventEmitter } = require('events');
const AdafruitService = require('../services/adafruitService');
const adafruitConfig = require('../config/adafruit');
const dbService = require('../services/dbService');

// Helper: ghi log thủ công với userId từ JWT
async function logManual(typeCode, message, userId = null) {
  try {
    const controlId = await dbService.getControlDeviceByTypeCode(typeCode);
    if (controlId) await dbService.logAction(null, controlId, 'MANUAL', null, 'SUCCESS', message, userId);
  } catch { /* ignore */ }
}

class DeviceController {
  constructor(adafruitService) {
    // Constructor now accepts adafruitService (Adafruit Cloud only - no local MQTT)
    this.adafruitService = adafruitService || new AdafruitService();
    this.events = new EventEmitter();
    this.events.setMaxListeners(100);
    this.autoModeService = null;
    this.sensorData = {
      temperature: null,
      humidity: null,
      brightness: null,
      updatedAt: null,
    };
    this.deviceState = {
      fanSpeed: 0,
      mode: 0,
      ledLevel: 0,
      lcdText: '',
      updatedAt: null,
    };
    // Locks per typeCode:
    // scheduleBlockedUntil: MANUAL blocks SCHEDULE for 5 min
    // autoBlockedUntil: MANUAL blocks AUTO for 30 min, SCHEDULE blocks AUTO for 5 min
    // autoBlockSource: who set autoBlockedUntil ('MANUAL' | 'SCHEDULE')
    this._locks = {};
  }

  // ========== PRIORITY LOCK MANAGEMENT ==========
  setLock(typeCode, source) {
    if (!this._locks[typeCode]) {
      this._locks[typeCode] = { scheduleBlockedUntil: 0, autoBlockedUntil: 0, autoBlockSource: null };
    }
    const lock = this._locks[typeCode];
    const now = Date.now();
    if (source === 'MANUAL') {
      lock.scheduleBlockedUntil = now + 5 * 60 * 1000;   // chặn lịch 5 phút
      lock.autoBlockedUntil     = now + 30 * 60 * 1000;  // chặn auto 30 phút
      lock.autoBlockSource      = 'MANUAL';
      console.log(`🔒 ${typeCode} locked by MANUAL (schedule 5min, auto 30min)`);
    } else if (source === 'SCHEDULE') {
      lock.autoBlockedUntil = now + 5 * 60 * 1000;       // chặn auto 5 phút
      lock.autoBlockSource  = 'SCHEDULE';
      console.log(`🔒 ${typeCode} locked by SCHEDULE (auto 5min)`);
    }
  }

  // Returns true if typeCode is locked against requestingSource
  isLocked(typeCode, requestingSource) {
    const lock = this._locks[typeCode];
    if (!lock) return false;
    const now = Date.now();
    if (requestingSource === 'SCHEDULE')  return now < lock.scheduleBlockedUntil;
    if (requestingSource === 'AUTO_MODE') return now < lock.autoBlockedUntil;
    return false;
  }

  // Xóa lock do MANUAL tạo ra, giữ lock của SCHEDULE
  clearManualLocks() {
    for (const typeCode of Object.keys(this._locks)) {
      const lock = this._locks[typeCode];
      lock.scheduleBlockedUntil = 0;
      if (lock.autoBlockSource === 'MANUAL') {
        lock.autoBlockedUntil = 0;
        lock.autoBlockSource  = null;
      }
    }
    console.log('🔓 Manual locks cleared (schedule locks kept)');
  }

  clearAllLocks() {
    this._locks = {};
    console.log('🔓 All device priority locks cleared');
  }
  // ==============================================

  setAutoModeService(autoModeService) {
    this.autoModeService = autoModeService;
  }

  parseIntegerValue(rawValue) {
    const value = Number(rawValue);
    return Number.isInteger(value) ? value : null;
  }

  parsePayload(payload) {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object') {
        return parsed.value ?? parsed.text ?? parsed;
      }
      return parsed;
    } catch {
      return payload;
    }
  }

  emitEvent(type, data) {
    this.events.emit('device-event', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  sendToAdafruit(feedName, value) {
    this.adafruitService.sendData(feedName, value).catch((error) => {
      console.error(`❌ Adafruit send ${feedName} failed:`, error.message);
    });
  }

  async getSensorData(req, res) {
    if (
      this.sensorData.temperature !== null ||
      this.sensorData.humidity !== null ||
      this.sensorData.brightness !== null
    ) {
      return res.json({ status: 'success', source: 'mqtt-cache', data: this.sensorData });
    }

    try {
      const [tempValue, humiValue, brigValue] = await Promise.all([
        this.adafruitService.getLastValue(adafruitConfig.feeds.temperature),
        this.adafruitService.getLastValue(adafruitConfig.feeds.humidity),
        this.adafruitService.getLastValue(adafruitConfig.feeds.brightness),
      ]);

      this.sensorData = {
        temperature: tempValue !== null ? Number(tempValue) : null,
        humidity: humiValue !== null ? Number(humiValue) : null,
        brightness: brigValue !== null ? Number(brigValue) : null,
        updatedAt: new Date().toISOString(),
      };

      return res.json({ status: 'success', source: 'adafruit', data: this.sensorData });
    } catch (error) {
      return res.status(502).json({
        status: 'error',
        message: 'Cannot read sensor data',
        error: error.message,
      });
    }
  }

  controlFan(req, res) {
    if (this.deviceState.mode === 1) {
      return res.status(403).json({ status: 'error', message: 'Chuyển sang chế độ thủ công trước khi điều khiển' });
    }
    const fanValue = this.parseIntegerValue(req.body?.value ?? req.body?.state);
    if (fanValue === null || fanValue < 0 || fanValue > 100) {
      return res.status(400).json({ status: 'error', message: 'Fan value must be an integer from 0 to 100' });
    }

    this.deviceState.fanSpeed = fanValue;
    this.deviceState.updatedAt = new Date().toISOString();
    this.emitEvent('state', this.deviceState);
    this.setLock('fan', 'MANUAL');
    this.sendToAdafruit(adafruitConfig.feeds.fan, fanValue);
    logManual('fan', `Quạt → ${fanValue}%`, req.user?.id);
    dbService.logActivity('DEVICE', `[Thủ công] Quạt → ${fanValue}%`).catch(() => {});

    return res.json({ status: 'success', transport: 'adafruit-cloud', value: fanValue });
  }

  controlRbg(req, res) {
    if (this.deviceState.mode === 1) {
      return res.status(403).json({ status: 'error', message: 'Chuyển sang chế độ thủ công trước khi điều khiển' });
    }
    const rbgValue = this.parseIntegerValue(req.body?.value);
    if (rbgValue === null || ![0, 1, 2].includes(rbgValue)) {
      return res.status(400).json({ status: 'error', message: 'RGB value must be 0, 1, or 2' });
    }

    this.deviceState.ledLevel = rbgValue;
    this.deviceState.updatedAt = new Date().toISOString();
    this.emitEvent('state', this.deviceState);
    this.setLock('rgb-led', 'MANUAL');
    this.sendToAdafruit(adafruitConfig.feeds.rgb, rbgValue);
    logManual('rgb-led', `Đèn → mức ${rbgValue}`, req.user?.id);
    dbService.logActivity('DEVICE', `[Thủ công] Đèn → mức ${rbgValue}`).catch(() => {});

    return res.json({ status: 'success', transport: 'adafruit-cloud', value: rbgValue });
  }

  controlLED(req, res) {
    if (req.body?.value === undefined && req.body?.color !== undefined) {
      req.body.value = req.body.color;
    }
    return this.controlRbg(req, res);
  }

  controlMode(req, res) {
    const modeValue = this.parseIntegerValue(req.body?.value);
    if (modeValue === null || ![0, 1].includes(modeValue)) {
      return res.status(400).json({ status: 'error', message: 'Mode value must be 0 or 1' });
    }

    this.deviceState.mode = modeValue;
    this.deviceState.updatedAt = new Date().toISOString();
    this.emitEvent('state', this.deviceState);
    this.sendToAdafruit(adafruitConfig.feeds.mode, modeValue);

    // Bật/tắt vòng lặp auto mode ở backend
    if (this.autoModeService) {
      if (modeValue === 1) {
        this.clearManualLocks(); // Xóa lock thủ công, giữ lock lịch trình
        this.autoModeService.start();
      } else {
        this.autoModeService.stop();
      }
    }

    return res.json({ status: 'success', transport: 'adafruit-cloud', value: modeValue });
  }

  displayLCD(req, res) {
    if (this.deviceState.mode === 1) {
      return res.status(403).json({ status: 'error', message: 'Chuyển sang chế độ thủ công trước khi điều khiển' });
    }
    const text = String(req.body?.text ?? '');
    this.deviceState.lcdText = text;
    this.deviceState.updatedAt = new Date().toISOString();
    this.emitEvent('state', this.deviceState);
    this.setLock('lcd', 'MANUAL');
    this.sendToAdafruit(adafruitConfig.feeds.lcd, text);
    logManual('lcd', `LCD → "${text}"`, req.user?.id);
    dbService.logActivity('DEVICE', `[Thủ công] LCD → "${text}"`).catch(() => {});

    return res.json({ status: 'success', transport: 'adafruit-cloud', text });
  }

  getStatus(req, res) {
    res.json({
      status: 'success',
      transport: 'adafruit-cloud',
      state: this.deviceState,
      timestamp: new Date().toISOString(),
    });
  }

  async getAllFeeds(req, res) {
    try {
      const allFeedsData = await this.adafruitService.getAllFeeds(adafruitConfig.allFeeds);
      if (!allFeedsData) {
        return res.status(500).json({ status: 'error', message: 'Cannot read Adafruit IO feeds' });
      }

      const formattedData = {};
      for (const [feedKey, value] of Object.entries(allFeedsData)) {
        formattedData[feedKey] = {
          name: adafruitConfig.feedNames[feedKey] || feedKey,
          value,
          timestamp: new Date().toISOString(),
        };
      }

      return res.json({ status: 'success', data: formattedData, timestamp: new Date().toISOString() });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Cannot read Adafruit IO feeds', error: error.message });
    }
  }

  getModeStatus(req, res) {
    const modeNum = this.deviceState.mode === 1 ? 1 : 0;
    res.json({
      status: 'success',
      source: 'mqtt-cache',
      data: { mode: modeNum, feed: adafruitConfig.feeds.mode, modeLabel: modeNum === 1 ? 'auto' : 'manual' },
    });
  }

  getFanStatus(req, res) {
    res.json({
      status: 'success',
      source: 'mqtt-cache',
      data: { fanSpeed: this.deviceState.fanSpeed, feed: adafruitConfig.feeds.fan },
    });
  }

  getRGBStatus(req, res) {
    res.json({
      status: 'success',
      source: 'mqtt-cache',
      data: {
        ledLevel: this.deviceState.ledLevel,
        feed: adafruitConfig.feeds.rgb,
        levelLabel: ['Off', 'Medium', 'High'][this.deviceState.ledLevel],
      },
    });
  }

  async getSensorHistory(req, res) {
    try {
      const { feedName } = req.params;
      const hours = parseInt(req.query.hours, 10) || 6;

      if (!adafruitConfig.allFeeds.includes(feedName)) {
        return res.status(400).json({ status: 'error', message: `Feed "${feedName}" is invalid` });
      }

      const historyData = await this.adafruitService.getHistory(feedName, hours);
      if (!historyData) {
        return res.status(502).json({ status: 'error', message: 'Cannot read history from Adafruit IO' });
      }

      return res.json({ status: 'success', feed: feedName, hours, data: historyData });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Cannot read sensor history', error: error.message });
    }
  }

  streamEvents(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    send({
      type: 'snapshot',
      data: {
        sensors: this.sensorData,
        state: this.deviceState,
        mqttConnected: this.mqttService ? this.mqttService.connected : false,
      },
      timestamp: new Date().toISOString(),
    });

    const onEvent = (event) => send(event);
    this.events.on('device-event', onEvent);

    const heartbeat = setInterval(() => {
      send({ type: 'heartbeat', data: null, timestamp: new Date().toISOString() });
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.events.off('device-event', onEvent);
      res.end();
    });
  }

  async getAllDevicesDB(req, res) {
    try {
      const homeId = parseInt(req.params.homeId, 10);
      const devices = await dbService.getAllDevices(homeId);
      return res.json({ status: 'success', data: devices });
    } catch (error) {
      console.error('getAllDevicesDB failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }

  async getDevicesByRoomDB(req, res) {
    try {
      const roomId = parseInt(req.params.roomId, 10);
      const devices = await dbService.getDevicesByRoom(roomId);
      return res.json({ status: 'success', data: devices });
    } catch (error) {
      console.error('getDevicesByRoomDB failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }

  async getDeviceTypes(req, res) {
    try {
      const types = await dbService.getDeviceTypes();
      return res.json({ status: 'success', data: types });
    } catch (error) {
      console.error('getDeviceTypes failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }

  async createDeviceDB(req, res) {
    try {
      const { name, manufacturer, typeId, roomId } = req.body;
      const device = await dbService.createDevice(name, manufacturer, typeId, roomId);
      return res.status(201).json({ status: 'success', data: device });
    } catch (error) {
      console.error('createDeviceDB failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }

  async updateDeviceDB(req, res) {
    try {
      const deviceId = parseInt(req.params.deviceId, 10);
      const device = await dbService.updateDevice(deviceId, req.body);
      if (!device) {
        return res.status(404).json({ status: 'error', message: 'Device not found' });
      }
      return res.json({ status: 'success', data: device });
    } catch (error) {
      console.error('updateDeviceDB failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }

  async deleteDeviceDB(req, res) {
    try {
      const deviceId = parseInt(req.params.deviceId, 10);
      await dbService.deleteDevice(deviceId);
      return res.json({ status: 'success', message: 'Device deleted' });
    } catch (error) {
      console.error('deleteDeviceDB failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Server error' });
    }
  }
}

module.exports = DeviceController;
