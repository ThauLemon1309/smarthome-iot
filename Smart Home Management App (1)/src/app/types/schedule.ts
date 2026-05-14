// ==========================================
// Schedule Models — khớp với DB: Schedule,
// ActionDefinition, ActionParameter, ScheduleAction
// ==========================================

export type RepeatType = 'daily' | 'weekly' | 'custom';
export type ApplyLevel = 'HOME' | 'ROOM' | 'DEVICE';
export type ScheduleStatus = 'active' | 'inactive';

export interface ActionParameter {
  paramName: string;
  paramValue: string;
}

export interface ActionDefinition {
  id: number;
  controlDeviceId: number;
  actionType: 'SET' | 'CONTROL' | 'NOTIFY';
  parameters: ActionParameter[];
  createdAt: string;
}

export interface Schedule {
  id: number;
  name: string;

  repeatType: RepeatType;
  repeatDay?: string;           // 'mon,tue,wed,...'
  specificDays?: string;
  time?: string;                // 'HH:mm' — frontend thêm
  durationMinutes?: number;     // null/undefined = chạy mãi, >0 = tự tắt sau N phút

  applyLevel: ApplyLevel;
  status: ScheduleStatus;

  createdBy: number;            // UserID
  updatedAt: string;

  // Joined data
  actions: ActionDefinition[];
}
