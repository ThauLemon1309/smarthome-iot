import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSpaces } from '../context/SpaceContext';
import { useDevices } from '../context/DeviceContext';
import { ArrowLeft, Thermometer, Droplets, Sun, Fan, MonitorDot, Lightbulb, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { deviceApi } from '../../services/api';

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  'temperature-sensor': { label: 'Cảm biến nhiệt độ & độ ẩm', icon: Thermometer, color: 'bg-red-100 text-red-600' },
  'humidity-sensor':    { label: 'Cảm biến độ ẩm',             icon: Droplets,    color: 'bg-blue-100 text-blue-600' },
  'light-sensor':       { label: 'Cảm biến ánh sáng',           icon: Sun,         color: 'bg-yellow-100 text-yellow-600' },
  'fan':                { label: 'Quạt',                         icon: Fan,         color: 'bg-cyan-100 text-cyan-600' },
  'lcd':                { label: 'Màn hình LCD',                 icon: MonitorDot,  color: 'bg-green-100 text-green-600' },
  'rgb-led':            { label: 'Đèn LED RGB',                  icon: Lightbulb,   color: 'bg-purple-100 text-purple-600' },
};

export default function AddDevice() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { getRoomById } = useSpaces();
  const { refreshDevices } = useDevices();

  const room = getRoomById(Number(roomId!));

  const [dbTypes, setDbTypes] = useState<{ TypeID: number; Code: string }[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    deviceApi.getDeviceTypes()
      .then((res) => {
        if (res.data.status === 'success') setDbTypes(res.data.data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim() || !selectedCode) return;

    const dbType = dbTypes.find((t) => t.Code === selectedCode);
    if (!dbType) { setError('Không tìm thấy loại thiết bị'); return; }

    setSaving(true);
    setError('');
    try {
      await deviceApi.createDeviceDB({
        name: deviceName.trim(),
        typeId: dbType.TypeID,
        roomId: Number(roomId!),
      });
      await refreshDevices();
      navigate(`/room/${roomId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lỗi thêm thiết bị');
    } finally {
      setSaving(false);
    }
  };

  if (!room) return null;

  const availableTypes = dbTypes.length > 0
    ? dbTypes.filter((t) => TYPE_META[t.Code])
    : Object.keys(TYPE_META).map((code) => ({ TypeID: 0, Code: code }));

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white p-4">
        <Button variant="ghost" size="sm"
          onClick={() => navigate(`/room/${roomId}`)}
          className="text-white hover:bg-purple-700 mb-3 -ml-2">
          <ArrowLeft className="size-4 mr-1" />Quay lại
        </Button>
        <h1 className="text-2xl mb-1">Thêm thiết bị</h1>
        <p className="text-purple-100">{room.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="deviceName">Tên thiết bị</Label>
          <Input id="deviceName" placeholder="VD: Quạt phòng ngủ"
            value={deviceName} onChange={(e) => setDeviceName(e.target.value)} required />
        </div>

        <div className="space-y-3">
          <Label>Loại thiết bị</Label>
          <p className="text-xs text-gray-500">
            Thiết bị cùng loại sẽ dùng chung feed Adafruit IO — giá trị điều khiển áp dụng cho tất cả.
          </p>
          <div className="space-y-2">
            {availableTypes.map((t) => {
              const meta = TYPE_META[t.Code];
              if (!meta) return null;
              const Icon = meta.icon;
              const isSelected = selectedCode === t.Code;
              return (
                <Card key={t.Code}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected ? 'border-purple-600 border-2 bg-purple-50' : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedCode(t.Code)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${meta.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <span className={isSelected ? 'font-semibold' : ''}>{meta.label}</span>
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-purple-600 rounded-full">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={!deviceName.trim() || !selectedCode || saving}>
          {saving ? 'Đang thêm...' : 'Thêm thiết bị'}
        </Button>
      </form>
    </div>
  );
}
