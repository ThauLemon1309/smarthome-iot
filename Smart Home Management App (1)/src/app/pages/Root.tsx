import { Outlet } from 'react-router';
import { DataProvider } from '../context/DataContext';

export default function Root() {
  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    </DataProvider>
  );
}
