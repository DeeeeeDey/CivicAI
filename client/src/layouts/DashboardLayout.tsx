import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import {
  LogOut,
  Home,
  FileText,
  CheckCircle,
  BarChart2,
  Users,
  Map as MapIcon,
  PlusCircle,
  Settings,
  Bell,
  Search,
  Leaf,
  Moon,
  Sun,
  Menu,
  ShieldCheck,
  Briefcase,
  Copy
} from 'lucide-react';
import { LocationPill } from '../components/LocationPill';

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLinks = {
    CITIZEN: [
      {
        section: 'Platform',
        items: [
          { name: 'Overview', path: '/citizen/dashboard', icon: Home },
          { name: 'Report Issue', path: '/citizen/report', icon: PlusCircle },
          { name: 'My Complaints', path: '/citizen/complaints', icon: FileText },
          { name: 'Community Map', path: '/citizen/map', icon: MapIcon },
          { name: 'Notifications', path: '/citizen/notifications', icon: Bell }
        ]
      }
    ],
    OFFICER: [
      {
        section: 'Operations & Triage',
        items: [
          { name: 'Command Center', path: '/officer/dashboard', icon: BarChart2 },
          { name: 'Complaint Queue', path: '/officer/queue', icon: FileText },
          { name: 'Verification Queue', path: '/officer/verification', icon: ShieldCheck },
          { name: 'Duplicate Queue', path: '/officer/duplicates', icon: Copy }
        ]
      },
      {
        section: 'Resources & Insights',
        items: [
          { name: 'Field Workers', path: '/officer/workers', icon: Users },
          { name: 'Analytics', path: '/officer/analytics', icon: BarChart2 }
        ]
      }
    ],
    WORKER: [
      {
        section: 'Field Operations',
        items: [
          { name: 'My Route', path: '/worker/dashboard', icon: CheckCircle },
          { name: 'Completed History', path: '/worker/history', icon: FileText }
        ]
      }
    ],
    ADMIN: [
      {
        section: 'Platform Administration',
        items: [
          { name: 'Overview', path: '/admin/dashboard', icon: BarChart2 },
          { name: 'User Directory', path: '/admin/users', icon: Users },
          { name: 'All Complaints', path: '/admin/complaints', icon: FileText },
          { name: 'Platform Settings', path: '/admin/settings', icon: Settings }
        ]
      }
    ]
  };

  const navGroups = roleLinks[user.role as keyof typeof roleLinks] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base dark:bg-[#1B1713]">
      {/* Sidebar Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        className="hidden md:flex flex-col glass border-r border-white/40 dark:border-white/5 z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-2 font-bold tracking-tight text-xl ${collapsed ? 'hidden' : 'block'}`}>
            <Leaf className="text-accent flex-shrink-0" /> CivicAI
          </Link>
          {collapsed && <Leaf className="text-accent flex-shrink-0 mx-auto" />}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <h3 className="text-[11px] font-bold text-ink-300 uppercase tracking-widest mb-3 ml-2">
                  {group.section}
                </h3>
              )}
              <nav className="space-y-1">
                {group.items.map((link) => {
                  const active = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        active
                          ? 'bg-accent text-white shadow-md shadow-accent/20'
                          : 'text-ink-500 hover:text-ink-900 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!collapsed && <span>{link.name}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User info & Logout */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-ink-900 truncate">{user.name}</p>
              <p className="text-[10px] text-ink-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-ink-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors ml-auto"
          >
            <LogOut size={16} />
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 glass border-b border-white/40 dark:border-white/5 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 text-ink-500 hover:bg-black/5 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div className="md:hidden font-bold flex items-center gap-2">
              <Leaf className="text-accent" size={18} /> CivicAI
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LocationPill />
            {user.role === 'CITIZEN' && (
              <Link
                to="/citizen/notifications"
                className="relative p-2 text-ink-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                title="Notifications & Dispatches"
              >
                <Bell size={19} />
              </Link>
            )}
            <button onClick={toggleTheme} className="p-2 text-ink-500 hover:bg-black/5 rounded-full">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm ml-2">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Bar for Citizens & Workers */}
      {(user.role === 'CITIZEN' || user.role === 'WORKER') && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/40 pb-safe z-50">
          <div className="flex justify-around items-center h-16">
            {navGroups[0]?.items?.map((link) => {
              const active = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                    active ? 'text-accent' : 'text-ink-500'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
export default DashboardLayout;
