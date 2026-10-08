import { GlassCard } from '../../components/ui/GlassCard';
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
