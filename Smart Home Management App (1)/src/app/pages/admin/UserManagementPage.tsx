import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Shield, User, Crown } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { mockUsers } from '../../data/mockData';

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  if (!hasPermission('manage_users')) {
    return (
      <div className="p-4 text-center py-12">
        <Shield className="size-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Bạn không có quyền truy cập</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-indigo-800 mb-2 -ml-2">
          <ArrowLeft className="size-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-xl font-bold">Quản lý người dùng</h1>
        <p className="text-indigo-200 text-sm">{mockUsers.length} người dùng</p>
      </div>

      <div className="p-4 space-y-3">
        {mockUsers.map((u) => (
          <Card key={u.id} className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                u.role === 'OWNER' ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {u.role === 'OWNER' ? (
                  <Crown className="size-6 text-amber-600" />
                ) : (
                  <User className="size-6 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{u.name}</h3>
                <p className="text-sm text-gray-500">{u.email}</p>
              </div>
              <Badge className={`${
                u.role === 'OWNER' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {u.role === 'OWNER' ? 'Chủ nhà' : 'Admin'}
              </Badge>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
