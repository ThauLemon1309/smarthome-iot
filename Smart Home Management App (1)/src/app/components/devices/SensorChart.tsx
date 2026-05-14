import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface SensorChartProps {
  feedName: string;
  title: string;
  unit: string;
  color: string;
  bgColor: string;
}

interface DataPoint {
  time: string;
  value: number;
}

export default function SensorChart({ feedName, title, unit, color, bgColor }: SensorChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(6);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const res = await fetch(`${API_URL}/devices/history/${feedName}?hours=${hours}`);
        const json = await res.json();

        if (json.status === 'success' && json.data) {
          const points: DataPoint[] = json.data.map((d: any) => ({
            time: new Date(d.created_at || d.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit', minute: '2-digit',
            }),
            value: parseFloat(d.value),
          })).reverse();
          setData(points);
        } else {
          // Fallback: generate mock data
          setData(generateMockData(hours));
        }
      } catch {
        // Fallback to mock data if backend unavailable
        setData(generateMockData(hours));
        setError('Dùng dữ liệu mẫu');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [feedName, hours]);

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-1">
          {[1, 6, 24].map((h) => (
            <Button
              key={h}
              size="sm"
              variant={hours === h ? 'default' : 'outline'}
              className={`text-xs h-7 px-2 ${hours === h ? 'bg-blue-600' : ''}`}
              onClick={() => setHours(h)}
            >
              {h}h
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-amber-600 mb-2">{error}</p>}

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          Đang tải...
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400">
          Chưa có dữ liệu
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${feedName}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#999' }}
              tickLine={false}
              axisLine={false}
              unit={unit}
              width={45}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e5e5',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}${unit}`, title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${feedName})`}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// Generate mock history data for demo purposes
function generateMockData(hours: number): DataPoint[] {
  const points: DataPoint[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 30; // ~30 data points

  for (let i = 30; i >= 0; i--) {
    const time = new Date(now - i * interval);
    points.push({
      time: time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round((25 + Math.sin(i / 5) * 5 + Math.random() * 2) * 10) / 10,
    });
  }
  return points;
}
