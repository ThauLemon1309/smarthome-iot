import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { autoModeApi } from '../../../services/api';

interface AutoModeConfig {
  FanTempLow: number;
  FanTempMid: number;
  FanTempHigh: number;
  FanSpeed1: number;
  FanSpeed2: number;
  FanSpeed3: number;
  HumiThreshold: number;
  HumiBoost: number;
  LedBrigOff: number;
  LedBrigYellow: number;
}

const DEFAULTS: AutoModeConfig = {
  FanTempLow: 25, FanTempMid: 28, FanTempHigh: 32,
  FanSpeed1: 30, FanSpeed2: 60, FanSpeed3: 100,
  HumiThreshold: 70, HumiBoost: 20,
  LedBrigOff: 60, LedBrigYellow: 40,
};

function NumInput({ label, value, onChange, unit, min, max }: {
  label: string; value: number; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="flex-1 text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number" min={min} max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 text-center text-sm h-8"
        />
        {unit && <span className="text-xs text-gray-500 w-6">{unit}</span>}
      </div>
    </div>
  );
}

export default function AutoModeConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AutoModeConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    autoModeApi.getConfig()
      .then((res) => setConfig(res.data.data))
      .catch(() => setError('Không thể tải cấu hình, dùng giá trị mặc định'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof AutoModeConfig) => (v: number) =>
    setConfig((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await autoModeApi.updateConfig(config);
      setConfig(res.data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Lưu thất bại, kiểm tra lại kết nối server');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setConfig(DEFAULTS);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="text-gray-500 text-sm">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-blue-800 mb-2 -ml-2">
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-xl font-bold">Cài đặt chế độ tự động</h1>
        <p className="text-sm text-blue-100 mt-1">Điều chỉnh ngưỡng điều khiển quạt và đèn</p>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            Đã lưu cấu hình thành công!
          </div>
        )}

        {/* Quạt - Nhiệt độ */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🌀</span> Ngưỡng nhiệt độ → Quạt
          </h2>
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-0.5">
            <div>Nhiệt độ &lt; <strong>{config.FanTempLow}°C</strong> → Quạt 0%</div>
            <div>{config.FanTempLow}°C ≤ nhiệt độ &lt; <strong>{config.FanTempMid}°C</strong> → Quạt {config.FanSpeed1}%</div>
            <div>{config.FanTempMid}°C ≤ nhiệt độ &lt; <strong>{config.FanTempHigh}°C</strong> → Quạt {config.FanSpeed2}%</div>
            <div>Nhiệt độ ≥ <strong>{config.FanTempHigh}°C</strong> → Quạt {config.FanSpeed3}%</div>
          </div>
          <div className="space-y-2">
            <NumInput label="Ngưỡng thấp (quạt 0% → mức 1)" value={config.FanTempLow} onChange={set('FanTempLow')} unit="°C" min={0} max={50} />
            <NumInput label="Ngưỡng giữa (mức 1 → mức 2)" value={config.FanTempMid} onChange={set('FanTempMid')} unit="°C" min={0} max={50} />
            <NumInput label="Ngưỡng cao (mức 2 → mức 3)" value={config.FanTempHigh} onChange={set('FanTempHigh')} unit="°C" min={0} max={50} />
          </div>
          <div className="border-t pt-2 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Tốc độ quạt mỗi mức</p>
            <NumInput label="Mức 1" value={config.FanSpeed1} onChange={set('FanSpeed1')} unit="%" min={0} max={100} />
            <NumInput label="Mức 2" value={config.FanSpeed2} onChange={set('FanSpeed2')} unit="%" min={0} max={100} />
            <NumInput label="Mức 3 (tối đa)" value={config.FanSpeed3} onChange={set('FanSpeed3')} unit="%" min={0} max={100} />
          </div>
        </Card>

        {/* Quạt - Độ ẩm */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">💧</span> Điều chỉnh theo độ ẩm
          </h2>
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Độ ẩm &gt; <strong>{config.HumiThreshold}%</strong> → quạt cộng thêm <strong>{config.HumiBoost}%</strong> (tối đa 100%)
          </div>
          <div className="space-y-2">
            <NumInput label="Ngưỡng độ ẩm" value={config.HumiThreshold} onChange={set('HumiThreshold')} unit="%" min={0} max={100} />
            <NumInput label="Tăng thêm" value={config.HumiBoost} onChange={set('HumiBoost')} unit="%" min={0} max={100} />
          </div>
        </Card>

        {/* Đèn - Ánh sáng */}
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">💡</span> Ngưỡng ánh sáng → Đèn
          </h2>
          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 space-y-0.5">
            <div>Ánh sáng &gt; <strong>{config.LedBrigOff}%</strong> → Tắt đèn</div>
            <div>{config.LedBrigYellow}% ≤ ánh sáng ≤ {config.LedBrigOff}% → Đèn vàng (mức 1)</div>
            <div>Ánh sáng &lt; <strong>{config.LedBrigYellow}%</strong> → Đèn trắng (mức 2)</div>
          </div>
          <div className="space-y-2">
            <NumInput label="Ngưỡng tắt đèn (trên)" value={config.LedBrigOff} onChange={set('LedBrigOff')} unit="%" min={0} max={100} />
            <NumInput label="Ngưỡng đèn vàng (dưới)" value={config.LedBrigYellow} onChange={set('LedBrigYellow')} unit="%" min={0} max={100} />
          </div>
        </Card>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            <RotateCcw className="size-4 mr-2" /> Đặt lại mặc định
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
            <Save className="size-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  );
}
