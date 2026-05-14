import { Home, Floor, Room } from '../types/space';
import { Device, DeviceType } from '../types/device';
import { Schedule } from '../types/schedule';
import { ThresholdRule, Alert } from '../types/rule';
import { ActionLog } from '../types/log';
import { User } from '../types/user';

// ==================== USERS ====================
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'owner@smarthome.vn',
    role: 'OWNER',
    createdAt: '2025-01-01T00:00:00Z',
    homeIds: [1],
  },
  {
    id: 2,
    name: 'Trần Thị B',
    email: 'admin@smarthome.vn',
    role: 'ADMIN',
    createdAt: '2025-01-15T00:00:00Z',
    homeIds: [1],
  },
];

// ==================== HOME ====================
export const mockHome: Home = {
  id: 1,
  name: 'Nhà Thông Minh',
  address: '268 Lý Thường Kiệt, Q.10, TP.HCM',
};

// ==================== FLOORS (frontend-only) ====================
export const mockFloors: Floor[] = [
  { id: 'f1', name: 'Tầng 1', level: 1, homeId: 1 },
  { id: 'f2', name: 'Tầng 2', level: 2, homeId: 1 },
  { id: 'f3', name: 'Tầng 3', level: 3, homeId: 1 },
];

// ==================== ROOMS ====================
export const mockRooms: Room[] = [
  { id: 1, name: 'Phòng khách', homeId: 1, floorId: 'f1', icon: 'sofa' },
  { id: 2, name: 'Phòng bếp', homeId: 1, floorId: 'f1', icon: 'chef-hat' },
  { id: 3, name: 'Phòng ngủ chính', homeId: 1, floorId: 'f2', icon: 'bed' },
  { id: 4, name: 'Phòng ngủ 2', homeId: 1, floorId: 'f2', icon: 'bed' },
  { id: 5, name: 'Phòng làm việc', homeId: 1, floorId: 'f3', icon: 'laptop' },
];

// ==================== DEVICE TYPES ====================
export const mockDeviceTypes: DeviceType[] = [
  { id: 1, code: 'temperature-sensor', category: 'sensor', protocol: 'MQTT' },
  { id: 2, code: 'humidity-sensor', category: 'sensor', protocol: 'MQTT' },
  { id: 3, code: 'light-sensor', category: 'sensor', protocol: 'MQTT' },
  { id: 4, code: 'fan', category: 'control', protocol: 'MQTT' },
  { id: 5, code: 'lcd', category: 'control', protocol: 'MQTT' },
  { id: 6, code: 'rgb-led', category: 'control', protocol: 'MQTT' },
];

// ==================== DEVICES ====================
export const mockDevices: Device[] = [
  {
    id: 1, name: 'Cảm biến nhiệt độ & độ ẩm', typeId: 1,
    typeCode: 'temperature-sensor', category: 'sensor', roomId: 1,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    dataType: 'temperature', unit: '°C',
    temperature: 26.5, humidity: 65,
    feedName: 'da-temp',
  },
  {
    id: 2, name: 'Cảm biến ánh sáng', typeId: 3,
    typeCode: 'light-sensor', category: 'sensor', roomId: 1,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    dataType: 'brightness', unit: '%',
    brightness: 75,
    feedName: 'da-brig',
  },
  {
    id: 3, name: 'Quạt trần', typeId: 4,
    typeCode: 'fan', category: 'control', roomId: 1,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    fanSpeed: 60, mode: 'manual',
    feedName: 'da-fan',
  },
  {
    id: 4, name: 'Màn hình LCD', typeId: 5,
    typeCode: 'lcd', category: 'control', roomId: 1,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    lcdText: 'Chào mừng', mode: 'manual',
    feedName: 'da-lcd',
  },
  {
    id: 5, name: 'Đèn LED RGB', typeId: 6,
    typeCode: 'rgb-led', category: 'control', roomId: 1,
    isActive: true, createdAt: '2025-01-01T00:00:00Z',
    ledLevel: 2, mode: 'manual',
    feedName: 'da-rbg',
  },
  {
    id: 6, name: 'Cảm biến nhiệt độ', typeId: 1,
    typeCode: 'temperature-sensor', category: 'sensor', roomId: 3,
    isActive: true, createdAt: '2025-02-01T00:00:00Z',
    dataType: 'temperature', unit: '°C',
    temperature: 24.2, humidity: 58,
    feedName: 'da-temp',
  },
  {
    id: 7, name: 'Quạt điều hòa', typeId: 4,
    typeCode: 'fan', category: 'control', roomId: 3,
    isActive: true, createdAt: '2025-02-01T00:00:00Z',
    fanSpeed: 40, mode: 'auto',
    feedName: 'da-fan',
  },
];

