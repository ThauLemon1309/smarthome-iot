import { useNavigate } from 'react-router';
import { useSchedules } from '../../context/ScheduleContext';
import { useDevices } from '../../context/DeviceContext';
import { useSpaces } from '../../context/SpaceContext';
import { CalendarClock, Plus, Trash2, ToggleLeft, ToggleRight, Clock, Pencil } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const DAY_LABELS: Record<string, string> = {
  mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5',
  fri: 'T6', sat: 'T7', sun: 'CN',
};

export default function ScheduleListPage() {
  const { schedules, toggleSchedule, deleteSchedule } = useSchedules();
  const { devices } = useDevices();
  const { rooms } = useSpaces();
  const navigate = useNavigate();

  const getTargetName = (schedule: typeof schedules[0]) => {
    if (schedule.applyLevel === 'DEVICE') {
      const action = schedule.actions[0];
      if (action) {
        const dev = devices.find((d) => d.id === action.controlDeviceId);
        return dev?.name || `Device #${action.controlDeviceId}`;
      }
    }
    return schedule.applyLevel;
  };

  const getActionSummary = (schedule: typeof schedules[0]) => {
    const action = schedule.actions[0];
    if (!action) return 'Không có hành động';
    const params = action.parameters.map((p) => `${p.paramName}: ${p.paramValue}`).join(', ');
    return `${action.actionType} — ${params}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Lịch trình</h1>
            <p className="text-purple-200 text-sm mt-0.5">{schedules.length} lịch trình</p>
          </div>
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white"
            onClick={() => navigate('/schedules/new')}
          >
            <Plus className="size-4 mr-1" /> Thêm
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <CalendarClock className="size-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có lịch trình nào</p>
            <Button className="mt-4" onClick={() => navigate('/schedules/new')}>
              <Plus className="size-4 mr-1" /> Tạo lịch trình đầu tiên
            </Button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={`p-4 transition-all ${
                schedule.status === 'inactive' ? 'opacity-60 bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{schedule.name}</h3>
                    <Badge
                      className={`text-xs ${
                        schedule.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {schedule.status === 'active' ? 'Đang bật' : 'Tắt'}
                    </Badge>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                    <Clock className="size-3.5" />
                    <span className="font-mono">{schedule.time || '--:--'}</span>
                  </div>

                  {/* Days */}
                  {schedule.repeatDay && (
                    <div className="flex gap-1 mt-2">
                      {schedule.repeatDay.split(',').map((day) => (
                        <span
                          key={day}
                          className="px-1.5 py-0.5 text-xs bg-purple-50 text-purple-700 rounded"
                        >
                          {DAY_LABELS[day.trim()] || day}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Target & Action */}
                  <p className="text-xs text-gray-500 mt-2">
                    🎯 {getTargetName(schedule)} · {getActionSummary(schedule)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 ml-3">
                  <button
                    onClick={() => toggleSchedule(schedule.id)}
                    className="text-gray-500 hover:text-blue-600 transition"
                  >
                    {schedule.status === 'active' ? (
                      <ToggleRight className="size-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="size-6 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                    className="text-gray-400 hover:text-purple-600 transition"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
