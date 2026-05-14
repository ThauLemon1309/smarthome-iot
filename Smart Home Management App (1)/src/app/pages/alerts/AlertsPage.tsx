import { useState } from 'react';
import { Bell, Plus, Trash2, CheckCheck, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { useDevices } from '../../context/DeviceContext';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const SENSOR_TYPE_CODES = ['temperature-sensor', 'humidity-sensor', 'light-sensor'];
const SENSOR_LABELS: Record<string, string> = {
  'temperature-sensor': 'Nhiệt độ (°C)',
  'humidity-sensor': 'Độ ẩm (%)',
  'light-sensor': 'Ánh sáng (%)',
};
const OPERATORS = ['>', '<', '>=', '<='];
const OPERATOR_LABELS: Record<string, string> = {
  '>': 'Lớn hơn (>)', '<': 'Nhỏ hơn (<)', '>=': 'Lớn hơn hoặc bằng (≥)', '<=': 'Nhỏ hơn hoặc bằng (≤)',
};

export default function AlertsPage() {
  const { rules, alerts, unreadCount, loadingRules, createRule, deleteRule, markAllRead, markRead } = useAlerts();
  const { devices } = useDevices();
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ sensorId: '', operator: '>', thresholdValue: '', cooldownSeconds: '300' });

  const sensorDevices = devices.filter((d) => SENSOR_TYPE_CODES.includes(d.typeCode ?? ''));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sensorId || !form.thresholdValue) return;
    setSaving(true);
    try {
      await createRule({
        sensorId: Number(form.sensorId),
        operator: form.operator,
        thresholdValue: Number(form.thresholdValue),
        cooldownSeconds: Number(form.cooldownSeconds) || 300,
      });
      setShowAdd(false);
      setForm({ sensorId: '', operator: '>', thresholdValue: '', cooldownSeconds: '300' });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white p-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Bell className="size-6" />
            <div>
              <h1 className="text-xl font-bold">Cảnh báo ngưỡng</h1>
              <p className="text-orange-100 text-sm">{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Không có cảnh báo mới'}</p>
            </div>
          </div>
          {tab === 'alerts' && unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="text-white hover:bg-orange-600" onClick={markAllRead}>
              <CheckCheck className="size-4 mr-1" />Đọc tất cả
            </Button>
          )}
          {tab === 'rules' && (
            <Button size="sm" variant="ghost" className="text-white hover:bg-orange-600" onClick={() => setShowAdd(true)}>
              <Plus className="size-4 mr-1" />Thêm quy tắc
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {(['alerts', 'rules'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? 'bg-white text-orange-600' : 'text-orange-100 hover:bg-orange-600'}`}>
              {t === 'alerts' ? `Lịch sử cảnh báo` : `Quy tắc (${rules.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* ===== TAB: ALERTS ===== */}
        {tab === 'alerts' && (
          <>
            {alerts.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <ShieldCheck className="size-14 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chưa có cảnh báo nào</p>
                <p className="text-sm mt-1">Hệ thống đang theo dõi các quy tắc ngưỡng</p>
              </div>
            )}
            {alerts.map((alert) => (
              <Card key={alert.AlertID}
                className={`p-4 border-l-4 ${alert.IsRead ? 'border-l-gray-300 opacity-70' : 'border-l-orange-500'}`}
                onClick={() => !alert.IsRead && markRead(alert.AlertID)}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`size-5 mt-0.5 flex-shrink-0 ${alert.IsRead ? 'text-gray-400' : 'text-orange-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${alert.IsRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{alert.Message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(alert.CreatedAt)}</p>
                  </div>
                  {!alert.IsRead && <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />}
                </div>
              </Card>
            ))}
          </>
        )}

        {/* ===== TAB: RULES ===== */}
        {tab === 'rules' && (
          <>
            {/* Add rule form */}
            {showAdd && (
              <Card className="p-4 border-2 border-orange-300">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Thêm quy tắc ngưỡng</h2>
                  <button onClick={() => setShowAdd(false)}><X className="size-4 text-gray-500" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <Label>Cảm biến</Label>
                    <select className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      value={form.sensorId} onChange={(e) => setForm((f) => ({ ...f, sensorId: e.target.value }))} required>
                      <option value="">-- Chọn cảm biến --</option>
                      {sensorDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({SENSOR_LABELS[d.typeCode ?? ''] ?? d.typeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2/5">
                      <Label>Toán tử</Label>
                      <select className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                        value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value }))}>
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label>Ngưỡng</Label>
                      <Input className="mt-1" type="number" step="0.1" placeholder="VD: 35"
                        value={form.thresholdValue} onChange={(e) => setForm((f) => ({ ...f, thresholdValue: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <Label>Cooldown (giây)</Label>
                    <Input className="mt-1" type="number" min="60" step="60"
                      value={form.cooldownSeconds} onChange={(e) => setForm((f) => ({ ...f, cooldownSeconds: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-0.5">Thời gian chờ tối thiểu giữa 2 cảnh báo cùng quy tắc</p>
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu quy tắc'}
                  </Button>
                </form>
              </Card>
            )}

            {/* Rules list */}
            {!loadingRules && rules.length === 0 && !showAdd && (
              <div className="text-center py-16 text-gray-400">
                <Bell className="size-14 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Chưa có quy tắc nào</p>
                <p className="text-sm mt-1">Nhấn "Thêm quy tắc" để thiết lập ngưỡng cảnh báo</p>
              </div>
            )}
            {rules.map((rule) => {
              const sensorTypeLabel = SENSOR_LABELS[rule.SensorTypeCode] ?? rule.SensorTypeCode;
              return (
                <Card key={rule.RuleID} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{rule.SensorName}</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {sensorTypeLabel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        Cảnh báo khi{' '}
                        <span className="font-semibold text-orange-600">
                          {rule.Operator} {rule.ThresholdValue}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Cần vi phạm liên tục 3 chu kỳ · Cooldown {rule.CooldownSeconds}s
                        {rule.LastTriggerAt && ` · Lần cuối: ${formatTime(rule.LastTriggerAt)}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 flex-shrink-0"
                      onClick={() => deleteRule(rule.RuleID)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
