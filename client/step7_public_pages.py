import os

files = {
    "src/pages/Transparency.tsx": """import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';
import { scrollReveal, staggerContainer } from '../lib/motion';

export const Transparency = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto w-full">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="text-center mb-16">
         <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">Live City Data</Badge>
         <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-ink-900 mb-4">Transparency <span className="font-serif italic text-accent font-normal">Dashboard</span></h1>
         <p className="text-ink-500 text-lg max-w-2xl mx-auto">We believe civic action should happen in the open. Track city-wide performance, resolution times, and department efficiency in real time.</p>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
         <div className="grid md:grid-cols-3 gap-6">
            <GlassCard variants={scrollReveal} className="text-center">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">Total Issues Fixed</h3>
               <p className="text-5xl font-serif text-accent">14,203</p>
            </GlassCard>
            <GlassCard variants={scrollReveal} className="text-center">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">City-wide Resolution Rate</h3>
               <p className="text-5xl font-serif text-ink-900">92.4%</p>
            </GlassCard>
            <GlassCard variants={scrollReveal} className="text-center">
               <h3 className="text-ink-300 text-xs font-bold uppercase tracking-widest mb-2">Avg. Resolution Time</h3>
               <p className="text-5xl font-serif text-ink-900">46h</p>
            </GlassCard>
         </div>

         <div className="grid md:grid-cols-2 gap-8 mt-12">
            <GlassCard variants={scrollReveal} className="h-[400px]">
               <h2 className="text-xl font-bold text-ink-900 mb-6">Issues by Department</h2>
               {/* Pure CSS Bar Chart Placeholder to avoid complex library setups on first render */}
               <div className="space-y-4">
                  {[
                    { name: 'Roads & Infrastructure', val: 85, count: '4.2k' },
                    { name: 'Water & Sanitation', val: 65, count: '3.1k' },
                    { name: 'Electricity', val: 45, count: '2.0k' },
                    { name: 'Waste Management', val: 30, count: '1.2k' }
                  ].map(dept => (
                    <div key={dept.name}>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="font-semibold text-ink-700">{dept.name}</span>
                          <span className="text-ink-500">{dept.count}</span>
                       </div>
                       <div className="w-full h-3 bg-ink-900/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            whileInView={{ width: `${dept.val}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-accent rounded-full"
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </GlassCard>

            <GlassCard variants={scrollReveal} className="h-[400px] p-0 overflow-hidden relative">
               <div className="absolute inset-0 p-8 z-10 flex flex-col justify-between pointer-events-none">
                  <h2 className="text-xl font-bold text-ink-900 bg-white/50 backdrop-blur-md self-start px-3 py-1 rounded-xl">Live Heatmap</h2>
               </div>
               <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-60 mix-blend-luminosity"></div>
            </GlassCard>
         </div>
      </motion.div>
    </div>
  );
};
""",

    "src/pages/Track.tsx": """import { useState } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export const Track = () => {
  const [ticketId, setTicketId] = useState('');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative z-10">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">Track a <span className="font-serif italic text-accent font-normal">Complaint</span></h1>
        <p className="text-ink-500 mb-8">Enter your public complaint ID to see its real-time status.</p>
        
        <GlassCard className="p-8 shadow-2xl">
           <form className="flex flex-col sm:flex-row gap-4" onSubmit={e => e.preventDefault()}>
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={20} />
                 <Input 
                   placeholder="e.g. CIV-2041" 
                   value={ticketId}
                   onChange={(e:any) => setTicketId(e.target.value)}
                   className="pl-12 h-14 text-lg font-mono uppercase bg-white/70"
                 />
              </div>
              <Button className="h-14 px-8 text-lg">Track</Button>
           </form>
        </GlassCard>
        
        <p className="mt-8 text-sm text-ink-500">
           Don't have an ID? <a href="/login" className="text-accent hover:underline">Log in to view your history</a>.
        </p>
      </motion.div>
    </div>
  );
};
""",

    "src/pages/About.tsx": """import { GlassCard } from '../components/ui/GlassCard';

export const About = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto w-full">
      <h1 className="text-5xl font-bold tracking-tight text-ink-900 mb-8">Our <span className="font-serif italic text-accent font-normal">Story</span></h1>
      <GlassCard className="prose prose-lg dark:prose-invert max-w-none text-ink-700">
        <p className="lead text-xl mb-6">
          CivicAI was born from a simple realization: cities are drowning in data but starving for clarity.
        </p>
        <p className="mb-4">
          Every day, thousands of civic complaints are filed—potholes, broken streetlights, illegal dumping. Yet, the systems managing these reports were built decades ago. They rely on manual triaging, leading to massive backlogs, duplicate worker dispatches, and frustrated citizens.
        </p>
        <p>
          We built CivicAI to be the intelligent connective tissue between citizens and their government. By using lightweight, deterministic AI layers to instantly classify, score, and deduplicate reports, we help cities fix problems 40% faster.
        </p>
      </GlassCard>
    </div>
  );
};
""",

    "src/pages/HowItWorks.tsx": """import { GlassCard } from '../components/ui/GlassCard';

export const HowItWorks = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto w-full">
      <h1 className="text-5xl font-bold tracking-tight text-ink-900 mb-12 text-center">How CivicAI <span className="font-serif italic text-accent font-normal">Works</span></h1>
      <div className="grid md:grid-cols-2 gap-8">
         {['1. Report', '2. AI Analysis', '3. Officer Review', '4. Worker Fix'].map(step => (
            <GlassCard key={step} className="h-48 flex items-center justify-center">
               <h2 className="text-2xl font-bold text-ink-700">{step}</h2>
            </GlassCard>
         ))}
      </div>
    </div>
  );
};
"""
}

import os

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Step 7 Public Pages generated.")
