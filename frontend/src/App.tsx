import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Teams from './pages/Teams';
import Timesheet from './pages/Timesheet';
import { useAuthStore } from './store/authStore';
import { DashboardLayout } from './components/DashboardLayout';
import { JSX } from 'react';

function PrivateRoute({ children, roles }: { children: JSX.Element, roles: string[] }) {
    const user = useAuthStore((state) => state.user);
    if (!user) return <Navigate to="/login" />;
    if (!roles.includes(user.role)) return <Navigate to="/login" />;
    return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<DashboardLayout />}>
            <Route path="/admin" element={
                <PrivateRoute roles={['ADMIN']}>
                    <AdminDashboard />
                </PrivateRoute>
            } />
            
            <Route path="/manager" element={
                <PrivateRoute roles={['MANAGER']}>
                    <ManagerDashboard />
                </PrivateRoute>
            } />
            <Route path="/employee" element={
                <PrivateRoute roles={['EMPLOYEE']}>
                     <EmployeeDashboard />
                </PrivateRoute>
            } />
            {/* Add placeholders for other routes */}
            <Route path="/tasks" element={<div className="p-8">Tasks View (Use Employee Dashboard)</div>} />
            <Route path="/teams" element={
                <PrivateRoute roles={['MANAGER']}>
                    <Teams />
                </PrivateRoute>
            } />
            <Route path="/timesheet" element={
                <PrivateRoute roles={['MANAGER', 'EMPLOYEE']}>
                    <Timesheet />
                </PrivateRoute>
            } />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
