import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { alertApi, deviceApi } from '../../services/api';
import { useAuth } from './AuthContext';

export interface AlertRule {
  RuleID: number;
  SensorID: number;
  SensorName: string;
  SensorTypeCode: string;
  Operator: string;
  ThresholdValue: number;
  CooldownSeconds: number;
  LastTriggerAt: string | null;
}

export interface AlertItem {
  AlertID: number;
  RuleID: number | null;
  SensorID: number | null;
  SensorName: string;
  Message: string;
  Level: string;
  CreatedAt: string;
  IsRead: boolean;
}

interface AlertContextType {
  rules: AlertRule[];
  alerts: AlertItem[];
  unreadCount: number;
  loadingRules: boolean;
  refreshRules: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  createRule: (data: { sensorId: number; operator: string; thresholdValue: number; cooldownSeconds?: number }) => Promise<void>;
  deleteRule: (ruleId: number) => Promise<void>;
  markRead: (alertId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const unreadCount = alerts.filter((a) => !a.IsRead).length;

  const refreshRules = useCallback(async () => {
    if (!user) return;
    setLoadingRules(true);
    try {
      const res = await alertApi.getRules();
      if (res.data.status === 'success') setRules(res.data.data);
    } catch { /* ignore */ } finally {
      setLoadingRules(false);
    }
  }, [user]);

  const refreshAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await alertApi.getAlerts(50);
      if (res.data.status === 'success') setAlerts(res.data.data.map((a: any) => ({ ...a, IsRead: !!a.IsRead })));
    } catch { /* ignore */ }
  }, [user]);

  // Load lần đầu khi user login
  useEffect(() => {
    if (!user) { setRules([]); setAlerts([]); return; }
    refreshRules();
    refreshAlerts();
  }, [user, refreshRules, refreshAlerts]);

  // SSE: lắng nghe event 'alert' từ backend
  useEffect(() => {
    if (!user) return;

    const eventsUrl = deviceApi.getEventsUrl();
    const es = new EventSource(eventsUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'alert') return;
        const newAlert: AlertItem = {
          AlertID: payload.data.id,
          RuleID: payload.data.ruleId,
          SensorID: payload.data.sensorId,
          SensorName: payload.data.sensorName,
          Message: payload.data.message,
          Level: payload.data.level || 'WARNING',
          CreatedAt: payload.data.createdAt,
          IsRead: false,
        };
        // Thêm vào đầu danh sách
        setAlerts((prev) => [newAlert, ...prev].slice(0, 200));

        // Browser notification
        _sendBrowserNotification(newAlert.Message);
      } catch { /* ignore parse error */ }
    };

    return () => { es.close(); eventSourceRef.current = null; };
  }, [user]);

  const createRule = useCallback(async (data: { sensorId: number; operator: string; thresholdValue: number; cooldownSeconds?: number }) => {
    await alertApi.createRule(data);
    await refreshRules();
  }, [refreshRules]);

  const deleteRule = useCallback(async (ruleId: number) => {
    await alertApi.deleteRule(ruleId);
    setRules((prev) => prev.filter((r) => r.RuleID !== ruleId));
  }, []);

  const markRead = useCallback(async (alertId: number) => {
    await alertApi.markRead(alertId);
    setAlerts((prev) => prev.map((a) => a.AlertID === alertId ? { ...a, IsRead: true } : a));
  }, []);

  const markAllRead = useCallback(async () => {
    await alertApi.markAllRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, IsRead: true })));
  }, []);

  return (
    <AlertContext.Provider value={{ rules, alerts, unreadCount, loadingRules, refreshRules, refreshAlerts, createRule, deleteRule, markRead, markAllRead }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}

function _sendBrowserNotification(message: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('🚨 Cảnh báo ngưỡng', { body: message, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification('🚨 Cảnh báo ngưỡng', { body: message, icon: '/favicon.ico' });
      }
    });
  }
}
