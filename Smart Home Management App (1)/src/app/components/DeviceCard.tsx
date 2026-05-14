import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Device, LedLevel } from '../types/device';
import { useDevices } from '../context/DeviceContext';
import {
  Thermometer,
  Droplets,
  Sun,
  Fan,
  MonitorDot,
  Lightbulb,
  Trash2,
  Settings,
  Lock,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const { updateDevice, deleteDevice, systemMode, controlFan, controlRGB, controlLCD, loading } = useDevices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Local state cho dialog điều khiển — đồng bộ từ device prop khi dialog mở
  const [fanSpeed, setFanSpeed] = useState(device.fanSpeed ?? 0);
  const [lcdText, setLcdText] = useState(device.lcdText || '');
  const [rgbColor, setRgbColor] = useState(device.rgbColor || '#FFFFFF');
  const [ledLevel, setLedLevel] = useState<LedLevel>((device.ledLevel ?? 0) as LedLevel);
  const [isControlling, setIsControlling] = useState(false);

  // Đồng bộ local state khi dialog mở để luôn phản ánh giá trị thực tế
  useEffect(() => {
    if (isDialogOpen) {
      setFanSpeed(device.fanSpeed ?? 0);
      setLedLevel((device.ledLevel ?? 0) as LedLevel);
      setLcdText(device.lcdText || '');
    }
  }, [isDialogOpen, device.fanSpeed, device.ledLevel, device.lcdText]);

  const getIcon = () => {
    switch (device.typeCode) {
      case 'temperature-sensor':
        return <Thermometer className="size-5" />;
      case 'humidity-sensor':
        return <Droplets className="size-5" />;
      case 'light-sensor':
        return <Sun className="size-5" />;
      case 'fan':
        return <Fan className="size-5" />;
      case 'lcd':
        return <MonitorDot className="size-5" />;
      case 'rgb-led':
        return <Lightbulb className="size-5" />;
      default:
        return <Settings className="size-5" />;
    }
  };

  const getColorClass = () => {
    switch (device.typeCode) {
      case 'temperature-sensor':
        return 'bg-red-100 text-red-600';
      case 'humidity-sensor':
        return 'bg-blue-100 text-blue-600';
      case 'light-sensor':
        return 'bg-yellow-100 text-yellow-600';
      case 'fan':
        return 'bg-cyan-100 text-cyan-600';
      case 'lcd':
        return 'bg-green-100 text-green-600';
      case 'rgb-led':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleFanSpeedChange = (value: number[]) => {
    setFanSpeed(value[0]);
  };

  const handleFanSpeedSave = async () => {
    setIsControlling(true);
    try {
      await controlFan(fanSpeed);
      setIsDialogOpen(false);
    } catch (err) {
      alert('Lỗi điều khiển quạt: ' + (err as Error).message);
    } finally {
      setIsControlling(false);
    }
  };

  const handleLcdTextSave = async () => {
    setIsControlling(true);
    try {
      await controlLCD(lcdText);
      setIsDialogOpen(false);
    } catch (err) {
      alert('Lỗi cập nhật LCD: ' + (err as Error).message);
    } finally {
      setIsControlling(false);
    }
  };

  const handleLedSave = async () => {
    setIsControlling(true);
    try {
      await controlRGB(ledLevel);
      setIsDialogOpen(false);
    } catch (err) {
      alert('Lỗi điều khiển LED RGB: ' + (err as Error).message);
    } finally {
      setIsControlling(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`Xóa thiết bị "${device.name}"?`)) {
      deleteDevice(device.id);
    }
  };

  const isOutputDevice = ['fan', 'lcd', 'rgb-led'].includes(device.typeCode);
  const isLocked = systemMode === 'auto' && isOutputDevice;

  const renderSensorContent = () => {
    if (device.typeCode === 'temperature-sensor') {
      return (
        <>
          <div className="flex gap-4 mt-3">
            <div className="flex-1 bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Nhiệt độ</p>
              <p className="text-2xl mt-1">{device.temperature != null ? `${device.temperature}°C` : '--'}</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">Độ ẩm</p>
              <p className="text-2xl mt-1">{device.humidity != null ? `${device.humidity}%` : '--'}</p>
            </div>
          </div>
          <button
            className="text-xs text-blue-600 hover:underline mt-2 block"
            onClick={() => navigate(`/device/${device.id}/history`)}
          >
            📊 Xem biểu đồ lịch sử
          </button>
        </>
      );
    }

    if (device.typeCode === 'light-sensor') {
      return (
        <div className="bg-yellow-50 rounded-lg p-3 mt-3">
          <p className="text-xs text-gray-600">Cường độ ánh sáng</p>
          <p className="text-2xl mt-1">{device.brightness != null ? `${device.brightness}%` : '--'}</p>
          <button
            className="text-xs text-blue-600 hover:underline mt-2 block"
            onClick={() => navigate(`/device/${device.id}/history`)}
          >
            📊 Xem biểu đồ lịch sử
          </button>
        </div>
      );
    }

    return null;
  };

  const renderOutputControls = () => {
    if (device.typeCode === 'fan') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className={`bg-cyan-50 rounded-lg p-3 mt-3 relative ${
              isLocked ? 'opacity-75' : 'cursor-pointer hover:bg-cyan-100 transition-colors'
            }`}>
              <p className="text-xs text-gray-600">Tốc độ quạt</p>
              <p className="text-2xl mt-1">{device.fanSpeed != null ? `${device.fanSpeed}%` : '--'}</p>
              {isLocked && (
                <Lock className="size-4 absolute top-3 right-3 text-gray-400" />
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[90%] mx-auto">
            <DialogHeader>
              <DialogTitle>Điều chỉnh tốc độ quạt</DialogTitle>
            </DialogHeader>
            {isLocked ? (
              <div className="py-6 text-center text-gray-600">
                <Lock className="size-12 mx-auto mb-3 text-gray-400" />
                <p>Không thể chỉnh sửa trong chế độ tự động</p>
                <p className="text-sm mt-2">Chuyển sang chế độ thủ công để điều khiển</p>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Tốc độ</Label>
                    <span className="text-lg">{fanSpeed}%</span>
                  </div>
                  <Slider
                    value={[fanSpeed]}
                    onValueChange={handleFanSpeedChange}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Button onClick={handleFanSpeedSave} className="w-full" disabled={isControlling || loading}>
                  {isControlling || loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    }

    if (device.typeCode === 'lcd') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className={`bg-green-50 rounded-lg p-3 mt-3 relative ${
              isLocked ? 'opacity-75' : 'cursor-pointer hover:bg-green-100 transition-colors'
            }`}>
              <p className="text-xs text-gray-600">Văn bản hiển thị</p>
              <p className="mt-1 truncate">{device.lcdText || '(Trống)'}</p>
              {isLocked && (
                <Lock className="size-4 absolute top-3 right-3 text-gray-400" />
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[90%] mx-auto">
            <DialogHeader>
              <DialogTitle>Thay đổi văn bản LCD</DialogTitle>
            </DialogHeader>
            {isLocked ? (
              <div className="py-6 text-center text-gray-600">
                <Lock className="size-12 mx-auto mb-3 text-gray-400" />
                <p>Không thể chỉnh sửa trong chế độ tự động</p>
                <p className="text-sm mt-2">Chuyển sang chế độ thủ công để điều khiển</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Văn bản</Label>
                  <Input
                    value={lcdText}
                    onChange={(e) => setLcdText(e.target.value)}
                    placeholder="Nhập văn bản..."
                  />
                </div>
                <Button onClick={handleLcdTextSave} className="w-full" disabled={isControlling || loading}>
                  {isControlling || loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    }

    if (device.typeCode === 'rgb-led') {
      return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <div className={`bg-purple-50 rounded-lg p-3 mt-3 relative ${
              isLocked ? 'opacity-75' : 'cursor-pointer hover:bg-purple-100 transition-colors'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">Mức độ LED</p>
                <p className="text-2xl">
                  {device.ledLevel != null ? (['0 - Tắt', '1 - Vừa', '2 - Cao'][device.ledLevel] ?? '--') : '--'}
                </p>
              </div>
              {isLocked && (
                <Lock className="size-4 absolute top-3 right-3 text-gray-400" />
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-[90%] mx-auto">
            <DialogHeader>
              <DialogTitle>Điều chỉnh đèn LED RGB</DialogTitle>
            </DialogHeader>
            {isLocked ? (
              <div className="py-6 text-center text-gray-600">
                <Lock className="size-12 mx-auto mb-3 text-gray-400" />
                <p>Không thể chỉnh sửa trong chế độ tự động</p>
                <p className="text-sm mt-2">Chuyển sang chế độ thủ công để điều khiển</p>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {/* LED Level Selection */}
                <div className="space-y-3">
                  <Label>Chọn mức độ sáng</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 0 as LedLevel, label: 'Tắt', desc: 'Không sáng', icon: '○' },
                      { value: 1 as LedLevel, label: 'Vừa', desc: 'Độ sáng vừa', icon: '◐' },
                      { value: 2 as LedLevel, label: 'Cao', desc: 'Độ sáng tối đa', icon: '●' },
                    ].map((level) => (
                      <Button
                        key={level.value}
                        type="button"
                        variant={ledLevel === level.value ? 'default' : 'outline'}
                        className={`h-24 flex flex-col ${
                          ledLevel === level.value
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : ''
                        }`}
                        onClick={() => setLedLevel(level.value)}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{level.icon}</div>
                          <div className="text-xl mb-1">{level.value}</div>
                          <div className="text-xs opacity-90">{level.label}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Màu sắc đã được cài đặt sẵn trong phần cứng
                  </p>
                </div>

                <Button onClick={handleLedSave} className="w-full bg-purple-600 hover:bg-purple-700" disabled={isControlling || loading}>
                  {isControlling || loading ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${getColorClass()}`}>{getIcon()}</div>
          <div className="flex-1">
            <h3 className="font-semibold">{device.name}</h3>
            {device.feedNames && Object.entries(device.feedNames).length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Object.entries(device.feedNames)
                  .map(([, feedName]) => feedName)
                  .join(' • ')}
              </p>
            )}

            {renderSensorContent()}
            {renderOutputControls()}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
