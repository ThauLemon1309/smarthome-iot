import { createBrowserRouter } from "react-router";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import Home from "./pages/Home";
import FloorDetail from "./pages/FloorDetail";
import RoomDetail from "./pages/RoomDetail";
import AddDevice from "./pages/AddDevice";
import DeviceHistoryPage from "./pages/devices/DeviceHistoryPage";
import ScheduleListPage from "./pages/schedules/ScheduleListPage";
import ScheduleFormPage from "./pages/schedules/ScheduleFormPage";
import ScheduleEditPage from "./pages/schedules/ScheduleEditPage";
import ActionLogPage from "./pages/logs/ActionLogPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import MorePage from "./pages/more/MorePage";
import AutoModeConfigPage from "./pages/auto-mode/AutoModeConfigPage";
import AlertsPage from "./pages/alerts/AlertsPage";

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: "spaces", Component: Home },
      { path: "floor/:floorId", Component: FloorDetail },
      { path: "room/:roomId", Component: RoomDetail },
      { path: "room/:roomId/add-device", Component: AddDevice },
      { path: "device/:deviceId/history", Component: DeviceHistoryPage },
      { path: "schedules", Component: ScheduleListPage },
      { path: "schedules/new", Component: ScheduleFormPage },
      { path: "schedules/:id/edit", Component: ScheduleEditPage },
      { path: "logs", Component: ActionLogPage },
      { path: "admin/users", Component: UserManagementPage },
      { path: "more", Component: MorePage },
      { path: "auto-mode/config", Component: AutoModeConfigPage },
      { path: "alerts", Component: AlertsPage },
    ],
  },
]);
