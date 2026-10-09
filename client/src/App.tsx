import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { useAuthStore } from './store/authStore';
import { api } from './api/axios';

import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DesignSystem } from './pages/DesignSystem';
import { Transparency } from './pages/Transparency';
import { Track } from './pages/Track';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { MapPage } from './pages/MapPage';

import { AdminDashboard } from './pages/admin/Dashboard';
import { CitizenDashboard } from './pages/citizen/Dashboard';
import { MyComplaints } from './pages/citizen/MyComplaints';
import { ReportIssue } from './pages/citizen/ReportIssue';
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
  const user = useAuthStore(s => s.user);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthBootstrap>
          <div className="mesh-background"></div>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace /> : <Login />} />
                <Route path="/register" element={user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace /> : <Register />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/transparency" element={<Transparency />} />
                <Route path="/track" element={<Track />} />
                <Route path="/about" element={<About />} />
                <Route path="/map" element={<MapPage />} />
                
                {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}
              </Route>

              {/* Protected Dashboards */}
              <Route element={<DashboardLayout />}>
                 <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
                   <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                   <Route path="/citizen/report" element={<ReportIssue />} />
                   <Route path="/citizen/complaints" element={<MyComplaints />} />
                   <Route path="/citizen/map" element={<div className="p-12 text-center text-ink-900">Community Map (To do)</div>} />
                   <Route path="/citizen/notifications" element={<div className="p-12 text-center text-ink-900">Notifications</div>} />
                   <Route path="/citizen/settings" element={<div className="p-12 text-center text-ink-900">Settings</div>} />
                 </Route>
                 
                 <Route element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
                   <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                   <Route path="/officer/queue" element={<OfficerDashboard />} />
                   <Route path="/officer/verification" element={<div className="p-12 text-center text-ink-900">Verification Queue (To do)</div>} />
                   <Route path="/officer/duplicates" element={<div className="p-12 text-center text-ink-900">Duplicates Manager</div>} />
                   <Route path="/officer/workers" element={<div className="p-12 text-center text-ink-900">Workers List</div>} />
                   <Route path="/officer/analytics" element={<div className="p-12 text-center text-ink-900">Analytics</div>} />
                   <Route path="/officer/settings" element={<div className="p-12 text-center text-ink-900">Settings</div>} />
                 </Route>

                 <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
                   <Route path="/worker/dashboard" element={<WorkerTasks />} />
                   <Route path="/worker/history" element={<div className="p-12 text-center text-ink-900">Task History</div>} />
                   <Route path="/worker/profile" element={<div className="p-12 text-center text-ink-900">Profile</div>} />
                 </Route>

                 <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                   <Route path="/admin/dashboard" element={<div className="p-12 text-center text-ink-900">Admin Dashboard</div>} />
                   <Route path="/admin/users" element={<div className="p-12 text-center text-ink-900">Users</div>} />
                   <Route path="/admin/departments" element={<div className="p-12 text-center text-ink-900">Departments</div>} />
                   <Route path="/admin/logs" element={<div className="p-12 text-center text-ink-900">Audit Logs</div>} />
                   <Route path="/admin/settings" element={<div className="p-12 text-center text-ink-900">Settings</div>} />
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
