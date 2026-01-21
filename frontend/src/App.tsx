import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Teams from './pages/Teams';
import Timesheet from './pages/Timesheet';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Board from './pages/Board';
import EmployeeReports from './pages/EmployeeReports';
import Profile from './pages/Profile';
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
            <Route path="/tasks" element={
                <PrivateRoute roles={['MANAGER', 'EMPLOYEE']}>
                    <Tasks />
                </PrivateRoute>
            } />
            <Route path="/reports" element={
                <PrivateRoute roles={['MANAGER']}>
                    <Reports />
                </PrivateRoute>
            } />
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
            <Route path="/board" element={
                <PrivateRoute roles={['EMPLOYEE']}>
                    <Board />
                </PrivateRoute>
            } />
            <Route path="/employee-reports" element={
                <PrivateRoute roles={['EMPLOYEE']}>
                    <EmployeeReports />
                </PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute roles={['ADMIN', 'MANAGER', 'EMPLOYEE']}>
                    <Profile />
                </PrivateRoute>
            } />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
