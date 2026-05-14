import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useSchedules } from '../../context/ScheduleContext';
import { useDevices } from '../../context/DeviceContext';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const DAYS = [
  { key: 'mon', label: 'T2' }, { key: 'tue', label: 'T3' },
  { key: 'wed', label: 'T4' }, { key: 'thu', label: 'T5' },
  { key: 'fri', label: 'T6' }, { key: 'sat', label: 'T7' },
  { key: 'sun', label: 'CN' },
];

function ActionValueInput({
  typeCode,
  value,
  onChange,
}: {
  typeCode: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (typeCode === 'fan') {
    return (
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tốc độ quạt</span>
          <span className="font-semibold text-purple-700">{value}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Tắt (0%)</span><span>Tối đa (100%)</span>
        </div>
      </div>
    );
  }
  if (typeCode === 'rgb-led') {
    return (
      <div className="mt-2">
        <Label className="text-sm text-gray-600">Mức đèn</Label>
        <select
          className="w-full rounded-md border border-gray-300 p-2 text-sm mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="0">0 — Tắt</option>
          <option value="1">1 — Vàng (trung bình)</option>
          <option value="2">2 — Trắng (sáng)</option>
        </select>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <Label className="text-sm text-gray-600">Nội dung hiển thị</Label>
      <Input
        className="mt-1"
        placeholder="VD: Chào buổi sáng"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function ScheduleEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schedules, updateSchedule } = useSchedules();
  const { devices } = useDevices();

  const schedule = schedules.find((s) => s.id === Number(id));

  const firstAction = schedule?.actions[0];
  const firstParam = firstAction?.parameters[0];
  const controlDevice = devices.find((d) => d.id === firstAction?.controlDeviceId);

  const [name, setName] = useState(schedule?.name || '');
  const [time, setTime] = useState(schedule?.time || '08:00');
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>(
    (schedule?.repeatType as 'daily' | 'weekly') || 'weekly'
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    schedule?.repeatDay ? schedule.repeatDay.split(',').map((d) => d.trim()) : []
  );
  const [paramValue, setParamValue] = useState(firstParam?.paramValue || '');

  if (!schedule) {
    return (
      <div className="p-6 text-center text-gray-500">
        Không tìm thấy lịch trình.
        <Button className="mt-4 block mx-auto" onClick={() => navigate('/schedules')}>
          Quay lại
        </Button>
      </div>
    );
  }

  const typeCode = controlDevice?.typeCode || 'fan';

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    updateSchedule(schedule.id, {
      name: name.trim(),
      time,
      repeatType,
      repeatDay: repeatType === 'weekly' ? selectedDays.join(',') : undefined,
      paramValue,
    } as any);
    navigate('/schedules');
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-purple-800 mb-2 -ml-2"
        >
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-xl font-bold">Chỉnh sửa lịch trình</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Name */}
        <Card className="p-4">
          <Label>Tên lịch trình</Label>
          <Input
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Card>

        {/* Time */}
        <Card className="p-4">
          <Label>Thời gian thực hiện</Label>
          <Input
            className="mt-1"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Card>

        {/* Repeat Type */}
        <Card className="p-4">
          <Label>Loại lặp lại</Label>
          <div className="flex gap-2 mt-2">
            {(['daily', 'weekly'] as const).map((rt) => (
              <button
                key={rt}
                onClick={() => setRepeatType(rt)}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition ${
                  repeatType === rt
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                }`}
              >
                {rt === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
              </button>
            ))}
          </div>

          {repeatType === 'weekly' && (
            <div className="mt-3">
              <Label className="text-sm text-gray-500">Chọn ngày</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DAYS.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleDay(day.key)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition ${
                      selectedDays.includes(day.key)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Device (read-only) */}
        <Card className="p-4 bg-gray-50">
          <Label className="text-gray-500">Thiết bị (không thể thay đổi)</Label>
          <p className="mt-1 text-sm font-medium">{controlDevice?.name || `Device #${firstAction?.controlDeviceId}`}</p>
        </Card>

        {/* Action Value */}
        <Card className="p-4">
          <Label>Giá trị điều khiển</Label>
          <ActionValueInput typeCode={typeCode} value={paramValue} onChange={setParamValue} />
        </Card>

        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handleSubmit}
          disabled={!name.trim() || (repeatType === 'weekly' && selectedDays.length === 0)}
        >
          <Save className="size-4 mr-2" /> Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}
