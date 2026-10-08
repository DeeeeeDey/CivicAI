import os

files = {
    "src/store/authStore.ts": """import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: 'CITIZEN' | 'OFFICER' | 'WORKER' | 'ADMIN';
  email: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, // Start logged out
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
""",

    "src/layouts/PublicLayout.tsx": """import { Outlet, Link } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from '../components/ui/Button';
import { Moon, Sun, Leaf } from 'lucide-react';

export const PublicLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Leaf className="text-apple-blue" />
          CivicAI
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/track" className="text-sm font-medium hover:text-apple-blue transition-colors">Track Complaint</Link>
          <Link to="/design-system" className="text-sm font-medium hover:text-apple-blue transition-colors">UI Kit</Link>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
""",

    "src/layouts/DashboardLayout.tsx": """import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { Moon, Sun, LogOut, Home, FileText, CheckCircle, BarChart2, Users, Map as MapIcon, PlusCircle, Settings } from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getLinks = () => {
    switch(user.role) {
      case 'CITIZEN': return [
        { name: 'Dashboard', path: '/citizen/dashboard', icon: Home },
        { name: 'Report Issue', path: '/citizen/report', icon: PlusCircle },
        { name: 'My Complaints', path: '/citizen/complaints', icon: FileText }
      ];
      case 'OFFICER': return [
        { name: 'Overview', path: '/officer/dashboard', icon: BarChart2 },
        { name: 'Review Queue', path: '/officer/queue', icon: FileText },
        { name: 'Live Map', path: '/officer/map', icon: MapIcon }
      ];
      case 'WORKER': return [
        { name: 'My Tasks', path: '/worker/dashboard', icon: CheckCircle }
      ];
      case 'ADMIN': return [
        { name: 'System Overview', path: '/admin/dashboard', icon: BarChart2 },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Settings', path: '/admin/settings', icon: Settings }
      ];
      default: return [];
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/20 dark:border-white/5 flex flex-col h-full z-20">
        <div className="p-6">
          <h2 className="text-2xl font-bold tracking-tight text-apple-blue mb-1">CivicAI</h2>
          <p className="text-xs text-gray-500 uppercase font-semibold">{user.role} PORTAL</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {getLinks().map((link) => {
            const active = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-apple-blue text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}>
                <Icon size={18} />
                {link.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-black/5 dark:border-white/5">
           <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <div className="flex flex-col">
                 <span className="text-sm font-semibold">{user.name}</span>
                 <span className="text-xs text-gray-500 truncate w-32">{user.email}</span>
              </div>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600"><LogOut size={18}/></button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        <header className="sticky top-0 z-10 glass px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight capitalize">
            {location.pathname.split('/').pop()?.replace('-', ' ')}
          </h1>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>
        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
""",

    "src/pages/Home.tsx": """import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export const Home = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-center">
      <Badge>AI-POWERED URBAN INTELLIGENCE</Badge>
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mt-6 mb-8 text-[#102B4E] dark:text-white leading-tight">
        From civic complaints <br/> to intelligent action.
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-12">
        CivicAI transforms citizen reports into prioritized, actionable, and verifiable municipal workflows using advanced artificial intelligence.
      </p>
      <div className="flex gap-4">
        <Link to="/login"><Button className="px-8 py-4 text-lg">Get Started</Button></Link>
        <Link to="/track"><Button variant="secondary" className="px-8 py-4 text-lg">Track Complaint</Button></Link>
      </div>

      <div className="mt-24 grid md:grid-cols-3 gap-8 w-full text-left">
         <GlassCard>
            <h3 className="text-xl font-bold mb-3">AI Classification</h3>
            <p className="text-gray-600 dark:text-gray-400">Automatically categorizes and routes issues to the correct department within milliseconds.</p>
         </GlassCard>
         <GlassCard>
            <h3 className="text-xl font-bold mb-3">Duplicate Detection</h3>
            <p className="text-gray-600 dark:text-gray-400">Merges similar complaints using geospatial and NLP analysis to prevent worker redundancy.</p>
         </GlassCard>
         <GlassCard>
            <h3 className="text-xl font-bold mb-3">Smart Routing</h3>
            <p className="text-gray-600 dark:text-gray-400">Assigns verified issues to field workers based on ward proximity and current workload.</p>
         </GlassCard>
      </div>
    </div>
  );
};

const Badge = ({children}: any) => <span className="text-xs font-bold uppercase tracking-widest bg-apple-blue/10 text-apple-blue px-4 py-1.5 rounded-full">{children}</span>;
""",

    "src/pages/Login.tsx": """import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handleDemoLogin = (role: 'CITIZEN'|'OFFICER'|'WORKER'|'ADMIN') => {
    login({ id: '1', name: `Demo ${role}`, email: `${role.toLowerCase()}@civicai.com`, role });
    navigate(`/${role.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8">Welcome Back</h2>
        
        <div className="space-y-4 mb-8">
          <Input placeholder="Email Address" defaultValue="citizen@civicai.com" />
          <Input type="password" placeholder="Password" defaultValue="password123" />
          <Button className="w-full" onClick={() => handleDemoLogin('CITIZEN')}>Sign In</Button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
          <p className="text-xs text-center text-gray-500 uppercase font-bold tracking-wider mb-4">Fast Login For Demo</p>
          <div className="grid grid-cols-2 gap-3">
             <Button variant="secondary" onClick={() => handleDemoLogin('CITIZEN')}>Citizen</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('OFFICER')}>Officer</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('WORKER')}>Worker</Button>
             <Button variant="secondary" onClick={() => handleDemoLogin('ADMIN')}>Admin</Button>
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

export const CitizenDashboard = () => {
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

      <div className="grid md:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Reported</h3>
          <p className="text-4xl font-bold">12</p>
        </GlassCard>
        <GlassCard>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">In Progress</h3>
          <p className="text-4xl font-bold text-apple-orange">3</p>
        </GlassCard>
        <GlassCard>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Resolved</h3>
          <p className="text-4xl font-bold text-apple-green">8</p>
        </GlassCard>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6">Recent Activity</h2>
      <div className="space-y-4">
         {[
           {id: 'CIV-2041', title: 'Massive Pothole on Sector V', date: '2 hours ago', status: 'IN_PROGRESS', color: 'orange'},
           {id: 'CIV-2038', title: 'Streetlight completely broken', date: '1 day ago', status: 'RESOLVED', color: 'green'},
           {id: 'CIV-2015', title: 'Garbage dump near hospital', date: '3 days ago', status: 'UNDER_REVIEW', color: 'blue'}
         ].map(item => (
            <GlassCard key={item.id} className="flex justify-between items-center p-6">
               <div>
                 <div className="flex items-center gap-3 mb-1">
                   <span className="text-sm font-bold text-gray-500">{item.id}</span>
                   <h4 className="text-lg font-semibold">{item.title}</h4>
                 </div>
                 <p className="text-sm text-gray-500">{item.date}</p>
               </div>
               <Badge color={item.color}>{item.status.replace('_', ' ')}</Badge>
            </GlassCard>
         ))}
      </div>
    </div>
  );
};
""",

    "src/pages/officer/Dashboard.tsx": """import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';

export const OfficerDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-4 gap-6">
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">Pending Review</h3><p className="text-3xl font-bold text-apple-blue">42</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">AI Flagged Duplicates</h3><p className="text-3xl font-bold text-apple-orange">18</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">Active Field Tasks</h3><p className="text-3xl font-bold">156</p></GlassCard>
        <GlassCard><h3 className="text-gray-500 text-xs font-semibold uppercase mb-1">SLA Breaches</h3><p className="text-3xl font-bold text-apple-red">3</p></GlassCard>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4">Urgent Queue</h2>
            {[1,2,3].map(i => (
              <GlassCard key={i} className="p-5 flex justify-between items-start">
                 <div>
                    <div className="flex gap-2 mb-2">
                      <Badge color="red">Critical Severity</Badge>
                      <Badge color="blue">Water Leakage</Badge>
                    </div>
                    <h4 className="font-bold text-lg">Main Pipe Burst at Salt Lake</h4>
                    <p className="text-sm text-gray-500 mt-1">AI Confidence: 94% • Est. Duplicate: No</p>
                 </div>
                 <button className="bg-apple-blue text-white px-4 py-2 rounded-lg text-sm font-semibold">Review</button>
              </GlassCard>
            ))}
         </div>
         <div>
            <h2 className="text-xl font-bold mb-4">Live Map</h2>
            <GlassCard className="h-[400px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden relative p-0">
               <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-50 mix-blend-luminosity"></div>
               <div className="relative z-10 text-center bg-black/50 backdrop-blur-md p-4 rounded-xl text-white">Interactive Map Rendering...</div>
            </GlassCard>
         </div>
      </div>
    </div>
  );
};
""",

    "src/pages/worker/Tasks.tsx": """import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const WorkerTasks = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Today's Assigned Route</h1>
      
      {[
        {id: 'CIV-2033', type: 'Pothole Repair', address: 'Sector V, Near SDF Building', status: 'ASSIGNED', priority: 'High'},
        {id: 'CIV-1982', type: 'Fallen Tree', address: 'Park Street Crossing', status: 'IN_PROGRESS', priority: 'Critical'},
      ].map(task => (
        <GlassCard key={task.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-sm font-bold text-gray-500">{task.id}</span>
                 <Badge color={task.priority === 'Critical' ? 'red' : 'orange'}>{task.priority}</Badge>
              </div>
              <h3 className="text-xl font-bold">{task.type}</h3>
              <p className="text-gray-500 text-sm mt-1">📍 {task.address}</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              {task.status === 'ASSIGNED' ? (
                 <Button className="w-full md:w-auto">Start Job</Button>
              ) : (
                 <Button className="w-full md:w-auto !bg-apple-green">Upload Proof & Resolve</Button>
              )}
           </div>
        </GlassCard>
      ))}
    </div>
  );
};
""",

    "src/App.tsx": """import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';

import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { DesignSystem } from './pages/DesignSystem';

import { CitizenDashboard } from './pages/citizen/Dashboard';
import { OfficerDashboard } from './pages/officer/Dashboard';
import { WorkerTasks } from './pages/worker/Tasks';

function App() {
  return (
    <ThemeProvider>
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
             <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
             <Route path="/citizen/report" element={<div className="p-12 text-center text-xl">AI Complaint Wizard Shell</div>} />
             <Route path="/citizen/complaints" element={<div className="p-12 text-center text-xl">My Complaints List</div>} />
             
             <Route path="/officer/dashboard" element={<OfficerDashboard />} />
             <Route path="/officer/queue" element={<div className="p-12 text-center text-xl">Officer Review Queue</div>} />
             <Route path="/officer/map" element={<div className="p-12 text-center text-xl">Live Heatmap Shell</div>} />

             <Route path="/worker/dashboard" element={<WorkerTasks />} />

             <Route path="/admin/dashboard" element={<div className="p-12 text-center text-xl">Admin Analytics Shell</div>} />
             <Route path="/admin/users" element={<div className="p-12 text-center text-xl">User Management</div>} />
             <Route path="/admin/settings" element={<div className="p-12 text-center text-xl">SLA Settings</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
"""
}

import os
os.makedirs('src/store', exist_ok=True)
os.makedirs('src/layouts', exist_ok=True)
os.makedirs('src/pages/citizen', exist_ok=True)
os.makedirs('src/pages/officer', exist_ok=True)
os.makedirs('src/pages/worker', exist_ok=True)
os.makedirs('src/pages/admin', exist_ok=True)

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Full site scaffolding complete.")
