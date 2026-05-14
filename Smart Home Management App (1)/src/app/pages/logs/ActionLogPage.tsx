import { useNavigate } from 'react-router';
import { useLogs } from '../../context/LogContext';
import { ArrowLeft, BookOpen, Zap, Clock as ClockIcon, Calendar, RefreshCw, Filter, Download } from 'lucide-react';
import { exportApi } from '../../../services/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useState } from 'react';
import { TriggerSource } from '../../types/log';

const TRIGGER_CONFIG: Record<string, { label: string; color: string }> = {
  MANUAL:    { label: 'Thủ công',   color: 'bg-blue-100 text-blue-700' },
  SCHEDULE:  { label: 'Lịch trình', color: 'bg-purple-100 text-purple-700' },
  AUTO_MODE: { label: 'Tự động',    color: 'bg-green-100 text-green-700' },
  RULE:      { label: 'Quy tắc',    color: 'bg-orange-100 text-orange-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: 'Thành công', color: 'bg-green-100 text-green-700' },
  FAILED:  { label: 'Thất bại',   color: 'bg-red-100 text-red-700' },
};

const PAGE_SIZE = 15;

const SOURCE_OPTIONS: { value: TriggerSource | ''; label: string }[] = [
  { value: '',          label: 'Tất cả nguồn' },
  { value: 'MANUAL',    label: 'Thủ công' },
  { value: 'SCHEDULE',  label: 'Lịch trình' },
  { value: 'AUTO_MODE', label: 'Tự động' },
  { value: 'RULE',      label: 'Quy tắc' },
];

function getDateRange() {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

export default function ActionLogPage() {
  const { logs, filter, setFilter, refresh, loading } = useLogs();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const handleExport = (format: 'xlsx' | 'csv') => {
    const { from, to } = getDateRange();
    window.open(exportApi.getActionLogsUrl(from, to, format), '_blank');
  };

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSourceChange(value: TriggerSource | '') {
    setFilter({ ...filter, source: value });
    setPage(1);
  }

  function handleStatusChange(value: 'SUCCESS' | 'FAILED' | '') {
    setFilter({ ...filter, status: value });
    setPage(1);
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-slate-600 mb-2 -ml-2">
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Nhật ký hành động</h1>
            <p className="text-slate-300 text-sm">{logs.length} bản ghi</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="text-white hover:bg-slate-600">
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('xlsx')} className="text-white hover:bg-slate-600" title="Xuất Excel">
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap">
        <Filter className="size-4 text-gray-400 mt-2 flex-shrink-0" />
        <select
          value={filter.source || ''}
          onChange={(e) => handleSourceChange(e.target.value as TriggerSource | '')}
          className="text-sm border rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filter.status || ''}
          onChange={(e) => handleStatusChange(e.target.value as 'SUCCESS' | 'FAILED' | '')}
          className="text-sm border rounded px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="FAILED">Thất bại</option>
        </select>
      </div>

      <div className="p-4 space-y-2">
        {loading && logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Đang tải...</div>
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="size-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có nhật ký nào</p>
          </div>
        ) : (
          paginatedLogs.map((log) => {
            const trigger = TRIGGER_CONFIG[log.triggerSource] || TRIGGER_CONFIG.MANUAL;
            const statusCfg = STATUS_CONFIG[log.status] || { label: log.status, color: 'bg-gray-100 text-gray-600' };
            return (
              <Card key={log.id} className="p-3 bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="size-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{log.controlDeviceName || `Thiết bị #${log.controlDeviceId}`}</p>
                      <Badge className={`text-xs ${trigger.color}`}>{trigger.label}</Badge>
                    </div>
                    {log.message && <p className="text-sm text-gray-600 mt-0.5">{log.message}</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {new Date(log.executedAt).toLocaleString('vi-VN')}
                      </span>
                      {log.scheduleName && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {log.scheduleName}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={`text-xs flex-shrink-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                </div>
              </Card>
            );
          })
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Trước
            </Button>
            <span className="text-sm text-gray-600">Trang {page}/{totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
