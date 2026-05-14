import { Outlet, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './BottomNav';
import { useEffect } from 'react';

export default function AppShell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
