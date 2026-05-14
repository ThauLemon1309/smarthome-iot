import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ActionLog, TriggerSource } from '../types/log';
import { logApi } from '../../services/api';

interface LogFilter {
  source?: TriggerSource | '';
  status?: 'SUCCESS' | 'FAILED' | '';
}

interface LogContextType {
  logs: ActionLog[];
  filter: LogFilter;
  setFilter: (f: LogFilter) => void;
  refresh: () => void;
  loading: boolean;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({ source: '', status: '' });
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { source, status } = filterRef.current;
      const res = await logApi.getLogs(100, source || undefined, status || undefined);
      if (res.data.status === 'success') {
        const dbLogs: ActionLog[] = res.data.data.map((l: any) => ({
          id: l.ExecutionID,
          actionDefId: l.ActionDefID,
          controlDeviceId: l.ControlID,
          controlDeviceName: l.ControlDeviceName,
          triggerSource: l.TriggerSource,
          triggerId: l.TriggerID,
          scheduleName: l.ScheduleName,
          executedAt: l.ExecutedAt,
          status: l.Status,
          message: l.Message,
          userName: l.UserName || null,
        }));
        setLogs(dbLogs);
      }
    } catch {
      // keep existing logs on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchLogs();
  }, [filter, fetchLogs]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchLogs, 30000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  return (
    <LogContext.Provider value={{ logs, filter, setFilter, refresh: fetchLogs, loading }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error('useLogs must be used within LogProvider');
  return ctx;
}
