import os

files = {
    "src/pages/officer/Dashboard.tsx": """import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { MapPin, Users, AlertTriangle } from 'lucide-react';

export const OfficerDashboard = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ink-900">Command Center</h1>
            <p className="text-ink-500">Overview of city-wide operations and queue health.</p>
         </div>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
        <div className="grid md:grid-cols-4 gap-6">
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">Pending Review</h3><p className="text-4xl font-serif text-info">42</p></GlassCard>
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">AI Flagged Duplicates</h3><p className="text-4xl font-serif text-warning">18</p></GlassCard>
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">Active Field Tasks</h3><p className="text-4xl font-serif text-ink-900">156</p></GlassCard>
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">SLA Breaches</h3><p className="text-4xl font-serif text-danger">3</p></GlassCard>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><AlertTriangle size={20} className="text-ink-300"/> Urgent Queue</h2>
              {[1,2,3].map(i => (
                <GlassCard interactive key={i} variants={scrollReveal} className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                   <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge color="danger">Critical Severity</Badge>
                        <Badge color="info">Water Leakage</Badge>
                      </div>
                      <h4 className="font-bold text-lg text-ink-900">Main Pipe Burst at Salt Lake</h4>
                      <p className="text-sm text-ink-500 mt-2">AI Confidence: 94% • Est. Duplicate: No</p>
                   </div>
                   <button className="bg-ink-900 text-white hover:bg-ink-700 px-6 py-2.5 rounded-[12px] text-sm font-semibold whitespace-nowrap transition-colors">Review Ticket</button>
                </GlassCard>
              ))}
           </div>
           
           <div className="space-y-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><MapPin size={20} className="text-ink-300"/> Live Map</h2>
              <GlassCard variants={scrollReveal} className="h-[450px] p-0 overflow-hidden relative flex items-center justify-center bg-bg-sand">
                 <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-50 mix-blend-luminosity"></div>
                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 to-transparent h-1/3 z-10 p-6 flex flex-col justify-end">
                    <p className="text-sm font-semibold text-ink-900">12 active incidents in view</p>
                 </div>
              </GlassCard>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
""",

    "src/pages/worker/Tasks.tsx": """import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { Navigation, Camera } from 'lucide-react';

export const WorkerTasks = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-ink-900">Today's Route</h1>
        <p className="text-ink-500">You have 4 tasks assigned within 2 miles.</p>
      </div>
      
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
        {[
          {id: 'CIV-2033', type: 'Pothole Repair', address: 'Sector V, Near SDF Building', status: 'ASSIGNED', priority: 'High'},
          {id: 'CIV-1982', type: 'Fallen Tree', address: 'Park Street Crossing', status: 'IN_PROGRESS', priority: 'Critical'},
        ].map(task => (
          <GlassCard key={task.id} interactive variants={scrollReveal} className="p-6">
             <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">{task.id}</span>
                         <Badge color={task.priority === 'Critical' ? 'danger' : 'warning'}>{task.priority}</Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-ink-900 leading-tight">{task.type}</h3>
                      <p className="text-ink-500 text-sm mt-1 flex items-center gap-1">📍 {task.address}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                   {task.status === 'ASSIGNED' ? (
                      <>
                        <Button variant="secondary" className="w-full flex gap-2"><Navigation size={16}/> Navigate</Button>
                        <Button className="w-full">Start Job</Button>
                      </>
                   ) : (
                      <>
                        <Button variant="secondary" className="w-full text-danger border-danger/20 hover:bg-danger/10">Mark Blocked</Button>
                        <Button className="w-full bg-success hover:bg-success/80 flex gap-2"><Camera size={16}/> Upload Proof</Button>
                      </>
                   )}
                </div>
             </div>
          </GlassCard>
        ))}
      </motion.div>
    </div>
  );
};
"""
}

import os

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Step 9 Dashboards generated.")
