import React, { createContext, useContext, useState, useEffect } from 'react';
import { Floor, Room, Device, DeviceMode, LedLevel } from '../types';
import { mockFloors, mockRooms, mockDevices } from '../data/mockData';
import { deviceApi } from '../../services/api';

interface DataContextType {
  floors: Floor[];
  rooms: Room[];
  devices: Device[];
  systemMode: DeviceMode; // Global mode for entire system
  loading: boolean;
  error: string | null;
  setSystemMode: (mode: DeviceMode) => void;
  addDevice: (device: Omit<Device, 'id'>) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  getRoomsByFloor: (floorId: string) => Room[];
  getDevicesByRoom: (roomId: string) => Device[];
  getFloorById: (id: string) => Floor | undefined;
  getRoomById: (id: string) => Room | undefined;
  // API Control functions
  controlFan: (speed: number) => Promise<void>;
  controlRGB: (level: LedLevel) => Promise<void>;
  controlLCD: (text: string) => Promise<void>;
  controlDeviceMode: (mode: 0 | 1) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [floors] = useState<Floor[]>(mockFloors);
  const [rooms] = useState<Room[]>(mockRooms);
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [systemMode, setSystemMode] = useState<DeviceMode>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sensor data from backend
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await deviceApi.getSensorData();
        const sensorData = response.data.data;
        
