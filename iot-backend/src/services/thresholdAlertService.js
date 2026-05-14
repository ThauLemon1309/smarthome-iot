const dbService = require('./dbService');

const RULE_RELOAD_MS = 60_000; // reload rules từ DB mỗi 60s

class ThresholdAlertService {
  constructor(deviceController) {
    this.deviceController = deviceController;
    this.rules = [];
    this.lastRuleLoad = 0;
    // ruleId → số lần vi phạm liên tiếp
    this.violationCounts = {};
  }

  // Gọi từ alertController khi user thêm/xóa rule để buộc reload ngay
  invalidateRuleCache() {
    this.lastRuleLoad = 0;
  }

  async _loadRules() {
    if (Date.now() - this.lastRuleLoad < RULE_RELOAD_MS) return;
    try {
      this.rules = await dbService.getThresholdRules();
      this.lastRuleLoad = Date.now();
      console.log(`🔔 ThresholdAlert: đã tải ${this.rules.length} quy tắc ngưỡng`);
    } catch {
      // giữ rules cũ nếu lỗi DB
    }
  }

  _getSensorValue(typeCode, sensorValues) {
    if (typeCode === 'temperature-sensor') return sensorValues.temperature;
    if (typeCode === 'humidity-sensor')    return sensorValues.humidity;
    if (typeCode === 'light-sensor')       return sensorValues.brightness;
    return null;
  }

  _isViolated(value, operator, threshold) {
    if (value === null || value === undefined) return false;
    if (operator === '>')  return value > threshold;
    if (operator === '<')  return value < threshold;
    if (operator === '>=') return value >= threshold;
    if (operator === '<=') return value <= threshold;
    return false;
  }

  // Gọi mỗi chu kỳ autoMode (10s) với giá trị cảm biến hiện tại
  async checkRules(sensorValues) {
    await this._loadRules();
    const now = Date.now();

    for (const rule of this.rules) {
      const { RuleID, SensorID, SensorTypeCode, SensorName, Operator, ThresholdValue, CooldownSeconds, LastTriggerAt } = rule;
      const value = this._getSensorValue(SensorTypeCode, sensorValues);

      const violated = this._isViolated(value, Operator, ThresholdValue);

      if (!violated) {
        this.violationCounts[RuleID] = 0;
        continue;
      }

      this.violationCounts[RuleID] = (this.violationCounts[RuleID] || 0) + 1;
      console.log(`⚠️  Rule ${RuleID}: ${SensorName} ${Operator} ${ThresholdValue} (lần ${this.violationCounts[RuleID]}/3, giá trị=${value})`);

      // Chưa đủ 3 lần liên tiếp
      if (this.violationCounts[RuleID] < 3) continue;

      // Kiểm tra cooldown
      const lastTriggerMs = LastTriggerAt ? new Date(LastTriggerAt).getTime() : 0;
      const cooldownMs = (CooldownSeconds || 300) * 1000;
      if (now - lastTriggerMs < cooldownMs) {
        console.log(`⏳ Rule ${RuleID}: còn trong cooldown (${Math.round((cooldownMs - (now - lastTriggerMs)) / 1000)}s)`);
        continue;
      }

      // Reset đếm và kích hoạt cảnh báo
      this.violationCounts[RuleID] = 0;

      const sensorLabel = SensorTypeCode === 'temperature-sensor' ? 'Nhiệt độ'
        : SensorTypeCode === 'humidity-sensor' ? 'Độ ẩm'
        : 'Ánh sáng';
      const unit = SensorTypeCode === 'temperature-sensor' ? '°C' : '%';
      const opLabel = Operator === '>' || Operator === '>=' ? 'vượt quá' : 'thấp hơn';
      const message = `${sensorLabel} ${opLabel} ngưỡng ${ThresholdValue}${unit} (hiện tại: ${value}${unit})`;

      try {
        const alert = await dbService.saveAlert(RuleID, SensorID, message, 'WARNING');
        await dbService.updateRuleLastTrigger(RuleID);
        // Cập nhật cache cục bộ để cooldown có hiệu lực ngay
        rule.LastTriggerAt = new Date().toISOString();

        // Emit SSE → frontend nhận ngay
        this.deviceController.emitEvent('alert', {
          id: alert.AlertID,
          ruleId: RuleID,
          sensorId: SensorID,
          sensorName: SensorName,
          message,
          level: 'WARNING',
          createdAt: alert.CreatedAt || new Date().toISOString(),
          isRead: false,
        });

        console.log(`🚨 Cảnh báo ngưỡng: ${message}`);
        dbService.logActivity('ALERT', message).catch(() => {});
      } catch (err) {
        console.error('❌ ThresholdAlert: lỗi khi lưu cảnh báo:', err.message);
      }
    }
  }
}

module.exports = ThresholdAlertService;
