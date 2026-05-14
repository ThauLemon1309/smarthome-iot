import { NavLink } from 'react-router';
import { LayoutDashboard, Building2, CalendarClock, Bell, Menu } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';

export default function BottomNav() {
  const { unreadCount } = useAlerts();

  const navItems = [
    { to: '/',          icon: LayoutDashboard, label: 'Dashboard',   badge: 0 },
    { to: '/spaces',    icon: Building2,       label: 'Không gian',  badge: 0 },
    { to: '/schedules', icon: CalendarClock,   label: 'Lịch trình',  badge: 0 },
    { to: '/alerts',    icon: Bell,            label: 'Cảnh báo',    badge: unreadCount },
    { to: '/more',      icon: Menu,            label: 'Thêm',        badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <item.icon className="size-5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                <span className={isActive ? 'text-blue-600' : ''}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
