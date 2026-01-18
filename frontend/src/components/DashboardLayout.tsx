import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="h-full w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
