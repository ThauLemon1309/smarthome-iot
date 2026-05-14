const dbService = require('../services/dbService');

class AutoModeConfigController {
  constructor(autoModeService) {
    this.autoModeService = autoModeService;
  }

  async getConfig(req, res) {
    try {
      const config = await dbService.getAutoModeConfig();
      return res.json({ status: 'success', data: config });
    } catch (error) {
      console.error('getConfig failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Không thể đọc cấu hình' });
    }
  }

  async updateConfig(req, res) {
    try {
      const allowed = ['FanTempLow','FanTempMid','FanTempHigh','FanSpeed1','FanSpeed2','FanSpeed3','HumiThreshold','HumiBoost','LedBrigOff','LedBrigYellow'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates[key] = Number(req.body[key]);
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ status: 'error', message: 'Không có trường nào hợp lệ để cập nhật' });
      }

      const config = await dbService.updateAutoModeConfig(updates);

      // Thông báo cho autoModeService reload config trong chu kỳ tiếp theo
      if (this.autoModeService) {
        this.autoModeService.markConfigDirty();
      }

      dbService.logActivity('CONFIG', `Cập nhật cấu hình chế độ tự động`).catch(() => {});
      return res.json({ status: 'success', data: config });
    } catch (error) {
      console.error('updateConfig failed:', error.message);
      return res.status(500).json({ status: 'error', message: 'Không thể cập nhật cấu hình' });
    }
  }
}

module.exports = AutoModeConfigController;
