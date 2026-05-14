import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSchedules } from '../../context/ScheduleContext';
import { useDevices } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type { Schedule, ApplyLevel } from '../../types/schedule';

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
      <div className="mt-2 space-y-1">
        <Label className="text-sm text-gray-600">Mức đèn</Label>
        <select
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
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

export default function ScheduleFormPage() {
  const navigate = useNavigate();
  const { addSchedule } = useSchedules();
  const { devices } = useDevices();
  const { user } = useAuth();

  const controlDevices = devices.filter((d) => d.category === 'control');

  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [applyLevel] = useState<ApplyLevel>('DEVICE');
  const [targetDeviceId, setTargetDeviceId] = useState<number>(0);
  const [paramValue, setParamValue] = useState('80');
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);

  // Gán thiết bị đầu tiên khi devices load xong
  useEffect(() => {
    if (targetDeviceId === 0 && controlDevices.length > 0) {
      setTargetDeviceId(controlDevices[0].id);
    }
  }, [controlDevices]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectedDevice = devices.find((d) => d.id === targetDeviceId);
  const typeCode = selectedDevice?.typeCode || 'fan';
  const paramName = typeCode === 'fan' ? 'fanSpeed' : typeCode === 'rgb-led' ? 'ledLevel' : 'lcdText';

  const handleDeviceChange = (id: number) => {
    setTargetDeviceId(id);
    const dev = devices.find((d) => d.id === id);
    if (dev?.typeCode === 'fan') setParamValue('80');
    else if (dev?.typeCode === 'rgb-led') setParamValue('1');
    else setParamValue('');
  };

  const handleSubmit = () => {
    if (!name.trim() || !targetDeviceId) return;

    const newSchedule: Omit<Schedule, 'id'> = {
      name: name.trim(),
      repeatType,
      repeatDay: repeatType === 'weekly' ? selectedDays.join(',') : undefined,
      time,
      durationMinutes,
      applyLevel,
      status: 'active',
      createdBy: user?.id || 1,
      updatedAt: new Date().toISOString(),
      actions: [{
        id: Date.now(),
        controlDeviceId: targetDeviceId,
        actionType: 'SET',
        parameters: [{ paramName, paramValue }],
        createdAt: new Date().toISOString(),
      }],
    };

    addSchedule(newSchedule);
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
        <h1 className="text-xl font-bold">Tạo lịch trình mới</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Name */}
        <Card className="p-4">
          <Label>Tên lịch trình</Label>
          <Input
            className="mt-1"
            placeholder="VD: Bật quạt buổi trưa"
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

        {/* Duration */}
        <Card className="p-4">
          <Label>Chạy trong bao lâu</Label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
            value={durationMinutes ?? ''}
            onChange={(e) => setDurationMinutes(e.target.value === '' ? undefined : Number(e.target.value))}
          >
            <option value="">Không giới hạn</option>
            <option value="5">5 phút</option>
            <option value="10">10 phút</option>
            <option value="15">15 phút</option>
            <option value="20">20 phút</option>
            <option value="30">30 phút</option>
            <option value="45">45 phút</option>
            <option value="60">1 giờ</option>
            <option value="90">1 giờ 30 phút</option>
            <option value="120">2 giờ</option>
          </select>
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

          {/* Days — only for weekly */}
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

        {/* Target Device */}
        <Card className="p-4">
          <Label>Thiết bị mục tiêu</Label>
          <select
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
            value={targetDeviceId}
            onChange={(e) => handleDeviceChange(Number(e.target.value))}
          >
            {controlDevices.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Card>

        {/* Action Value — smart input based on device type */}
        <Card className="p-4">
          <Label>Giá trị điều khiển</Label>
          <ActionValueInput typeCode={typeCode} value={paramValue} onChange={setParamValue} />
        </Card>

        {/* Submit */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          onClick={handleSubmit}
          disabled={!name.trim() || (repeatType === 'weekly' && selectedDays.length === 0)}
        >
          <Save className="size-4 mr-2" /> Lưu lịch trình
        </Button>
      </div>
    </div>
  );
}
