import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { Home, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
          <Home className="size-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Smart Home</h1>
        <p className="text-blue-200 mt-1">Quản lý nhà thông minh</p>
      </div>

      {/* Login Form */}
      <Card className="w-full p-6 bg-white/95 backdrop-blur shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Nhập email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Đăng nhập
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">Tài khoản demo:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Owner:</strong> owner@smarthome.vn / 123456</p>
            <p><strong>Admin:</strong> admin@smarthome.vn / 123456</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
