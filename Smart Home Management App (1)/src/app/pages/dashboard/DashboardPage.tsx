import { useEffect, useState, useCallback } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Thermometer, Droplets, Sun, Fan, Lightbulb,
  Zap, Hand, TrendingUp, TrendingDown, Minus,
  CalendarDays,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '../../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SensorTrend { now: number | null; prev: number | null }
interface DualPoint {
  hour: number;
  tempToday?: number | null; tempYest?: number | null;
  humiToday?: number | null; humiYest?: number | null;
  brigToday?: number | null; brigYest?: number | null;
}
interface RuntimeData { today: number; yesterday: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMinutes(min: number) {
  if (min === 0) return '0 phút';
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}p` : `${h}h`;
}

function pctChange(today: number, yest: number): { pct: number; up: boolean } | null {
  if (yest === 0) return today > 0 ? { pct: 100, up: true } : null;
  const pct = Math.round(((today - yest) / yest) * 100);
  return { pct: Math.abs(pct), up: today >= yest };
}

function TrendArrow({ now, prev, unit }: { now: number | null; prev: number | null; unit: string }) {
  if (now == null || prev == null) return <span className="text-gray-300 text-xs">–</span>;
  const diff = Number((now - prev).toFixed(1));
  if (Math.abs(diff) < 0.2) return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs">
      <Minus className="size-3" /><span>±0{unit}</span>
    </span>
  );
  const up = diff > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-red-500' : 'text-blue-500'}`}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? '+' : ''}{diff}{unit} vs 1h trước
    </span>
  );
}

