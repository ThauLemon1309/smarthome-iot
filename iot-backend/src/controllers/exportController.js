const ExcelJS = require('exceljs');
const dbService = require('../services/dbService');

const SOURCE_LABELS = {
  MANUAL: 'Thủ công', SCHEDULE: 'Lịch trình',
  AUTO_MODE: 'Tự động', RULE: 'Quy tắc',
};

class ExportController {
  async exportActionLogs(req, res) {
    try {
      const { from, to, format = 'xlsx' } = req.query;
      if (!from || !to) {
        return res.status(400).json({ status: 'error', message: 'Thiếu tham số from/to' });
      }

      const rows = await dbService.getActionLogsForExport(from, to);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Smart Home System';
      const sheet = workbook.addWorksheet('Nhật ký hành động');

      sheet.columns = [
        { header: 'Thời gian',        key: 'ExecutedAt',    width: 22 },
        { header: 'Thiết bị',         key: 'DeviceName',    width: 20 },
        { header: 'Nguồn kích hoạt',  key: 'TriggerSource', width: 16 },
        { header: 'Lịch trình',       key: 'ScheduleName',  width: 20 },
        { header: 'Người thực hiện',  key: 'UserName',      width: 20 },
        { header: 'Trạng thái',       key: 'Status',        width: 12 },
        { header: 'Ghi chú',          key: 'Message',       width: 35 },
      ];

      // Style header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' },
      };
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      for (const row of rows) {
        sheet.addRow({
          ExecutedAt:    new Date(row.ExecutedAt).toLocaleString('vi-VN'),
          DeviceName:    row.DeviceName || '',
          TriggerSource: SOURCE_LABELS[row.TriggerSource] || row.TriggerSource,
          ScheduleName:  row.ScheduleName || '',
          UserName:      row.UserName || '',
          Status:        row.Status === 'SUCCESS' ? 'Thành công' : 'Thất bại',
          Message:       row.Message || '',
        });
      }

      const filename = `action-logs-${from}-${to}.${format}`;
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.csv.write(res);
      } else {
        res.setHeader('Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
      }
      res.end();
    } catch (error) {
      console.error('❌ exportActionLogs error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi xuất dữ liệu' });
    }
  }

  async exportSensorData(req, res) {
    try {
      const { from, to, deviceId, format = 'xlsx' } = req.query;
      if (!from || !to) {
        return res.status(400).json({ status: 'error', message: 'Thiếu tham số from/to' });
      }

      const rows = await dbService.getSensorDataForExport(from, to, deviceId ? Number(deviceId) : null);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Smart Home System';
      const sheet = workbook.addWorksheet('Lịch sử cảm biến');

      sheet.columns = [
        { header: 'Thời gian',   key: 'Timestamp',  width: 22 },
        { header: 'Cảm biến',    key: 'DeviceName', width: 20 },
        { header: 'Loại',        key: 'SensorType', width: 20 },
        { header: 'Giá trị',     key: 'Value',      width: 12 },
        { header: 'Đơn vị',      key: 'Unit',       width: 10 },
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' },
      };

      const TYPE_LABELS = {
        'temperature-sensor': 'Nhiệt độ',
        'humidity-sensor': 'Độ ẩm',
        'light-sensor': 'Ánh sáng',
      };

      for (const row of rows) {
        sheet.addRow({
          Timestamp:  new Date(row.Timestamp).toLocaleString('vi-VN'),
          DeviceName: row.DeviceName || '',
          SensorType: TYPE_LABELS[row.SensorType] || row.SensorType,
          Value:      row.Value,
          Unit:       row.Unit || '',
        });
      }

      const filename = `sensor-data-${from}-${to}.${format}`;
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.csv.write(res);
      } else {
        res.setHeader('Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
      }
      res.end();
    } catch (error) {
      console.error('❌ exportSensorData error:', error.message);
      return res.status(500).json({ status: 'error', message: 'Lỗi xuất dữ liệu' });
    }
  }
}

module.exports = new ExportController();
