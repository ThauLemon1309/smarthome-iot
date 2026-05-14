import { useParams, useNavigate, Link } from 'react-router';
import { useSpaces } from '../context/SpaceContext';
import { useDevices } from '../context/DeviceContext';
import { ArrowLeft, Plus, Zap, Hand, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DeviceCard from '../components/DeviceCard';

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { getRoomById, getFloorById, deleteRoom } = useSpaces();
  const { getDevicesByRoom, systemMode } = useDevices();

  const room = getRoomById(Number(roomId!));
  const devices = getDevicesByRoom(Number(roomId!));
  const floor = room ? getFloorById(room.floorId) : undefined;

  const handleDeleteRoom = async () => {
    if (!confirm(`Xóa phòng "${room?.name}"? Thiết bị trong phòng sẽ bị xóa.`)) return;
    await deleteRoom(Number(roomId!));
    navigate(`/floor/${room?.floorId}`);
  };

  if (!room) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4">
        <p>Không tìm thấy phòng</p>
      </div>
    );
  }

  // Separate input sensors and output devices
  const sensors = devices.filter((d) => d.category === 'sensor');
  const outputs = devices.filter((d) => d.category === 'control');

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/floor/${room.floorId}`)}
          className="text-white hover:bg-purple-800 mb-3 -ml-2"
        >
          <ArrowLeft className="size-4 mr-1" />
          {floor?.name}
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-1">{room.name}</h1>
            <p className="text-purple-100">{devices.length} thiết bị</p>
          </div>
          <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm"
            className="text-white hover:bg-red-600 h-8 w-8 p-0"
            onClick={handleDeleteRoom}>
            <Trash2 className="size-4" />
          </Button>
          <Badge
            variant={systemMode === 'auto' ? 'default' : 'secondary'}
            className={`${
              systemMode === 'auto' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            {systemMode === 'auto' ? (
              <>
                <Zap className="size-3 mr-1" />
                Tự động
              </>
            ) : (
              <>
                <Hand className="size-3 mr-1" />
                Thủ công
              </>
            )}
          </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* System Mode Notice */}
        {systemMode === 'auto' && (
          <Card className="p-3 bg-green-50 border-green-200">
            <p className="text-sm text-green-800">
              <strong>Chế độ tự động:</strong> Thiết bị đang tự động điều chỉnh dựa trên cảm biến
            </p>
          </Card>
        )}

        {/* Sensor Readings Section */}
        {sensors.length > 0 && (
          <div>
            <h2 className="text-sm uppercase text-gray-500 mb-3">
              Cảm biến
            </h2>
            <div className="space-y-3">
              {sensors.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </div>
        )}

        {/* Output Controls Section */}
        {outputs.length > 0 && (
          <div>
            <h2 className="text-sm uppercase text-gray-500 mb-3">
              Thiết bị điều khiển
            </h2>
            <div className="space-y-3">
              {outputs.map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          </div>
        )}

        {devices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có thiết bị nào</p>
            <p className="text-sm mt-1">Nhấn nút bên dưới để thêm thiết bị</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4">
        <Link to={`/room/${roomId}/add-device`}>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg">
            <Plus className="size-5 mr-2" />
            Thêm thiết bị
          </Button>
        </Link>
      </div>
    </div>
  );
}