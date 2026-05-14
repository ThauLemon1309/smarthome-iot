const dbService = require('../services/dbService');

class LogController {
  // GET /api/logs
  async getLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const source = req.query.source || null;
      const status = req.query.status || null;
      const logs = await dbService.getActionLogs(limit, source, status);
      return res.json({ status: 'success', data: logs });
    } catch (error) {
      console.error('❌ Lỗi getLogs:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
  }
}

module.exports = new LogController();
