const adafruitConfig = require('../config/adafruit');
const dbService = require('./dbService');

// Map từ DeviceType.Code → Adafruit feed
const FEED_MAP = {
  'fan':     adafruitConfig.feeds.fan,
  'rgb-led': adafruitConfig.feeds.rgb,
  'lcd':     adafruitConfig.feeds.lcd,
};

class ScheduleExecutorService {
  constructor(adafruitService, deviceController) {
    this.adafruitService = adafruitService;
    this.deviceController = deviceController;
    this.intervalId = null;
    // Tránh chạy lại trong cùng 1 phút: scheduleId → 'YYYY-MM-DD HH:MM'
    this.lastExecuted = new Map();
  }

  _currentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  _currentDay() {
    // Trả về 'mon','tue','wed','thu','fri','sat','sun'
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
  }

  _minuteKey() {
    return `${new Date().toDateString()} ${this._currentTime()}`;
  }

  _shouldRun(schedule) {
    // Kiểm tra time khớp
    if (schedule.Time !== this._currentTime()) return false;

    // Tránh chạy 2 lần trong cùng phút
    if (this.lastExecuted.get(schedule.ScheduleID) === this._minuteKey()) return false;

    // Kiểm tra ngày (weekly)
    const type = (schedule.RepeatType || '').toLowerCase();
    if (type === 'weekly') {
      const days = (schedule.RepeatDay || '').split(',').map((d) => d.trim());
      if (!days.includes(this._currentDay())) return false;
    }
    // 'daily' → chạy mỗi ngày, không cần kiểm tra ngày

    return true;
  }

  _stopValue(typeCode) {
    if (typeCode === 'fan') return 0;
    if (typeCode === 'rgb-led') return 0;
    if (typeCode === 'lcd') return '';
    return 0;
  }

  async _executeAction(action, scheduleId, durationMinutes) {
    const { ActionDefID, ControlID, TypeCode, parameters } = action;
    const feedName = FEED_MAP[TypeCode];
    if (!feedName || !parameters?.length) return;

    // Schedule bị chặn nếu có MANUAL lock cao hơn
    if (this.deviceController.isLocked(TypeCode, 'SCHEDULE')) {
      console.log(`🔒 Schedule #${scheduleId}: ${TypeCode} bị khoá bởi manual, bỏ qua`);
      return;
    }

    const param = parameters[0];
    const value = TypeCode === 'lcd' ? param.ParamValue : Number(param.ParamValue);

    try {
      await this.adafruitService.sendData(feedName, value);

      // Đặt schedule lock → auto mode không ghi đè trong 5 phút
      this.deviceController.setLock(TypeCode, 'SCHEDULE');

      if (TypeCode === 'fan') this.deviceController.deviceState.fanSpeed = value;
      else if (TypeCode === 'rgb-led') this.deviceController.deviceState.ledLevel = value;
      else if (TypeCode === 'lcd') this.deviceController.deviceState.lcdText = String(value);
      this.deviceController.deviceState.updatedAt = new Date().toISOString();
      this.deviceController.emitEvent('state', this.deviceController.deviceState);

      await dbService.logAction(
        ActionDefID, ControlID, 'SCHEDULE', scheduleId, 'SUCCESS',
        `Lịch trình: ${param.ParamName}=${param.ParamValue}`
      );

      console.log(`📅 Schedule #${scheduleId}: ${TypeCode} → ${value}`);
      dbService.logActivity('SCHEDULE', `[Thực thi lịch #${scheduleId}] ${TypeCode} → ${value}`).catch(() => {});

      // Tự tắt sau DurationMinutes nếu được cấu hình
      if (durationMinutes > 0) {
        setTimeout(async () => {
          try {
            const stopVal = this._stopValue(TypeCode);
            await this.adafruitService.sendData(feedName, stopVal);
            if (TypeCode === 'fan') this.deviceController.deviceState.fanSpeed = stopVal;
            else if (TypeCode === 'rgb-led') this.deviceController.deviceState.ledLevel = stopVal;
            else if (TypeCode === 'lcd') this.deviceController.deviceState.lcdText = '';
            this.deviceController.deviceState.updatedAt = new Date().toISOString();
            this.deviceController.emitEvent('state', this.deviceController.deviceState);
            console.log(`⏹️  Schedule #${scheduleId}: ${TypeCode} tự tắt sau ${durationMinutes} phút`);
            dbService.logActivity('SCHEDULE', `[Tắt tự động lịch #${scheduleId}] ${TypeCode} → ${stopVal}`).catch(() => {});
          } catch (e) {
            console.error(`❌ Schedule #${scheduleId} auto-stop failed:`, e.message);
          }
        }, durationMinutes * 60 * 1000);
      }
    } catch (error) {
      await dbService.logAction(ActionDefID, ControlID, 'SCHEDULE', scheduleId, 'FAILED', error.message).catch(() => {});
      console.error(`❌ Schedule #${scheduleId} execute failed:`, error.message);
    }
  }

  async checkAndExecute() {
    try {
      const schedules = await dbService.getActiveSchedulesForExecution();
      for (const schedule of schedules) {
        if (!this._shouldRun(schedule)) continue;

        // Đánh dấu đã chạy phút này
        this.lastExecuted.set(schedule.ScheduleID, this._minuteKey());
        // Giới hạn Map để tránh memory leak
        if (this.lastExecuted.size > 200) {
          const first = this.lastExecuted.keys().next().value;
          this.lastExecuted.delete(first);
        }

        const dur = schedule.DurationMinutes || 0;
        console.log(`📅 Thực thi lịch trình: "${schedule.Name}" lúc ${schedule.Time}${dur ? ` (${dur} phút)` : ''}`);
        for (const action of schedule.actions) {
          await this._executeAction(action, schedule.ScheduleID, dur);
        }
      }
    } catch (error) {
      console.error('❌ ScheduleExecutor error:', error.message);
    }
  }

  start() {
    if (this.intervalId) return;
    console.log('📅 ScheduleExecutor: bắt đầu kiểm tra lịch trình (mỗi 60 giây)');
    this.checkAndExecute();
    this.intervalId = setInterval(() => this.checkAndExecute(), 60000);
  }

  stop() {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    console.log('📅 ScheduleExecutor: đã dừng');
  }
}

module.exports = ScheduleExecutorService;
