const dbService = require('../services/dbService');
const adafruitConfig = require('../config/adafruit');

const FEED_MAP = {
  'fan':     adafruitConfig.feeds.fan,
  'rgb-led': adafruitConfig.feeds.rgb,
  'lcd':     adafruitConfig.feeds.lcd,
};

const STOP_VALUE = {
  'fan':     0,
  'rgb-led': 0,
  'lcd':     '',
};

class ScheduleController {
  constructor(deviceController) {
    this.deviceController = deviceController;
  }

  async getSchedules(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      const schedules = await dbService.getSchedules(userId);
      return res.json({ status: 'success', data: schedules });
    } catch (error) {
      console.error('❌ Lỗi getSchedules:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async createSchedule(req, res) {
    try {
      const { name, repeatType, repeatDay, specificDays, applyLevel, status, createdBy, time, durationMinutes, actions } = req.body;
      const schedule = await dbService.createSchedule(
        name, repeatType, repeatDay, specificDays, applyLevel, status || 'active', createdBy, time, durationMinutes ?? null, actions
      );
      dbService.logActivity('SCHEDULE', `Tạo lịch trình "${name}" lúc ${time || '?'} (${repeatType})`).catch(() => {});
      return res.status(201).json({ status: 'success', data: schedule });
    } catch (error) {
      console.error('❌ Lỗi createSchedule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async updateSchedule(req, res) {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const { paramValue, ...scheduleFields } = req.body;

      const schedule = await dbService.updateSchedule(scheduleId, scheduleFields);
      if (!schedule) {
        return res.status(404).json({ status: 'error', message: 'Schedule không tồn tại' });
      }

      if (paramValue !== undefined) {
        await dbService.updateScheduleActionParam(scheduleId, paramValue);
      }

      dbService.logActivity('SCHEDULE', `Cập nhật lịch trình #${scheduleId}`).catch(() => {});
      return res.json({ status: 'success', data: schedule });
    } catch (error) {
      console.error('❌ Lỗi updateSchedule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const scheduleId = parseInt(req.params.scheduleId);

      // Lấy danh sách TypeCode mà lịch này điều khiển
      const actions = await dbService.getScheduleActionsWithType(scheduleId);
      const typeCodes = [...new Set(actions.map((a) => a.TypeCode).filter(Boolean))];

      // Gửi lệnh stop cho các thiết bị đang bật bởi lịch này
      for (const typeCode of typeCodes) {
        const feedName = FEED_MAP[typeCode];
        const stopVal = STOP_VALUE[typeCode];
        if (!feedName) continue;

        const dc = this.deviceController;
        try {
          await dc.adafruitService.sendData(feedName, stopVal);

          if (typeCode === 'fan') dc.deviceState.fanSpeed = 0;
          else if (typeCode === 'rgb-led') dc.deviceState.ledLevel = 0;
          else if (typeCode === 'lcd') dc.deviceState.lcdText = '';
          dc.deviceState.updatedAt = new Date().toISOString();
          dc.emitEvent('state', dc.deviceState);

          console.log(`🛑 Xóa lịch #${scheduleId}: tắt ${typeCode}`);
          dbService.logActivity('SCHEDULE', `[Xóa lịch #${scheduleId}] ${typeCode} → tắt`).catch(() => {});
        } catch (e) {
          console.error(`❌ Stop ${typeCode} on delete failed:`, e.message);
        }
      }

      await dbService.deleteSchedule(scheduleId);
      dbService.logActivity('SCHEDULE', `Xóa lịch trình #${scheduleId}`).catch(() => {});
      return res.json({ status: 'success', message: 'Đã xóa lịch trình' });
    } catch (error) {
      console.error('❌ Lỗi deleteSchedule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async toggleSchedule(req, res) {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const { status } = req.body;
      const newStatus = status === 'active' ? 'inactive' : 'active';
      const schedule = await dbService.updateSchedule(scheduleId, { status: newStatus });
      dbService.logActivity('SCHEDULE', `Lịch trình #${scheduleId} → ${newStatus === 'active' ? 'bật' : 'tắt'}`).catch(() => {});
      return res.json({ status: 'success', data: schedule });
    } catch (error) {
      console.error('❌ Lỗi toggleSchedule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = ScheduleController;