        // Update devices state with real data from backend
        setDevices((prev) =>
          prev.map((device) => {
            if (device.type === 'temperature-sensor' && sensorData.temperature !== undefined) {
              return { 
                ...device, 
                temperature: sensorData.temperature,
                humidity: sensorData.humidity !== undefined ? sensorData.humidity : device.humidity
              };
            }
            if (device.type === 'light-sensor' && sensorData.brightness !== undefined) {
              return { ...device, brightness: sensorData.brightness };
            }
            return device;
          })
        );
        setError(null);
      } catch (err) {
        console.error('Failed to fetch sensor data:', err);
        // Fallback to mock data if backend is not available
        console.info('Using mock sensor data');
      }
    };

    // Fetch on mount
    fetchSensorData();

    // Poll every 2 seconds
    const interval = setInterval(fetchSensorData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto mode logic - adjust output devices based on sensor readings
  useEffect(() => {
    if (systemMode !== 'auto') return;

    const interval = setInterval(() => {
      setDevices((prev) => {
        const newDevices = [...prev];
        
        // For each room, apply auto logic
        rooms.forEach((room) => {
          const roomDevices = newDevices.filter((d) => d.roomId === room.id);
          
          // Get sensor readings
          const tempSensor = roomDevices.find((d) => d.type === 'temperature-sensor');
          const lightSensor = roomDevices.find((d) => d.type === 'light-sensor');
          
          // Auto control fan based on temperature
          const fan = roomDevices.find((d) => d.type === 'fan');
          if (fan && tempSensor?.temperature) {
            const temp = tempSensor.temperature;
            let autoSpeed = 0;
            if (temp < 22) autoSpeed = 0;
            else if (temp < 24) autoSpeed = 30;
            else if (temp < 26) autoSpeed = 50;
            else if (temp < 28) autoSpeed = 70;
            else autoSpeed = 100;
            
            const fanIndex = newDevices.findIndex((d) => d.id === fan.id);
            if (fanIndex !== -1) {
              newDevices[fanIndex] = { ...newDevices[fanIndex], fanSpeed: autoSpeed };
            }
          }
          
          // Auto control LED based on brightness
          const led = roomDevices.find((d) => d.type === 'rgb-led');
          if (led && lightSensor?.brightness !== undefined) {
            const brightness = lightSensor.brightness;
            let autoLevel: 0 | 1 | 2 = 0;
            if (brightness < 40) autoLevel = 2; // Dark -> High brightness
            else if (brightness < 60) autoLevel = 1; // Medium
            else autoLevel = 0; // Bright -> Turn off
            
            const ledIndex = newDevices.findIndex((d) => d.id === led.id);
            if (ledIndex !== -1) {
              newDevices[ledIndex] = { ...newDevices[ledIndex], ledLevel: autoLevel };
            }
          }
          
          // Auto control LCD to show temperature
          const lcd = roomDevices.find((d) => d.type === 'lcd');
          if (lcd && tempSensor?.temperature && tempSensor?.humidity) {
            const autoText = `${tempSensor.temperature}°C | ${tempSensor.humidity}%`;
            const lcdIndex = newDevices.findIndex((d) => d.id === lcd.id);
            if (lcdIndex !== -1) {
              newDevices[lcdIndex] = { ...newDevices[lcdIndex], lcdText: autoText };
            }
          }
        });
        
        return newDevices;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [systemMode, rooms]);

  // Control functions calling backend API
  const controlFan = async (speed: number) => {
    setLoading(true);
    try {
      await deviceApi.controlFan(speed);
      setDevices((prev) =>
        prev.map((d) => d.type === 'fan' ? { ...d, fanSpeed: speed } : d)
      );
      setError(null);
    } catch (err) {
      console.error('Fan control error:', err);
      setError('Lỗi điều khiển quạt');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const controlRGB = async (level: LedLevel) => {
    setLoading(true);
    try {
      await deviceApi.controlRGB(level);
      setDevices((prev) =>
        prev.map((d) => d.type === 'rgb-led' ? { ...d, ledLevel: level } : d)
      );
      setError(null);
    } catch (err) {
      console.error('RGB control error:', err);
      setError('Lỗi điều khiển LED RGB');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const controlLCD = async (text: string) => {
    setLoading(true);
    try {
      await deviceApi.displayLCD(text);
      setDevices((prev) =>
        prev.map((d) => d.type === 'lcd' ? { ...d, lcdText: text } : d)
      );
      setError(null);
    } catch (err) {
      console.error('LCD control error:', err);
      setError('Lỗi hiển thị LCD');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch mode from backend (da-mode feed)
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await deviceApi.getMode();
        console.log('[Mode Fetch] Full response:', response);
        const modeValue = response.data?.data?.mode;
        
        console.log('[Mode Fetch] modeValue:', modeValue, 'Type:', typeof modeValue);
        
        // Convert to number to be safe
        const numMode = Number(modeValue);
        console.log('[Mode Fetch] numMode:', numMode);
        
        if (numMode === 0) {
          console.log('[Mode Fetch] Setting to MANUAL');
          setSystemMode('manual');
        } else if (numMode === 1) {
          console.log('[Mode Fetch] Setting to AUTO');
          setSystemMode('auto');
        } else {
          console.log('[Mode Fetch] Unknown mode value, keeping current');
        }
      } catch (err) {
        console.error('[Mode Fetch] Error:', err.message, err);
      }
    };

    // Fetch on mount
    console.log('[Mode Fetch] Initial fetch');
    fetchMode();

    // Poll every 2 seconds for more responsive sync
    const interval = setInterval(() => {
      console.log('[Mode Fetch] Polling...');
      fetchMode();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch fan status from backend (da-fan feed)
  useEffect(() => {
    const fetchFanStatus = async () => {
      try {
        const response = await deviceApi.getFanStatus();
        const fanSpeed = response.data?.data?.fanSpeed;
        
        console.log('[Fan Fetch] fanSpeed:', fanSpeed);
        
        if (fanSpeed !== undefined && fanSpeed !== null) {
          setDevices((prev) =>
            prev.map((d) => d.type === 'fan' ? { ...d, fanSpeed: Number(fanSpeed) } : d)
          );
        }
      } catch (err) {
        console.error('[Fan Fetch] Error:', err.message);
      }
    };

    // Fetch on mount
    fetchFanStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchFanStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch RGB status from backend (da-rbg feed)
  useEffect(() => {
    const fetchRGBStatus = async () => {
      try {
        const response = await deviceApi.getRGBStatus();
        const ledLevel = response.data?.data?.ledLevel;
        
        console.log('[RGB Fetch] ledLevel:', ledLevel);
        
        if (ledLevel !== undefined && ledLevel !== null) {
          setDevices((prev) =>
            prev.map((d) => d.type === 'rgb-led' ? { ...d, ledLevel: Number(ledLevel) as LedLevel } : d)
          );
        }
      } catch (err) {
        console.error('[RGB Fetch] Error:', err.message);
      }
    };

    // Fetch on mount
    fetchRGBStatus();

    // Poll every 2 seconds
    const interval = setInterval(fetchRGBStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Control device mode and sync to Adafruit
  const controlDeviceMode = async (mode: 0 | 1) => {
    setLoading(true);
    try {
      await deviceApi.controlMode(mode);
      setError(null);
    } catch (err) {
      console.error('Mode control error:', err);
      setError('Lỗi đặt chế độ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Wrapper để update mode và gửi lên Adafruit
  const setSystemModeWithSync = (mode: DeviceMode) => {
    setSystemMode(mode);
    // Gửi lên Adafruit: manual = 0, auto = 1
    const modeValue = mode === 'manual' ? 0 : 1;
    controlDeviceMode(modeValue).catch((err) => {
      console.error('Failed to sync mode to Adafruit:', err);
    });
  };

  const addDevice = (device: Omit<Device, 'id'>) => {
    const newDevice: Device = {
      ...device,
      id: `d${Date.now()}`,
    };
    setDevices((prev) => [...prev, newDevice]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices((prev) =>
      prev.map((device) => (device.id === id ? { ...device, ...updates } : device))
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== id));
  };

  const getRoomsByFloor = (floorId: string) => {
    return rooms.filter((room) => room.floorId === floorId);
  };

  const getDevicesByRoom = (roomId: string) => {
    return devices.filter((device) => device.roomId === roomId);
  };

  const getFloorById = (id: string) => {
    return floors.find((floor) => floor.id === id);
  };

  const getRoomById = (id: string) => {
    return rooms.find((room) => room.id === id);
  };

  return (
    <DataContext.Provider
      value={{
        floors,
        rooms,
        devices,
        systemMode,
        loading,
        error,
        setSystemMode: setSystemModeWithSync,
        addDevice,
        updateDevice,
        deleteDevice,
        getRoomsByFloor,
        getDevicesByRoom,
        getFloorById,
        getRoomById,
        controlFan,
        controlRGB,
        controlLCD,
        controlDeviceMode,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}