// ==========================================
// Device Models — khớp với DB: Device, DeviceType,
// SensorDevice, ControlDevice, SensorData
// ==========================================

export type DeviceCategory = 'sensor' | 'control';

export type DeviceTypeCode =
  | 'temperature-sensor'
  | 'humidity-sensor'
  | 'light-sensor'
  | 'fan'
  | 'lcd'
  | 'rgb-led';

export type DeviceMode = 'manual' | 'auto';
export type LedLevel = 0 | 1 | 2;

export interface DeviceType {
  id: number;
  code: DeviceTypeCode;
  category: DeviceCategory;
  protocol?: string;
}

export interface Device {
  id: number;
  name: string;
  typeId: number;
  typeCode: DeviceTypeCode;     // Denormalized for easy access
  category: DeviceCategory;
  roomId: number;
  manufacturer?: string;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt: string;

  // Sensor-specific (from SensorDevice)
  dataType?: string;            // 'temperature', 'humidity', 'light'
  unit?: string;                // '°C', '%', 'lux'

  // === Live values (from Adafruit IO polling) ===
  temperature?: number;
  humidity?: number;
  brightness?: number;
  fanSpeed?: number;
  lcdText?: string;
  ledLevel?: LedLevel;
  mode?: DeviceMode;

  // Adafruit IO feed mapping
  feedName?: string;
}

// Sensor history for charts — maps to SensorData table
export interface SensorDataPoint {
  id?: number;
  deviceId: number;
  value: number;
  timestamp: string;
}

export interface SensorHistory {
  deviceId: number;
  feedName: string;
  data: SensorDataPoint[];
}
