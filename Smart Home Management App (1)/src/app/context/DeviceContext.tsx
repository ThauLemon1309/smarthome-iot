import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Device, DeviceMode, LedLevel } from '../types/device';
import { deviceApi } from '../../services/api';
import { useAuth } from './AuthContext';

interface DeviceContextType {
  devices: Device[];
  systemMode: DeviceMode;
  loading: boolean;
  error: string | null;
  setSystemMode: (mode: DeviceMode) => void;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: number, updates: Partial<Device>) => void;
  deleteDevice: (id: number) => void;
  getDevicesByRoom: (roomId: number) => Device[];
  refreshDevices: () => Promise<void>;
  controlFan: (speed: number) => Promise<void>;
  controlRGB: (level: LedLevel) => Promise<void>;
  controlLCD: (text: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

type DeviceEvent =
  | {
      type: 'snapshot';
      data: {
        sensors?: { temperature?: number | null; humidity?: number | null; brightness?: number | null };
        state?: { fanSpeed?: number; mode?: number; ledLevel?: LedLevel; lcdText?: string };
      };
    }
  | {
      type: 'sensor';
      data: { temperature?: number | null; humidity?: number | null; brightness?: number | null };
    }
  | {
      type: 'state';
      data: { fanSpeed?: number; mode?: number; ledLevel?: LedLevel; lcdText?: string };
    }
  | { type: 'heartbeat'; data: null };

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [systemMode, setSystemModeState] = useState<DeviceMode>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!user?.homeIds?.length) return;
    const homeId = user.homeIds[0];
    try {
      const res = await deviceApi.getAllDevicesDB(homeId);
      if (res.data.status === 'success') {
        setDevices(res.data.data.map((d: any) => ({
          id: d.DeviceID,
          name: d.Name,
          typeId: d.TypeID,
          typeCode: d.TypeCode,
          category: d.Category,
          roomId: d.RoomID,
          manufacturer: d.Manufacturer ?? undefined,
          isActive: !!d.Is_active,
          lastSeenAt: d.Last_seen_at ?? undefined,
          createdAt: d.Created_at ?? new Date().toISOString(),
          dataType: d.DataType ?? undefined,
          unit: d.Unit ?? undefined,
        })));
      }
    } catch { /* giữ nguyên nếu lỗi */ }
  }, [user]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const applySensorData = useCallback((data: { temperature?: number | null; humidity?: number | null; brightness?: number | null }) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.category === 'sensor' && d.typeCode === 'temperature-sensor') {
          return {
            ...d,
            temperature: data.temperature ?? d.temperature,
            humidity: data.humidity ?? d.humidity,
          };
        }
        if (d.category === 'sensor' && d.typeCode === 'humidity-sensor') {
          return { ...d, humidity: data.humidity ?? d.humidity };
        }
        if (d.category === 'sensor' && d.typeCode === 'light-sensor') {
          return { ...d, brightness: data.brightness ?? d.brightness };
        }
        return d;
      })
    );
  }, []);

  const applyDeviceState = useCallback((data: { fanSpeed?: number; mode?: number; ledLevel?: LedLevel; lcdText?: string }) => {
    if (data.mode != null) {
      setSystemModeState(Number(data.mode) === 1 ? 'auto' : 'manual');
    }

    setDevices((prev) =>
      prev.map((d) => {
        if (d.typeCode === 'fan' && data.fanSpeed != null) {
          return { ...d, fanSpeed: Number(data.fanSpeed) };
        }
        if (d.typeCode === 'rgb-led' && data.ledLevel != null) {
          return { ...d, ledLevel: Number(data.ledLevel) as LedLevel };
        }
        if (d.typeCode === 'lcd' && data.lcdText != null) {
          return { ...d, lcdText: String(data.lcdText) };
        }
        return d;
      })
    );
  }, []);

  // Realtime updates from backend MQTT cache. Polling below remains as fallback.
  useEffect(() => {
    const source = new EventSource(deviceApi.getEventsUrl());

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as DeviceEvent;
        if (message.type === 'snapshot') {
          if (message.data.sensors) applySensorData(message.data.sensors);
          if (message.data.state) applyDeviceState(message.data.state);
        } else if (message.type === 'sensor') {
          applySensorData(message.data);
        } else if (message.type === 'state') {
          applyDeviceState(message.data);
        }
        setError(null);
      } catch {
        /* ignore malformed event */
      }
    };

    source.onerror = () => {
      /* EventSource will retry automatically; REST polling remains as fallback. */
    };

    return () => source.close();
  }, [applyDeviceState, applySensorData]);

  // Poll sensor data from backend every 2s
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await deviceApi.getSensorData();
        const data = response.data.data;
        applySensorData(data);
      } catch {
        /* fallback to mock */
      }
    };
    fetchSensorData();
    const id = setInterval(fetchSensorData, 15000);
    return () => clearInterval(id);
  }, [applySensorData]);

  // Poll mode, fan, rgb status (2s interval for real-time sync from Adafruit)
  useEffect(() => {
    const poll = async () => {
      try {
        const [modeRes, fanRes, rgbRes] = await Promise.allSettled([
          deviceApi.getMode(),
          deviceApi.getFanStatus(),
          deviceApi.getRGBStatus(),
        ]);
        if (modeRes.status === 'fulfilled') {
          const m = Number(modeRes.value.data?.data?.mode);
          setSystemModeState(m === 1 ? 'auto' : 'manual');
        }
        if (fanRes.status === 'fulfilled') {
          const s = fanRes.value.data?.data?.fanSpeed;
          if (s != null) {
            setDevices((prev) =>
              prev.map((d) => (d.typeCode === 'fan' ? { ...d, fanSpeed: Number(s) } : d))
            );
          }
        }
        if (rgbRes.status === 'fulfilled') {
          const l = rgbRes.value.data?.data?.ledLevel;
          if (l != null) {
            setDevices((prev) =>
              prev.map((d) =>
                d.typeCode === 'rgb-led' ? { ...d, ledLevel: Number(l) as LedLevel } : d
              )
            );
          }
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 2000); // Changed from 15s to 2s for real-time Adafruit cloud sync
    return () => clearInterval(id);
  }, []);

  const setSystemMode = useCallback(async (mode: DeviceMode) => {
    setSystemModeState(mode);
    try {
      await deviceApi.controlMode(mode === 'manual' ? 0 : 1);
    } catch {
      /* ignore */
    }
  }, []);

  const controlFan = useCallback(async (speed: number) => {
    setLoading(true);
    try {
      await deviceApi.controlFan(speed);
      setDevices((p) => p.map((d) => (d.typeCode === 'fan' ? { ...d, fanSpeed: speed } : d)));
      setError(null);
    } catch { setError('Lỗi điều khiển quạt'); }
    finally { setLoading(false); }
  }, []);

  const controlRGB = useCallback(async (level: LedLevel) => {
    setLoading(true);
    try {
      await deviceApi.controlRGB(level);
      setDevices((p) => p.map((d) => (d.typeCode === 'rgb-led' ? { ...d, ledLevel: level } : d)));
      setError(null);
    } catch { setError('Lỗi điều khiển LED'); }
    finally { setLoading(false); }
  }, []);

  const controlLCD = useCallback(async (text: string) => {
    setLoading(true);
    try {
      await deviceApi.displayLCD(text);
      setDevices((p) => p.map((d) => (d.typeCode === 'lcd' ? { ...d, lcdText: text } : d)));
      setError(null);
    } catch { setError('Lỗi hiển thị LCD'); }
    finally { setLoading(false); }
  }, []);

  const addDevice = (device: Omit<Device, 'id'>) => {
    setDevices((p) => [...p, { ...device, id: Date.now() } as Device]);
  };

  const updateDevice = (id: number, updates: Partial<Device>) => {
    setDevices((p) => p.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDevice = (id: number) => {
    setDevices((p) => p.filter((d) => d.id !== id));
  };

  const getDevicesByRoom = (roomId: number) =>
    devices.filter((d) => d.roomId === roomId);

  return (
    <DeviceContext.Provider
      value={{
        devices, systemMode, loading, error,
        setSystemMode, addDevice, updateDevice, deleteDevice,
        getDevicesByRoom, refreshDevices: fetchDevices,
        controlFan, controlRGB, controlLCD,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error('useDevices must be used within DeviceProvider');
  return ctx;
}
