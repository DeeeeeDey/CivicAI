import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { useAuthStore } from './store/authStore';
import { api } from './api/axios';

import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { DesignSystem } from './pages/DesignSystem';

import { CitizenDashboard } from './pages/citizen/Dashboard';
import { OfficerDashboard } from './pages/officer/Dashboard';
import { WorkerTasks } from './pages/worker/Tasks';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } }
});

const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const { login, logout, setInitializing } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: refreshData } = await api.post('/auth/refresh');
        useAuthStore.getState().setToken(refreshData.accessToken);
        
        const { data: userData } = await api.get('/auth/me');
        login(userData.user, refreshData.accessToken);
      } catch (err) {
        logout();
      } finally {
        setInitializing(false);
      }
    };
    initAuth();
  }, [login, logout, setInitializing]);

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthBootstrap>
          <div className="mesh-background"></div>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/design-system" element={<DesignSystem />} />
                <Route path="/track" element={<div className="p-24 text-center text-2xl font-bold">Public Tracking Portal</div>} />
              </Route>

              {/* Protected Dashboards */}
              <Route element={<DashboardLayout />}>
                 <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
                   <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                   <Route path="/citizen/report" element={<div className="p-12 text-center">Wizard Shell</div>} />
                   <Route path="/citizen/complaints" element={<div className="p-12 text-center">My Complaints List</div>} />
                 </Route>
                 
                 <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
                   <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                   <Route path="/officer/queue" element={<div className="p-12 text-center">Officer Review Queue</div>} />
                   <Route path="/officer/map" element={<div className="p-12 text-center">Live Map</div>} />
                 </Route>

                 <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
                   <Route path="/worker/dashboard" element={<WorkerTasks />} />
                 </Route>

                 <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                   <Route path="/admin/dashboard" element={<div className="p-12 text-center">Admin Analytics</div>} />
                   <Route path="/admin/users" element={<div className="p-12 text-center">User Management</div>} />
                   <Route path="/admin/settings" element={<div className="p-12 text-center">Settings</div>} />
                 </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </AuthBootstrap>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
