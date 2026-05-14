export type DeviceType = 
  | 'temperature-sensor'
  | 'humidity-sensor'
  | 'light-sensor'
  | 'fan'
  | 'lcd'
  | 'rgb-led';

export type DeviceMode = 'manual' | 'auto';

export type LedLevel = 0 | 1 | 2; // 0: Tắt, 1: Vừa, 2: Sáng tối đa

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  // Sensor readings (for input devices)
  temperature?: number;
  humidity?: number;
  brightness?: number;
  // Output controls (for output devices)
  fanSpeed?: number; // 0-100
  lcdText?: string;
  ledLevel?: LedLevel; // 0, 1, 2
  mode?: DeviceMode;
  isActive?: boolean;
  // Adafruit IO Feed mapping
  feedNames?: {
    temperature?: string;
    humidity?: string;
    brightness?: string;
    fan?: string;
    lcd?: string;
    rgb?: string;
  };
}

export interface Room {
  id: string;
  name: string;
  floorId: string;
}

export interface Floor {
  id: string;
  name: string;
  level: number;
}