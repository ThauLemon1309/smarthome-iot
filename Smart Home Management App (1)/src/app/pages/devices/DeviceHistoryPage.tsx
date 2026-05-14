import { useParams, useNavigate } from 'react-router';
import { useDevices } from '../../context/DeviceContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SensorChart from '../../components/devices/SensorChart';

const FEED_CHART_CONFIG: Record<string, { title: string; unit: string; color: string; bgColor: string }> = {
  'da-temp':  { title: 'Nhiệt độ', unit: '°C', color: '#ef4444', bgColor: 'bg-red-50' },
  'da-humi':  { title: 'Độ ẩm', unit: '%', color: '#3b82f6', bgColor: 'bg-blue-50' },
  'da-brig':  { title: 'Ánh sáng', unit: '%', color: '#eab308', bgColor: 'bg-yellow-50' },
};

export default function DeviceHistoryPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices } = useDevices();

  const device = devices.find((d) => d.id === Number(deviceId));

  if (!device || device.category !== 'sensor') {
    return (
      <div className="p-4">
        <p className="text-gray-500">Thiết bị không tìm thấy hoặc không phải cảm biến</p>
      </div>
    );
  }

  // Determine which feeds to show charts for
  const feedsToShow: string[] = [];
  if (device.typeCode === 'temperature-sensor') {
    feedsToShow.push('da-temp', 'da-humi');
  } else if (device.typeCode === 'light-sensor') {
    feedsToShow.push('da-brig');
  } else if (device.feedName) {
    feedsToShow.push(device.feedName);
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-indigo-800 mb-2 -ml-2"
        >
          <ArrowLeft className="size-4 mr-1" />
          Quay lại
        </Button>
        <h1 className="text-xl font-bold">Lịch sử dữ liệu</h1>
        <p className="text-indigo-200 text-sm">{device.name}</p>
      </div>

      {/* Charts */}
      <div className="p-4 space-y-4">
        {/* Current Values */}
        <div className="grid grid-cols-2 gap-3">
          {device.temperature != null && (
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{device.temperature}°C</p>
              <p className="text-xs text-gray-500 mt-1">Nhiệt độ hiện tại</p>
            </div>
          )}
          {device.humidity != null && (
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{device.humidity}%</p>
              <p className="text-xs text-gray-500 mt-1">Độ ẩm hiện tại</p>
            </div>
          )}
          {device.brightness != null && (
            <div className="bg-yellow-50 rounded-xl p-4 text-center col-span-2">
              <p className="text-3xl font-bold text-yellow-600">{device.brightness}%</p>
              <p className="text-xs text-gray-500 mt-1">Ánh sáng hiện tại</p>
            </div>
          )}
        </div>

        {/* History Charts */}
        {feedsToShow.map((feedName) => {
          const config = FEED_CHART_CONFIG[feedName];
          if (!config) return null;
          return (
            <SensorChart
              key={feedName}
              feedName={feedName}
              title={config.title}
              unit={config.unit}
              color={config.color}
              bgColor={config.bgColor}
            />
          );
        })}
      </div>
    </div>
  );
}
