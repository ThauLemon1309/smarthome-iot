import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, Shield, User, ChevronRight, Settings2, ClipboardList,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export default function MorePage() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: ClipboardList, label: 'Nhật ký hành động', to: '/logs' },
    { icon: Settings2, label: 'Cài đặt chế độ tự động', to: '/auto-mode/config' },
    ...(hasPermission('manage_users')
      ? [{ icon: Shield, label: 'Quản lý người dùng', to: '/admin/users' }]
      : []),
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <User className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user?.name}</h3>
            <p className="text-sm text-blue-100">{user?.email}</p>
            <Badge className="mt-1 bg-white/20 text-white text-xs">
              {user?.role === 'OWNER' ? 'Chủ nhà' : 'Quản trị viên'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card
            key={item.to}
            className="p-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(item.to)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="size-5 text-gray-600" />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>
                )}
                <ChevronRight className="size-4 text-gray-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => { logout(); navigate('/login'); }}
      >
        <LogOut className="size-4 mr-2" />
        Đăng xuất
      </Button>
    </div>
  );
}
