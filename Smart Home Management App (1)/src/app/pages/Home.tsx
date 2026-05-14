import { useState } from 'react';
import { Link } from 'react-router';
import { useSpaces } from '../context/SpaceContext';
import { Building2, ChevronRight, Plus, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Home() {
  const { floors, getRoomsByFloor, addFloor } = useSpaces();

  const [showAdd, setShowAdd] = useState(false);
  const [floorName, setFloorName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorName.trim()) return;
    setSaving(true);
    try {
      await addFloor(floorName.trim(), floors.length + 1);
      setFloorName('');
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 p-4">
      <div className="text-white mb-6 pt-4 flex items-start justify-between">
        <div>
          <h1 className="text-3xl mb-2">Nhà Thông Minh</h1>
          <p className="text-blue-100">Quản lý và điều khiển thiết bị</p>
        </div>
        <Button size="sm" variant="ghost"
          className="text-white hover:bg-blue-700 mt-1"
          onClick={() => setShowAdd(true)}>
          <Plus className="size-4 mr-1" />Thêm tầng
        </Button>
      </div>

      {/* Add floor dialog */}
      {showAdd && (
        <Card className="p-4 mb-4 border-2 border-blue-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Thêm tầng mới</h2>
            <button onClick={() => setShowAdd(false)}>
              <X className="size-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleAddFloor} className="space-y-3">
            <div>
              <Label>Tên tầng</Label>
              <Input className="mt-1" placeholder="VD: Tầng 1" value={floorName}
                onChange={(e) => setFloorName(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
              {saving ? 'Đang thêm...' : 'Thêm tầng'}
            </Button>
          </form>
        </Card>
      )}

      {/* Floors List */}
      <div className="space-y-3">
        {floors.map((floor) => {
          const roomCount = getRoomsByFloor(floor.id).length;
          return (
            <Link key={floor.id} to={`/floor/${floor.id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Building2 className="size-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{floor.name}</h3>
                      <p className="text-sm text-gray-500">{roomCount} phòng</p>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          );
        })}

        {floors.length === 0 && (
          <div className="text-center py-12 text-white/70">
            <Building2 className="size-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có tầng nào</p>
            <p className="text-sm mt-1">Nhấn "Thêm tầng" để bắt đầu</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Card className="p-4 bg-white/95 backdrop-blur">
          <p className="text-sm text-gray-600">Tổng phòng</p>
          <p className="text-2xl mt-1">
            {floors.reduce((acc, floor) => acc + getRoomsByFloor(floor.id).length, 0)}
          </p>
        </Card>
        <Card className="p-4 bg-white/95 backdrop-blur">
          <p className="text-sm text-gray-600">Tổng tầng</p>
          <p className="text-2xl mt-1">{floors.length}</p>
        </Card>
      </div>
    </div>
  );
}
