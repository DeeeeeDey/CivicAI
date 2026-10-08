import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { ArrowRight, Activity, Map, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { scrollReveal, staggerContainer, hoverCard } from '../lib/motion';
import axios from 'axios';

export const Home = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 100]);
  const [stats, setStats] = useState({ total: 0, resolved: 0 });

  useEffect(() => {
    // We would use useQuery here, but for simplicity in the landing page component we fetch directly or spoof until API is wired
    setStats({ total: 1542, resolved: 89 });
  }, []);

  return (
    <div className="flex flex-col w-full overflow-hidden">
      
      {/* 1. HERO */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-16 px-6 text-center z-10">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="mb-6">
          <Link to="/transparency">
            <Badge className="bg-white/50 backdrop-blur-md border-white text-ink-700 shadow-sm py-1.5 px-4 font-semibold hover:bg-white/80 transition-colors">
              New Now live in Kolkata &rarr;
            </Badge>
          </Link>
        </motion.div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold tracking-tight text-ink-900 max-w-5xl leading-[1.05] mb-6">
          <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8, delay:0.1}}>From </motion.span>
          <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8, delay:0.2}}>civic </motion.span>
          <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8, delay:0.3}}>complaints </motion.span>
          <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8, delay:0.4}}>to </motion.span>
          <br className="hidden md:block"/>
          <motion.span 
            initial={{opacity:0, filter:"blur(10px)"}} 
            animate={{opacity:1, filter:"blur(0px)"}} 
            transition={{duration:1, delay:0.7, ease:"easeOut"}}
            className="font-serif italic text-accent font-normal"
          >
            intelligent action.
          </motion.span>
        </h1>
        
        <motion.p 
          initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.9, duration:0.6}}
          className="text-lg md:text-xl text-ink-500 max-w-2xl mb-10"
        >
          Report an issue in 30 seconds. CivicAI classifies it, routes it to the right department, and shows you every step until it's fixed.
        </motion.p>
        
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:1.1, duration:0.6}} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/login" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-[0_8px_20px_rgba(194,104,58,0.25)]">Report an issue</Button>
          </Link>
          <Link to="/track" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full border border-white/50 bg-white/40">Track a complaint</Button>
          </Link>
        </motion.div>

        {/* Floating Mini Dashboard Preview */}
        <motion.div 
          style={{ y: heroY }}
          initial={{opacity:0, y:100}} animate={{opacity:1, y:0}} transition={{delay:1.4, duration:1, type:"spring"}}
          className="mt-20 relative w-full max-w-4xl"
        >
          {/* Floating chips */}
          <motion.div animate={{y:[-10, 10, -10]}} transition={{duration:5, repeat:Infinity, ease:"easeInOut"}} className="absolute -top-6 -left-6 z-20 hidden md:block">
             <GlassCard className="py-2 px-4 shadow-xl"><span className="text-sm font-bold flex gap-2 items-center"><AlertCircle size={16} className="text-danger"/> Pothole · Severity 4</span></GlassCard>
          </motion.div>
          <motion.div animate={{y:[10, -10, 10]}} transition={{duration:6, repeat:Infinity, ease:"easeInOut"}} className="absolute top-1/4 -right-12 z-20 hidden md:block">
             <GlassCard className="py-2 px-4 shadow-xl"><span className="text-sm font-bold flex gap-2 items-center"><CheckCircle2 size={16} className="text-success"/> Verified</span></GlassCard>
          </motion.div>

          {/* Fake Dashboard UI */}
          <div className="glass rounded-t-3xl border-b-0 p-2 md:p-4 overflow-hidden h-[300px] [mask-image:linear-gradient(to_bottom,white_40%,transparent_100%)] relative">
             <div className="bg-bg-base/80 w-full h-full rounded-2xl border border-white/40 p-4 md:p-6 flex gap-6">
                {/* Sidebar mock */}
                <div className="w-48 hidden md:flex flex-col gap-3">
                   <div className="h-4 w-24 bg-ink-900/10 rounded mb-4"></div>
                   <div className="h-8 w-full bg-accent/10 rounded-lg"></div>
                   <div className="h-8 w-full bg-ink-900/5 rounded-lg"></div>
                   <div className="h-8 w-full bg-ink-900/5 rounded-lg"></div>
                </div>
                {/* Main mock */}
                <div className="flex-1 flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                     <div className="h-6 w-32 bg-ink-900/10 rounded"></div>
                     <div className="h-8 w-8 bg-ink-900/10 rounded-full"></div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                     <div className="h-20 bg-white/60 rounded-xl border border-white"></div>
                     <div className="h-20 bg-white/60 rounded-xl border border-white"></div>
                     <div className="h-20 bg-white/60 rounded-xl border border-white"></div>
                   </div>
                   <div className="h-32 w-full bg-white/60 rounded-xl border border-white"></div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="bg-bg-linen dark:bg-[#26211B] py-8 border-y border-ink-900/5 relative z-20">
         <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-ink-900/10">
            <div className="text-center"><p className="text-4xl font-bold tabular-nums font-serif text-accent">{stats.total}</p><p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mt-1">Issues Reported</p></div>
            <div className="text-center"><p className="text-4xl font-bold tabular-nums font-serif text-accent">{stats.resolved}%</p><p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mt-1">Resolution Rate</p></div>
            <div className="text-center"><p className="text-4xl font-bold tabular-nums font-serif text-accent">48h</p><p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mt-1">Avg Time to Fix</p></div>
            <div className="text-center"><p className="text-4xl font-bold tabular-nums font-serif text-accent">10</p><p className="text-sm font-semibold uppercase tracking-wider text-ink-500 mt-1">Wards Active</p></div>
         </div>
      </section>

      {/* 3. THE PROBLEM */}
      <section className="py-32 px-6 max-w-6xl mx-auto w-full">
         <motion.div variants={scrollReveal} initial="initial" whileInView="whileInView" className="grid md:grid-cols-2 gap-16 items-center">
            <div>
               <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-ink-300 text-sm font-bold mb-6">1</span>
               <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">Cities don't lack complaints. <br/> They lack <span className="font-serif italic text-accent font-normal">clarity</span>.</h2>
               <ul className="space-y-6">
                  {[
                    "Duplicate reports clog the system and waste inspector hours.",
                    "Citizens submit vague descriptions with missing locations.",
                    "Tickets are routed to the wrong department, causing delays."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-4 items-start">
                       <div className="mt-1 bg-accent/10 p-1 rounded-full"><CheckCircle2 size={16} className="text-accent"/></div>
                       <p className="text-lg text-ink-700">{text}</p>
                    </li>
                  ))}
               </ul>
            </div>
            <div className="relative">
               <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800" alt="Damaged Road" className="rounded-3xl shadow-2xl object-cover h-[500px] w-full" />
               <GlassCard className="absolute -bottom-6 -left-6 max-w-xs shadow-xl backdrop-blur-xl bg-white/70">
                  <p className="font-bold">Manual Review</p>
                  <p className="text-sm text-ink-500">Currently takes 4-5 days just to verify and route this issue.</p>
               </GlassCard>
            </div>
         </motion.div>
      </section>

      {/* Other Sections Omitted for Brevity in this pass but layout applies... */}
      {/* 10. CTA */}
      <section className="bg-bg-sand py-32 px-6 text-center border-t border-ink-900/5">
         <h2 className="text-4xl md:text-5xl font-bold mb-6">Your city is listening. <br/> <span className="font-serif italic text-accent font-normal">Tell it what's broken.</span></h2>
         <Link to="/login"><Button className="h-14 px-8 text-lg rounded-full">Report an issue now</Button></Link>
      </section>

    </div>
  );
};
