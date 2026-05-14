import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Schedule } from '../types/schedule';
import { scheduleApi } from '../../services/api';
import { useAuth } from './AuthContext';

interface ScheduleContextType {
  schedules: Schedule[];
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (id: number, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: number) => void;
  toggleSchedule: (id: number) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Fetch schedules from DB
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await scheduleApi.getSchedules(user.id);
        if (res.data.status === 'success') {
          const dbSchedules: Schedule[] = res.data.data.map((s: any) => ({
            id: s.ScheduleID,
            name: s.Name,
            repeatType: s.RepeatType,
            repeatDay: s.RepeatDay,
            specificDays: s.SpecificDays,
            time: s.Time,
            applyLevel: s.ApplyLevel,
            status: s.Status,
            createdBy: s.CreatedBy,
            updatedAt: s.UpdatedAt,
            actions: (s.actions || []).map((a: any) => ({
              id: a.ActionDefID,
              controlDeviceId: a.ControlID,
              actionType: a.ActionType,
              createdAt: a.CreatedAt,
              parameters: (a.parameters || []).map((p: any) => ({
                paramName: p.ParamName,
                paramValue: p.ParamValue,
              })),
            })),
          }));
          setSchedules(dbSchedules);
        }
      } catch {
        console.error('Failed to fetch schedules, using mock');
      }
    };
    fetch();
  }, [user]);

  const addSchedule = useCallback(async (schedule: Omit<Schedule, 'id'>) => {
    try {
      const res = await scheduleApi.createSchedule({
        name: schedule.name,
        repeatType: schedule.repeatType,
        repeatDay: schedule.repeatDay,
        specificDays: schedule.specificDays,
        applyLevel: schedule.applyLevel,
        status: schedule.status,
        createdBy: schedule.createdBy,
        time: schedule.time,
        actions: schedule.actions,
      });
      if (res.data.status === 'success') {
        const s = res.data.data;
        setSchedules((p) => [...p, { ...schedule, id: s.ScheduleID } as Schedule]);
      }
    } catch {
      // Fallback to local
      setSchedules((p) => [...p, { ...schedule, id: Date.now() } as Schedule]);
    }
  }, []);

  const updateSchedule = useCallback(async (id: number, updates: Partial<Schedule> & { paramValue?: string }) => {
    try {
      await scheduleApi.updateSchedule(id, updates as any);
    } catch { /* ignore */ }
    setSchedules((p) => p.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const deleteSchedule = useCallback(async (id: number) => {
    try {
      await scheduleApi.deleteSchedule(id);
    } catch { /* ignore */ }
    setSchedules((p) => p.filter((s) => s.id !== id));
  }, []);

  const toggleSchedule = useCallback(async (id: number) => {
    const current = schedules.find((s) => s.id === id);
    if (!current) return;
    const newStatus = current.status === 'active' ? 'inactive' : 'active';
    try {
      await scheduleApi.toggleSchedule(id, current.status);
    } catch { /* ignore */ }
    setSchedules((p) =>
      p.map((s) =>
        s.id === id ? { ...s, status: newStatus as 'active' | 'inactive' } : s
      )
    );
  }, [schedules]);

  return (
    <ScheduleContext.Provider
      value={{ schedules, addSchedule, updateSchedule, deleteSchedule, toggleSchedule }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedules() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedules must be used within ScheduleProvider');
  return ctx;
}