function DonutCard({
  label, icon: Icon, iconColor, runtime, color,
}: {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  runtime: RuntimeData;
  color: string;
}) {
  const TOTAL_MIN = 24 * 60;
  const todayPct = Math.min((runtime.today / TOTAL_MIN) * 100, 100);
  const change = pctChange(runtime.today, runtime.yesterday);
  const data = [
    { name: 'Bật', value: runtime.today },
    { name: 'Còn lại', value: Math.max(TOTAL_MIN - runtime.today, 0) },
  ];

  return (
    <Card className="p-4 flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-4 ${iconColor}`} />
        <p className="text-xs font-medium text-gray-600">{label}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <PieChart width={72} height={72}>
            <Pie data={data} cx={30} cy={30} innerRadius={22} outerRadius={33}
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              <Cell fill={color} />
              <Cell fill="#f3f4f6" />
            </Pie>
          </PieChart>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
            {Math.round(todayPct)}%
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-800">{fmtMinutes(runtime.today)}</p>
          <p className="text-xs text-gray-400">Hôm qua: {fmtMinutes(runtime.yesterday)}</p>
          {change && (
            <p className={`text-xs font-medium mt-0.5 ${change.up ? 'text-orange-500' : 'text-green-500'}`}>
              {change.up ? '▲' : '▼'} {change.pct}%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { devices, systemMode, setSystemMode } = useDevices();

  const tempSensor  = devices.find((d) => d.typeCode === 'temperature-sensor');
  const lightSensor = devices.find((d) => d.typeCode === 'light-sensor');

  const [trend, setTrend]         = useState<{ temp: SensorTrend; humi: SensorTrend; brig: SensorTrend } | null>(null);
  const [dualChart, setDualChart] = useState<DualPoint[]>([]);
  const [runtime, setRuntime]     = useState<{ fan: RuntimeData; led: RuntimeData } | null>(null);
  const [dualMode, setDualMode]   = useState<'temp' | 'humi' | 'brig'>('temp');

  const loadAll = useCallback(async () => {
    const [trendRes, dualRes, runtimeRes] = await Promise.allSettled([
      dashboardApi.getSensorTrend(),
      dashboardApi.getSensorDualChart(),
      dashboardApi.getDailyDeviceRuntime(),
    ]);
    if (trendRes.status === 'fulfilled')   setTrend(trendRes.value.data.data);
    if (dualRes.status === 'fulfilled')    setDualChart(dualRes.value.data.data);
    if (runtimeRes.status === 'fulfilled') setRuntime(runtimeRes.value.data.data);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(loadAll, 60000);
    return () => clearInterval(id);
  }, [loadAll]);

  // ── Zone 2 chart lines based on mode ──────────────────────────────────────
  const todayKey  = dualMode === 'temp' ? 'tempToday' : dualMode === 'humi' ? 'humiToday' : 'brigToday';
  const yestKey   = dualMode === 'temp' ? 'tempYest'  : dualMode === 'humi' ? 'humiYest'  : 'brigYest';
  const lineColor = dualMode === 'temp' ? '#ef4444' : dualMode === 'humi' ? '#3b82f6' : '#f59e0b';
  const yUnit     = dualMode === 'brig' ? '%' : dualMode === 'humi' ? '%' : '°C';

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-5 pt-5 pb-10 rounded-b-3xl shadow-lg">
        <div className="mb-4">
          <p className="text-blue-200 text-sm">Xin chào,</p>
          <h1 className="text-xl font-bold">{user?.name ?? 'Người dùng'}</h1>
        </div>
        <Card className="bg-white/10 backdrop-blur border-white/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              {systemMode === 'auto' ? <Zap className="size-5" /> : <Hand className="size-5" />}
              <span className="font-medium text-sm">
                {systemMode === 'auto' ? 'Chế độ Tự động' : 'Chế độ Thủ công'}
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant={systemMode === 'manual' ? 'default' : 'ghost'}
                className={systemMode === 'manual' ? 'bg-white text-blue-700 hover:bg-white/90 h-8 text-xs' : 'text-white hover:bg-white/20 h-8 text-xs'}
                onClick={() => setSystemMode('manual')}>
                <Hand className="size-3 mr-1" />Thủ công
              </Button>
              <Button size="sm" variant={systemMode === 'auto' ? 'default' : 'ghost'}
                className={systemMode === 'auto' ? 'bg-white text-green-700 hover:bg-white/90 h-8 text-xs' : 'text-white hover:bg-white/20 h-8 text-xs'}
                onClick={() => setSystemMode('auto')}>
                <Zap className="size-3 mr-1" />Tự động
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 -mt-6 space-y-4">

        {/* ── Zone 1: Glance Overview ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {/* Temperature */}
          <Card className="p-3 bg-white shadow-md border-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 bg-red-100 rounded-md"><Thermometer className="size-3.5 text-red-600" /></div>
              <p className="text-[10px] text-gray-500 font-medium">Nhiệt độ</p>
            </div>
            <p className="text-xl font-bold text-gray-800 leading-none">
              {tempSensor?.temperature != null ? `${tempSensor.temperature}°` : '--'}
            </p>
            <div className="mt-1">
              <TrendArrow now={trend?.temp.now ?? null} prev={trend?.temp.prev ?? null} unit="°" />
            </div>
          </Card>

          {/* Humidity */}
          <Card className="p-3 bg-white shadow-md border-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 bg-blue-100 rounded-md"><Droplets className="size-3.5 text-blue-600" /></div>
              <p className="text-[10px] text-gray-500 font-medium">Độ ẩm</p>
            </div>
            <p className="text-xl font-bold text-gray-800 leading-none">
              {tempSensor?.humidity != null ? `${tempSensor.humidity}%` : '--'}
            </p>
            <div className="mt-1">
              <TrendArrow now={trend?.humi.now ?? null} prev={trend?.humi.prev ?? null} unit="%" />
            </div>
          </Card>

          {/* Brightness */}
          <Card className="p-3 bg-white shadow-md border-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="p-1 bg-yellow-100 rounded-md"><Sun className="size-3.5 text-yellow-600" /></div>
              <p className="text-[10px] text-gray-500 font-medium">Ánh sáng</p>
            </div>
            <p className="text-xl font-bold text-gray-800 leading-none">
              {lightSensor?.brightness != null ? `${lightSensor.brightness}%` : '--'}
            </p>
            <div className="mt-1">
              <TrendArrow now={trend?.brig.now ?? null} prev={trend?.brig.prev ?? null} unit="%" />
            </div>
          </Card>
        </div>

        {/* ── Zone 2: Today vs Yesterday Chart ──────────────────────────── */}
        <Card className="p-4 bg-white shadow-md border-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-blue-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Hôm nay vs Hôm qua</h2>
            </div>
            <div className="flex gap-1">
              {(['temp', 'humi', 'brig'] as const).map((m) => (
                <button key={m} onClick={() => setDualMode(m)}
                  className={`text-[10px] px-2 py-0.5 rounded transition font-medium ${
                    dualMode === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {m === 'temp' ? 'Nhiệt độ' : m === 'humi' ? 'Độ ẩm' : 'Ánh sáng'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 h-0.5 rounded" style={{ background: lineColor }} />
              Hôm nay
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: lineColor, opacity: 0.4 }} />
              Hôm qua
            </span>
          </div>

          {dualChart.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dualChart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }}
                  tickFormatter={(h) => `${h}h`} interval={3} />
                <YAxis tick={{ fontSize: 9 }}
                  tickFormatter={(v) => `${v}${yUnit}`} width={38} />
                <Tooltip
                  formatter={(val, name) => [
                    `${val}${yUnit}`,
                    name === todayKey ? 'Hôm nay' : 'Hôm qua',
                  ]}
                  labelFormatter={(h) => `${h}:00`}
                />
                <Line type="monotone" dataKey={todayKey} stroke={lineColor}
                  strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey={yestKey} stroke={lineColor}
                  strokeWidth={1.5} strokeDasharray="5 3" dot={false}
                  strokeOpacity={0.4} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── Zone 3: Usage & Efficiency ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-gray-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Thời lượng hoạt động hôm nay</h2>
          </div>
          <div className="flex gap-3">
            <DonutCard label="Quạt" icon={Fan} iconColor="text-cyan-500"
              runtime={runtime?.fan ?? { today: 0, yesterday: 0 }} color="#06b6d4" />
            <DonutCard label="Đèn LED" icon={Lightbulb} iconColor="text-yellow-500"
              runtime={runtime?.led ?? { today: 0, yesterday: 0 }} color="#f59e0b" />
          </div>
        </div>

      </div>
    </div>
  );
}
