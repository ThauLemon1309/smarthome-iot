const dbService = require('../services/dbService');

class AlertController {
  constructor(thresholdAlertService) {
    this.thresholdAlertService = thresholdAlertService;
  }

  async getRules(req, res) {
    try {
      const rules = await dbService.getThresholdRules();
      return res.json({ status: 'success', data: rules });
    } catch (error) {
      console.error('❌ getRules:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async createRule(req, res) {
    try {
      const { sensorId, operator, thresholdValue, cooldownSeconds } = req.body;
      if (!sensorId || !operator || thresholdValue === undefined) {
        return res.status(400).json({ status: 'error', message: 'Thiếu sensorId, operator hoặc thresholdValue' });
      }
      if (!['>','<','>=','<='].includes(operator)) {
        return res.status(400).json({ status: 'error', message: 'Operator không hợp lệ (dùng: >, <, >=, <=)' });
      }
      const rule = await dbService.createThresholdRule(sensorId, operator, Number(thresholdValue), cooldownSeconds || 300);
      this.thresholdAlertService?.invalidateRuleCache();
      return res.status(201).json({ status: 'success', data: rule });
    } catch (error) {
      console.error('❌ createRule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async deleteRule(req, res) {
    try {
      const ruleId = parseInt(req.params.ruleId);
      await dbService.deleteThresholdRule(ruleId);
      this.thresholdAlertService?.invalidateRuleCache();
      return res.json({ status: 'success', message: 'Đã xóa quy tắc' });
    } catch (error) {
      console.error('❌ deleteRule:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getAlerts(req, res) {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 50, 200);
      const alerts = await dbService.getAlerts(limit);
      return res.json({ status: 'success', data: alerts });
    } catch (error) {
      console.error('❌ getAlerts:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async markAllRead(req, res) {
    try {
      await dbService.markAllAlertsRead();
      return res.json({ status: 'success', message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async markRead(req, res) {
    try {
      const alertId = parseInt(req.params.alertId);
      await dbService.markAlertRead(alertId);
      return res.json({ status: 'success', message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = AlertController;
