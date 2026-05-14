import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_ORIGIN_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ==================== DEVICE & ADAFRUIT IO API ====================
export const deviceApi = {
  // Cảm biến (từ Adafruit IO)
  getSensorData: () => apiClient.get('/devices/sensors'),
  getMode: () => apiClient.get('/devices/mode-status'),
  getFanStatus: () => apiClient.get('/devices/fan-status'),
  getRGBStatus: () => apiClient.get('/devices/rgb-status'),
  getAllFeeds: () => apiClient.get('/devices/feeds'),

  // Điều khiển (gửi lên Adafruit IO)
  controlFan: (value: number) => apiClient.post('/devices/fan', { value }),
  controlMode: (value: number) => apiClient.post('/devices/mode', { value }),
  controlRGB: (value: number) => apiClient.post('/devices/rgb', { value }),
  displayLCD: (text: string) => apiClient.post('/devices/lcd', { text }),

  // Trạng thái
  getStatus: () => apiClient.get('/devices/status'),
  getEventsUrl: () => `${API_ORIGIN_URL}/api/devices/events`,
  healthCheck: () => apiClient.get('/health'),

  // DB-powered device CRUD
  getAllDevicesDB: (homeId: number) => apiClient.get(`/devices/db/all/${homeId}`),
  getDevicesByRoomDB: (roomId: number) => apiClient.get(`/devices/db/room/${roomId}`),
  getDeviceTypes: () => apiClient.get('/devices/db/types'),
  createDeviceDB: (data: { name: string; manufacturer?: string; typeId: number; roomId: number }) =>
    apiClient.post('/devices/db', data),
  updateDeviceDB: (deviceId: number, data: Record<string, unknown>) =>
    apiClient.put(`/devices/db/${deviceId}`, data),
  deleteDeviceDB: (deviceId: number) => apiClient.delete(`/devices/db/${deviceId}`),
};

// ==================== AUTH API ====================
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/auth/register', data),
  getMe: (userId: number) => apiClient.get(`/auth/me/${userId}`),
  getAllUsers: () => apiClient.get('/auth/users'),
  deleteUser: (userId: number) => apiClient.delete(`/auth/users/${userId}`),
};

// ==================== SPACES API ====================
export const spaceApi = {
  getHomes: (userId: number) => apiClient.get(`/spaces/homes/${userId}`),
  getFloors: (homeId: number) => apiClient.get(`/spaces/floors/${homeId}`),
  createFloor: (data: { name: string; level: number; homeId: number }) =>
    apiClient.post('/spaces/floors', data),
  deleteFloor: (floorId: number) => apiClient.delete(`/spaces/floors/${floorId}`),
  getRooms: (homeId: number) => apiClient.get(`/spaces/rooms/${homeId}`),
  getRoomsByFloor: (floorId: number) => apiClient.get(`/spaces/rooms/floor/${floorId}`),
  getRoomById: (roomId: number) => apiClient.get(`/spaces/room/${roomId}`),
  createRoom: (data: { name: string; description?: string; homeId: number; floorId?: number }) =>
    apiClient.post('/spaces/rooms', data),
  deleteRoom: (roomId: number) => apiClient.delete(`/spaces/rooms/${roomId}`),
};

// ==================== SCHEDULES API ====================
export const scheduleApi = {
  getSchedules: (userId: number) => apiClient.get(`/schedules/${userId}`),
  createSchedule: (data: Record<string, unknown>) => apiClient.post('/schedules', data),
  updateSchedule: (scheduleId: number, data: Record<string, unknown>) =>
    apiClient.put(`/schedules/${scheduleId}`, data),
  toggleSchedule: (scheduleId: number, currentStatus: string) =>
    apiClient.put(`/schedules/${scheduleId}/toggle`, { status: currentStatus }),
  deleteSchedule: (scheduleId: number) => apiClient.delete(`/schedules/${scheduleId}`),
};

// ==================== LOGS API ====================
export const logApi = {
  getLogs: (limit = 100, source?: string, status?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    return apiClient.get(`/logs?${params.toString()}`);
  },
};

// ==================== AUTO MODE CONFIG API ====================
export const autoModeApi = {
  getConfig: () => apiClient.get('/auto-mode/config'),
  updateConfig: (data: Record<string, number>) => apiClient.put('/auto-mode/config', data),
};

// ==================== DASHBOARD API ====================
export const dashboardApi = {
  getKPI: () => apiClient.get('/dashboard/kpi'),
  getSensorChart: (hours = 24) => apiClient.get(`/dashboard/sensor-chart?hours=${hours}`),
  getActivityChart: () => apiClient.get('/dashboard/activity-chart'),
  getSensorTrend: () => apiClient.get('/dashboard/sensor-trend'),
  getSensorDualChart: () => apiClient.get('/dashboard/sensor-dual'),
  getDailyDeviceRuntime: () => apiClient.get('/dashboard/device-runtime'),
  getActivityTimeline: (limit = 30) => apiClient.get(`/dashboard/activity-timeline?limit=${limit}`),
};

// ==================== ALERT API ====================
export const alertApi = {
  getRules: () => apiClient.get('/alerts/rules'),
  createRule: (data: { sensorId: number; operator: string; thresholdValue: number; cooldownSeconds?: number }) =>
    apiClient.post('/alerts/rules', data),
  deleteRule: (ruleId: number) => apiClient.delete(`/alerts/rules/${ruleId}`),
  getAlerts: (limit = 50) => apiClient.get(`/alerts?limit=${limit}`),
  markRead: (alertId: number) => apiClient.put(`/alerts/${alertId}/read`, {}),
  markAllRead: () => apiClient.put('/alerts/read-all', {}),
};

// ==================== EXPORT API ====================
export const exportApi = {
  getActionLogsUrl: (from: string, to: string, format: 'xlsx' | 'csv') =>
    `${API_BASE_URL}/export/action-logs?from=${from}&to=${to}&format=${format}`,
  getSensorDataUrl: (from: string, to: string, format: 'xlsx' | 'csv', deviceId?: number) => {
    let url = `${API_BASE_URL}/export/sensor-data?from=${from}&to=${to}&format=${format}`;
    if (deviceId) url += `&deviceId=${deviceId}`;
    return url;
  },
};

export default apiClient;
