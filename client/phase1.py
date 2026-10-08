import os

files = {
    "src/api/axios.ts": """import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('http://localhost:4000/api/auth/refresh', {}, { withCredentials: true });
        useAuthStore.getState().setToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
""",

    "src/store/authStore.ts": """import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: 'CITIZEN' | 'OFFICER' | 'WORKER' | 'ADMIN';
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  login: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
  setToken: (token) => set({ accessToken: token }),
  setInitializing: (val) => set({ isInitializing: val })
}));
""",

    "src/components/ProtectedRoute.tsx": """import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
  const { user, isInitializing } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-12 text-center text-red-500 font-bold text-2xl">403 Forbidden: You don't have access to this portal.</div>;
  }

  return <Outlet />;
};
""",

    "src/hooks/queries.ts": """import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/axios';

export const useComplaints = () => {
  return useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data } = await api.get('/complaints');
      return data;
    }
  });
};

export const useWorkerTasks = () => {
  return useQuery({
    queryKey: ['workerTasks'],
    queryFn: async () => {
      const { data } = await api.get('/workers/tasks');
      return data;
    }
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    }
  });
};
""",

    "src/App.tsx": """import { useEffect } from 'react';
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
""",

    "src/pages/Login.tsx": """import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/axios';

export const Login = () => {
  const loginFn = useAuthStore(s => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      loginFn(data.user, data.accessToken);
      const target = from !== '/' ? from : `/${data.user.role.toLowerCase()}/dashboard`;
      navigate(target, { replace: true });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Login failed');
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    loginMutation.mutate({ email: roleEmail, password: 'password123' });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          {errorMsg && <div className="text-red-500 text-sm text-center font-medium bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">{errorMsg}</div>}
          <Input 
            placeholder="Email Address" 
            value={email} 
            onChange={(e: any) => setEmail(e.target.value)} 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
          />
          <Button className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <p className="text-xs text-center text-gray-500 uppercase font-bold tracking-wider mb-4">Fast Login For Demo</p>
          <div className="grid grid-cols-2 gap-3">
             <Button variant="secondary" onClick={() => handleDemoLogin('citizen@civicai.com')}>Citizen</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('officer@civicai.com')}>Officer</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('worker@civicai.com')}>Worker</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('admin@civicai.com')}>Admin</Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
""",

    "src/pages/citizen/Dashboard.tsx": """import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../hooks/queries';

export const CitizenDashboard = () => {
  const { data: complaints, isLoading } = useComplaints();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold mb-2">My Overview</h1>
            <p className="text-gray-500">Track and manage your community reports.</p>
         </div>
         <Link to="/citizen/report">
            <Button className="flex items-center gap-2"><PlusCircle size={18}/> New Report</Button>
         </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div></div></div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Reported</h3>
              <p className="text-4xl font-bold">{complaints?.length || 0}</p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">In Progress</h3>
              <p className="text-4xl font-bold text-apple-orange">
                {complaints?.filter((c:any) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length || 0}
              </p>
            </GlassCard>
            <GlassCard>
              <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Resolved</h3>
              <p className="text-4xl font-bold text-apple-green">
                {complaints?.filter((c:any) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length || 0}
              </p>
            </GlassCard>
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6">Recent Activity (Real DB)</h2>
          <div className="space-y-4">
             {complaints?.slice(0, 5).map((item: any) => (
                <GlassCard key={item.id} className="flex justify-between items-center p-6">
                   <div>
                     <div className="flex items-center gap-3 mb-1">
                       <span className="text-sm font-bold text-gray-500">{item.publicId}</span>
                       <h4 className="text-lg font-semibold">{item.category?.name || 'Issue'}</h4>
                     </div>
                     <p className="text-sm text-gray-500 truncate max-w-md">{item.description}</p>
                   </div>
                   <Badge color={item.status === 'RESOLVED' ? 'green' : 'blue'}>{item.status.replace('_', ' ')}</Badge>
                </GlassCard>
             ))}
          </div>
        </>
      )}
    </div>
  );
};
"""
}

import os
os.makedirs('src/api', exist_ok=True)
os.makedirs('src/hooks', exist_ok=True)
os.makedirs('src/components', exist_ok=True)

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Phase 1 implementation complete.")
