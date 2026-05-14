import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { SpaceProvider } from "./context/SpaceContext";
import { DeviceProvider } from "./context/DeviceContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import { LogProvider } from "./context/LogContext";
import { AlertProvider } from "./context/AlertContext";

export default function App() {
  return (
    <AuthProvider>
      <SpaceProvider>
        <DeviceProvider>
          <AlertProvider>
            <ScheduleProvider>
              <LogProvider>
                <RouterProvider router={router} />
              </LogProvider>
            </ScheduleProvider>
          </AlertProvider>
        </DeviceProvider>
      </SpaceProvider>
    </AuthProvider>
  );
}
