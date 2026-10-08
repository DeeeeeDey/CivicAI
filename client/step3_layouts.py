import os

files = {
    "src/layouts/PublicLayout.tsx": """import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Leaf, Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '../components/ui/GlassCard';

export const PublicLayout = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'How it works', path: '/how-it-works' },
    { name: 'Transparency', path: '/transparency' },
    { name: 'Track', path: '/track' },
    { name: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 transition-all duration-300 w-[95%] max-w-5xl rounded-full",
          scrolled ? "glass" : "bg-transparent"
        )}
      >
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
          <Leaf className="text-accent" />
          CivicAI
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="relative px-4 py-2 text-[15px] font-medium text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white transition-colors">
                {isActive && (
                  <motion.div layoutId="nav-pill" className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <span className="relative z-10">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
             <Link to={`/${user.role.toLowerCase()}/dashboard`}>
                <Button>Go to dashboard</Button>
             </Link>
          ) : (
             <>
                <Link to="/login"><Button variant="ghost">Log in</Button></Link>
                <Link to="/login"><Button className="gap-2">Report an issue <ArrowRight size={16}/></Button></Link>
             </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}>
          <Menu size={24} className="text-ink-900 dark:text-white" />
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 glass flex flex-col p-6"
          >
            <div className="flex justify-end">
              <button onClick={() => setMobileOpen(false)} className="p-2 bg-white/20 rounded-full"><X size={24}/></button>
            </div>
            <div className="flex flex-col gap-6 mt-12 text-2xl font-semibold px-4">
               {navItems.map(i => (
                 <Link key={i.path} to={i.path} onClick={() => setMobileOpen(false)} className="border-b border-ink-900/10 pb-4">{i.name}</Link>
               ))}
               {!user && <Link to="/login" onClick={() => setMobileOpen(false)} className="text-accent mt-4">Log in</Link>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-bg-linen dark:bg-[#1C1814] py-16 mt-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
           <div>
              <Link to="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-ink-900 dark:text-white mb-4">
                <Leaf className="text-accent" /> CivicAI
              </Link>
              <p className="text-ink-500 text-sm">Empowering cities through transparent, AI-driven civic action.</p>
           </div>
           <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-ink-500">
                <li><Link to="/how-it-works" className="hover:text-accent">How it works</Link></li>
                <li><Link to="/track" className="hover:text-accent">Track an issue</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-semibold mb-4">City</h4>
              <ul className="space-y-2 text-sm text-ink-500">
                <li><Link to="/transparency" className="hover:text-accent">Transparency</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-semibold mb-4">Get city updates</h4>
              <div className="flex gap-2">
                 <input type="email" placeholder="Email address" className="px-4 py-2 rounded-xl text-sm bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-accent w-full" />
                 <Button className="px-4 py-2">Subscribe</Button>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};
""",

    "src/layouts/DashboardLayout.tsx": """import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { LogOut, Home, FileText, CheckCircle, BarChart2, Users, Map as MapIcon, PlusCircle, Settings, Bell, Search, Leaf, Moon, Sun } from 'lucide-react';

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
      { section: 'Platform', items: [
        { name: 'Overview', path: '/citizen/dashboard', icon: Home },
        { name: 'Report Issue', path: '/citizen/report', icon: PlusCircle },
        { name: 'My Complaints', path: '/citizen/complaints', icon: FileText },
        { name: 'Community Map', path: '/citizen/map', icon: MapIcon }
      ]},
      { section: 'Account', items: [
        { name: 'Notifications', path: '/citizen/notifications', icon: Bell },
        { name: 'Settings', path: '/citizen/settings', icon: Settings }
      ]}
    ],
    OFFICER: [
      { section: 'Management', items: [
        { name: 'Overview', path: '/officer/dashboard', icon: BarChart2 },
        { name: 'Complaint Queue', path: '/officer/queue', icon: FileText },
        { name: 'Verification Queue', path: '/officer/verification', icon: CheckCircle },
        { name: 'Duplicates', path: '/officer/duplicates', icon: Users },
      ]},
      { section: 'Resources', items: [
        { name: 'Workers', path: '/officer/workers', icon: Users },
        { name: 'Analytics', path: '/officer/analytics', icon: BarChart2 },
        { name: 'Settings', path: '/officer/settings', icon: Settings }
      ]}
    ],
    WORKER: [
      { section: 'Duties', items: [
        { name: 'My Tasks', path: '/worker/dashboard', icon: CheckCircle },
        { name: 'History', path: '/worker/history', icon: FileText }
      ]},
      { section: 'Account', items: [
        { name: 'Profile', path: '/worker/profile', icon: Users }
      ]}
    ],
    ADMIN: [
      { section: 'System', items: [
        { name: 'Overview', path: '/admin/dashboard', icon: BarChart2 },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Departments', path: '/admin/departments', icon: FileText },
        { name: 'Audit Logs', path: '/admin/logs', icon: Search },
        { name: 'Settings', path: '/admin/settings', icon: Settings }
      ]}
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
              {!collapsed && <h3 className="text-[11px] font-bold text-ink-300 uppercase tracking-widest mb-3 ml-2">{group.section}</h3>}
              <nav className="space-y-1">
                {group.items.map(link => {
                  const active = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link key={link.path} to={link.path} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[12px] font-medium text-sm transition-colors ${active ? 'text-accent-hover dark:text-accent-soft' : 'text-ink-700 hover:bg-black/5 dark:text-ink-300 dark:hover:bg-white/5'}`}>
                      {active && <motion.div layoutId="sidebar-pill" className="absolute inset-0 bg-accent/10 dark:bg-accent/20 rounded-[12px]" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                      <Icon size={18} className="relative z-10 flex-shrink-0" />
                      {!collapsed && <span className="relative z-10 truncate">{link.name}</span>}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-ink-900/10 dark:border-white/10 flex items-center justify-between">
           {!collapsed && (
             <div className="flex flex-col truncate">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-[11px] text-ink-500 uppercase tracking-wider">{user.role}</span>
             </div>
           )}
           <button onClick={handleLogout} className="p-2 text-danger hover:bg-danger/10 rounded-lg mx-auto" title="Log out">
             <LogOut size={18} />
           </button>
        </div>
      </motion.aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 glass border-b border-white/40 dark:border-white/5 px-6 flex items-center justify-between z-10">
           <div className="flex items-center gap-4">
              <button className="hidden md:block p-2 text-ink-500 hover:bg-black/5 rounded-lg" onClick={() => setCollapsed(!collapsed)}>
                 <Menu size={20} />
              </button>
              {/* Mobile Branding */}
              <div className="md:hidden font-bold flex items-center gap-2"><Leaf className="text-accent" size={18}/> CivicAI</div>
           </div>
           
           <div className="flex items-center gap-3">
              <button className="p-2 text-ink-500 hover:bg-black/5 rounded-full"><Search size={20} /></button>
              <button className="p-2 text-ink-500 hover:bg-black/5 rounded-full relative">
                 <Bell size={20} />
                 <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-white"></span>
              </button>
              <button onClick={toggleTheme} className="p-2 text-ink-500 hover:bg-black/5 rounded-full">
                 {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm ml-2">
                 {user.name.charAt(0)}
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
               {navGroups[0].items.slice(0, 4).map(link => {
                  const active = location.pathname === link.path;
                  const Icon = link.icon;
                  return (
                    <Link key={link.path} to={link.path} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-accent' : 'text-ink-500'}`}>
                       <Icon size={20} />
                       <span className="text-[10px] font-medium">{link.name}</span>
                    </Link>
                  )
               })}
            </div>
         </nav>
      )}
    </div>
  );
};
"""
}

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Step 3 Layouts generated.")
