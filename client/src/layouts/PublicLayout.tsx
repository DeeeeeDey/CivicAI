import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Leaf, Menu, X } from 'lucide-react';
import { LocationPill } from '../components/LocationPill';

export const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/' },
    { name: 'How it works', path: '/how-it-works' },
    { name: 'Issue map', path: '/map' },
    { name: 'Transparency', path: '/transparency' },
    { name: 'Track ticket', path: '/track' },
    { name: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-bg-base text-ink-900">
      {/* Quiet top navigation bar */}
      <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-ink-900 tracking-tight">
            <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Leaf size={16} />
            </span>
            <span>CivicAI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-ink-900 font-semibold"
                      : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LocationPill />
            {user ? (
              <Link to={`/${user.role.toLowerCase()}/dashboard`}>
                <Button variant="secondary" className="text-xs h-9 px-3">
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-ink-500 hover:text-ink-900 px-2 py-1">
                  Log in
                </Link>
                <Link to="/citizen/report">
                  <Button className="text-xs h-9 px-3.5">
                    Report an issue
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-ink-500 hover:text-ink-900"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-surface h-full shadow-xl flex flex-col z-10 border-r border-border p-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <span className="font-semibold text-lg text-ink-900">CivicAI</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-ink-500 hover:text-ink-900"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-3 mt-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm py-2 px-2 rounded-md ${
                    location.pathname === item.path
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-ink-700 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6 border-t border-border flex flex-col gap-2">
              {user ? (
                <Link to={`/${user.role.toLowerCase()}/dashboard`} onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Open dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/citizen/report" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full">Report an issue</Button>
                  </Link>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm text-ink-500 py-2">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Quiet, structured footer */}
      <footer className="border-t border-border bg-surface py-12 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-semibold text-ink-900 mb-2">
              <span className="w-6 h-6 rounded bg-accent/10 text-accent flex items-center justify-center">
                <Leaf size={14} />
              </span>
              <span>CivicAI</span>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              Open civic complaint triage and verified repair tracking for municipal districts.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider mb-3">System</p>
            <ul className="space-y-2 text-xs text-ink-500">
              <li><Link to="/how-it-works" className="hover:text-ink-900">How it works</Link></li>
              <li><Link to="/track" className="hover:text-ink-900">Track a ticket</Link></li>
              <li><Link to="/map" className="hover:text-ink-900">Public issue map</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider mb-3">Governance</p>
            <ul className="space-y-2 text-xs text-ink-500">
              <li><Link to="/transparency" className="hover:text-ink-900">Transparency ledger</Link></li>
              <li><Link to="/about" className="hover:text-ink-900">About the initiative</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-900 uppercase tracking-wider mb-3">Municipal Office</p>
            <p className="text-xs text-ink-500 leading-relaxed">
              Metropolitan Operations Hub. Complaints are archived in public audit logs with photographic proof upon verification.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
