import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useSpaces } from '../context/SpaceContext';
import { useDevices } from '../context/DeviceContext';
import { ArrowLeft, ChevronRight, DoorOpen, Plus, Trash2, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function FloorDetail() {
  const { floorId } = useParams<{ floorId: string }>();
  const navigate = useNavigate();
  const { getFloorById, getRoomsByFloor, addRoom, deleteFloor } = useSpaces();
  const { getDevicesByRoom } = useDevices();

  const floor = getFloorById(floorId!);
  const rooms = getRoomsByFloor(floorId!);

  const [showAdd, setShowAdd] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!floor) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4">
        <p>Không tìm thấy tầng</p>
      </div>
    );
  }

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setSaving(true);
    try {
      await addRoom(roomName.trim(), floorId!);
      setRoomName('');
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async () => {
    if (!confirm(`Xóa tầng "${floor.name}"? Tất cả phòng trong tầng sẽ bị xóa.`)) return;
    await deleteFloor(floorId!);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <Button variant="ghost" size="sm"
          onClick={() => navigate('/')}
          className="text-white hover:bg-blue-700 mb-3 -ml-2">
          <ArrowLeft className="size-4 mr-1" />Quay lại
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl mb-1">{floor.name}</h1>
            <p className="text-blue-100">{rooms.length} phòng</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={() => setShowAdd(true)}>
              <Plus className="size-4 mr-1" />Thêm phòng
            </Button>
            <Button size="sm" variant="ghost"
              className="text-white hover:bg-red-600"
              onClick={handleDeleteFloor}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Add room form */}
        {showAdd && (
          <Card className="p-4 border-2 border-blue-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Thêm phòng mới</h2>
              <button onClick={() => setShowAdd(false)}>
                <X className="size-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <Label>Tên phòng</Label>
                <Input className="mt-1" placeholder="VD: Phòng khách" value={roomName}
                  onChange={(e) => setRoomName(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                {saving ? 'Đang thêm...' : 'Thêm phòng'}
              </Button>
            </form>
          </Card>
        )}

        {rooms.map((room) => {
          const deviceCount = getDevicesByRoom(room.id).length;
          return (
            <Link key={room.id} to={`/room/${room.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DoorOpen className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-gray-500">{deviceCount} thiết bị</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          );
        })}

        {rooms.length === 0 && !showAdd && (
          <div className="text-center py-12 text-gray-500">
            <DoorOpen className="size-12 mx-auto mb-2 opacity-30" />
            <p>Chưa có phòng nào</p>
            <p className="text-sm mt-1">Nhấn "Thêm phòng" để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}
