// ==========================================
// Action Log — khớp với DB: ActionExecution
// ==========================================

export type TriggerSource = 'RULE' | 'SCHEDULE' | 'MANUAL' | 'AUTO_MODE';

export interface ActionLog {
  id: number;
  actionDefId: number;
  controlDeviceId: number;
  controlDeviceName?: string;   // Denormalized

  triggerSource: TriggerSource;
  triggerId?: number;
  scheduleName?: string;

  executedAt: string;
  status: string;
  message?: string;

  userName?: string;
}
