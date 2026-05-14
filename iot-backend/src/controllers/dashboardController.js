const dbService = require('../services/dbService');

class DashboardController {
  async getKPI(req, res) {
    try {
      const kpi = await dbService.getDashboardKPI();
      return res.json({ status: 'success', data: kpi });
    } catch (error) {
      console.error('❌ getKPI error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getSensorChart(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const data = await dbService.getSensorChartData(hours);
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getSensorChart error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getActivityChart(req, res) {
    try {
      const data = await dbService.getDeviceActivityChart();
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getActivityChart error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getSensorTrend(req, res) {
    try {
      const data = await dbService.getSensorTrend();
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getSensorTrend error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getSensorDualChart(req, res) {
    try {
      const data = await dbService.getSensorDualChart();
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getSensorDualChart error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getDailyDeviceRuntime(req, res) {
    try {
      const data = await dbService.getDailyDeviceRuntime();
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getDailyDeviceRuntime error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }

  async getActivityTimeline(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 30;
      const data = await dbService.getActivityTimeline(limit);
      return res.json({ status: 'success', data });
    } catch (error) {
      console.error('❌ getActivityTimeline error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = new DashboardController();
