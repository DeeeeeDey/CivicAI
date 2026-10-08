import { useState, useEffect } from 'react';
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