// ==================== SCHEDULES ====================
export const mockSchedules: Schedule[] = [
  {
    id: 1, name: 'Bật quạt buổi trưa',
    repeatType: 'daily', repeatDay: 'mon,tue,wed,thu,fri',
    time: '12:00', applyLevel: 'DEVICE',
    status: 'active', createdBy: 1,
    updatedAt: '2025-03-01T00:00:00Z',
    actions: [{
      id: 1, controlDeviceId: 3, actionType: 'SET',
      parameters: [{ paramName: 'fanSpeed', paramValue: '80' }],
      createdAt: '2025-03-01T00:00:00Z',
    }],
  },
  {
    id: 2, name: 'Tắt đèn ban đêm',
    repeatType: 'daily', repeatDay: 'mon,tue,wed,thu,fri,sat,sun',
    time: '23:00', applyLevel: 'ROOM',
    status: 'active', createdBy: 1,
    updatedAt: '2025-03-15T00:00:00Z',
    actions: [{
      id: 2, controlDeviceId: 5, actionType: 'SET',
      parameters: [{ paramName: 'ledLevel', paramValue: '0' }],
      createdAt: '2025-03-15T00:00:00Z',
    }],
  },
];

// ==================== RULES ====================
export const mockRules: ThresholdRule[] = [
  {
    id: 1, sensorId: 1, sensorName: 'Cảm biến nhiệt độ - Phòng khách',
    operator: '>', thresholdValue: 35,
    cooldownSeconds: 300,
    actions: [{ controlDeviceId: 1, controlDeviceName: 'Quạt', actionType: 'SET', parameters: [{ paramName: 'speed', paramValue: '100' }] }],
  },
  {
    id: 2, sensorId: 2, sensorName: 'Cảm biến ánh sáng - Phòng khách',
    operator: '<', thresholdValue: 30,
    cooldownSeconds: 600,
    actions: [{ controlDeviceId: 2, controlDeviceName: 'Đèn LED', actionType: 'SET', parameters: [{ paramName: 'level', paramValue: '2' }] }],
  },
];

// ==================== ALERTS ====================
export const mockAlerts: Alert[] = [
  {
    id: 1, ruleId: 1, sensorId: 1,
    sensorName: 'Cảm biến nhiệt độ',
    message: 'Nhiệt độ Phòng khách đạt 36°C — đã bật quạt tự động',
    level: 'WARNING',
    createdAt: '2025-04-29T14:30:00Z',
    isRead: false,
  },
];

// ==================== ACTION LOGS ====================
export const mockActionLogs: ActionLog[] = [
  {
    id: 1, actionDefId: 1, controlDeviceId: 3,
    controlDeviceName: 'Quạt trần',
    triggerSource: 'MANUAL', executedAt: '2025-04-29T10:00:00Z',
    status: 'SUCCESS', message: 'Đặt tốc độ quạt: 80%',
    userName: 'Nguyễn Văn A',
  },
  {
    id: 2, actionDefId: 2, controlDeviceId: 5,
    controlDeviceName: 'Đèn LED RGB',
    triggerSource: 'RULE', triggerId: 2,
    executedAt: '2025-04-29T08:15:00Z',
    status: 'SUCCESS', message: 'Bật đèn mức 2 (ánh sáng yếu)',
    userName: 'Hệ thống',
  },
];