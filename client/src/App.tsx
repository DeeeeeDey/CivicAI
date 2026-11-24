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
import { LightboxProvider } from './components/ui/ImageLightbox';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DesignSystem } from './pages/DesignSystem';
import { Transparency } from './pages/Transparency';
import { Track } from './pages/Track';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { MapPage } from './pages/MapPage';

import { AdminOverview } from './pages/admin/Overview';
import { AdminUsersPage } from './pages/admin/UsersPage';
import { AdminComplaintsPage } from './pages/admin/ComplaintsPage';
import { AdminSettingsPage } from './pages/admin/SettingsPage';

import { CitizenDashboard } from './pages/citizen/Dashboard';
import { MyComplaints } from './pages/citizen/MyComplaints';
import { ReportIssue } from './pages/citizen/ReportIssue';
import { NotificationsPage } from './pages/citizen/NotificationsPage';
import { CitizenSettingsPage } from './pages/citizen/SettingsPage';

import { OfficerDashboard } from './pages/officer/Dashboard';
import { OfficerQueuePage } from './pages/officer/QueuePage';
import { OfficerVerificationPage } from './pages/officer/VerificationPage';
import { OfficerDuplicatesPage } from './pages/officer/DuplicatesPage';
import { OfficerWorkersPage } from './pages/officer/WorkersPage';
import { OfficerAnalyticsPage } from './pages/officer/AnalyticsPage';

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
          <LightboxProvider>
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
                  <Route path="/track/:id" element={<Track />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/report" element={<Navigate to="/citizen/report" replace />} />
                  
                  {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystem />} />}
                </Route>

                {/* Protected Dashboards */}
                <Route element={<DashboardLayout />}>
                   {/* Citizen Suite */}
                   <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
                     <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                     <Route path="/citizen/report" element={<ReportIssue />} />
                     <Route path="/citizen/complaints" element={<MyComplaints />} />
                     <Route path="/citizen/map" element={<MapPage />} />
                     <Route path="/citizen/notifications" element={<NotificationsPage />} />
                     <Route path="/citizen/settings" element={<CitizenSettingsPage />} />
                   </Route>
                   
                   {/* Officer Operations Suite */}
                   <Route element={<ProtectedRoute allowedRoles={['OFFICER']} />}>
                     <Route path="/officer/dashboard" element={<OfficerDashboard />} />
                     <Route path="/officer/queue" element={<OfficerQueuePage />} />
                     <Route path="/officer/verification" element={<OfficerVerificationPage />} />
                     <Route path="/officer/duplicates" element={<OfficerDuplicatesPage />} />
                     <Route path="/officer/workers" element={<OfficerWorkersPage />} />
                     <Route path="/officer/analytics" element={<OfficerAnalyticsPage />} />
                   </Route>

                   {/* Worker Field Suite */}
                   <Route element={<ProtectedRoute allowedRoles={['WORKER']} />}>
                     <Route path="/worker/dashboard" element={<WorkerTasks />} />
                     <Route path="/worker/history" element={<WorkerTasks />} />
                   </Route>

                   {/* Admin Suite */}
                   <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                     <Route path="/admin/dashboard" element={<AdminOverview />} />
                     <Route path="/admin/users" element={<AdminUsersPage />} />
                     <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
                     <Route path="/admin/map" element={<MapPage />} />
                     <Route path="/admin/settings" element={<AdminSettingsPage />} />
                   </Route>
                </Route>
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </LightboxProvider>
        </AuthBootstrap>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
