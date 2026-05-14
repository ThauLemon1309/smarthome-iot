// ==========================================
// User & RBAC — khớp với DB: User, Owner, Admin
// ==========================================

export type UserRole = 'OWNER' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  // Joined
  homeIds?: number[];
}

export const PERMISSIONS = {
  OWNER: [
    'manage_users',
    'manage_devices',
    'manage_schedules',
    'manage_rules',
    'control_devices',
    'view_logs',
    'view_all_logs',
    'view_dashboard',
  ],
  ADMIN: [
    'manage_devices',
    'manage_schedules',
    'manage_rules',
    'control_devices',
    'view_dashboard',
    'view_logs',
  ],
} as const;

export type Permission = (typeof PERMISSIONS)[UserRole][number];
