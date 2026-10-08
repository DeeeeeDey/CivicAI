import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Activity, MapPin, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useComplaints } from '../../hooks/queries';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';

export const CitizenDashboard = () => {
  const { data: complaints, isLoading } = useComplaints();

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ink-900">Good morning.</h1>
            <p className="text-ink-500">Here's the latest on your community reports.</p>
         </div>
         <Link to="/citizen/report">
            <Button className="flex items-center gap-2 px-6 h-12 shadow-[0_8px_20px_rgba(194,104,58,0.25)]"><PlusCircle size={18}/> Report an issue</Button>
         </Link>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6"><div className="h-32 bg-white/40 rounded-[24px]"></div></div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
          
          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Total Reported</h3>
              <p className="text-5xl font-serif text-ink-900">{complaints?.length || 0}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">In Progress</h3>
              <p className="text-5xl font-serif text-warning">
                {complaints?.filter((c:any) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length || 0}
              </p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Resolved</h3>
              <p className="text-5xl font-serif text-success">
                {complaints?.filter((c:any) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length || 0}
              </p>
            </GlassCard>
          </div>

          {/* VERIFICATION ALERT (If any resolved) */}
          {complaints?.some((c:any) => c.status === 'RESOLVED') && (
            <motion.div variants={scrollReveal}>
              <GlassCard className="bg-accent-soft/40 border-accent/20">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-lg text-ink-900">Action required: Verify repair</h3>
                          <p className="text-ink-700 text-sm">A worker has marked "Pothole at Sector V" as resolved. Please confirm.</p>
                       </div>
                    </div>
                    <Button>Review proof</Button>
                 </div>
              </GlassCard>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><Activity size={20} className="text-ink-300"/> Recent Activity</h2>
              <div className="space-y-4">
                 {complaints?.slice(0, 5).map((item: any) => (
                    <GlassCard interactive key={item.id} className="p-5 flex justify-between items-center group">
                       <div className="flex items-start gap-4">
                         <div className="mt-1"><MapPin size={20} className="text-ink-300"/></div>
                         <div>
                           <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-lg font-bold text-ink-900 group-hover:text-accent transition-colors">{item.category?.name || 'Report'}</h4>
                             <Badge color={item.status === 'RESOLVED' ? 'success' : item.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                                {item.status.replace('_', ' ')}
                             </Badge>
                           </div>
                           <p className="text-sm text-ink-500 truncate max-w-[250px] md:max-w-md">{item.description}</p>
                         </div>
                       </div>
                    </GlassCard>
                 ))}
              </div>
            </div>

            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><MapPin size={20} className="text-ink-300"/> Nearby</h2>
               <GlassCard className="h-[300px] p-0 overflow-hidden relative flex items-center justify-center bg-bg-sand">
                  <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/OpenStreetMap_routing_machine.png')] bg-cover bg-center opacity-40 mix-blend-luminosity"></div>
                  <Badge className="relative z-10 bg-white/80 backdrop-blur-md shadow-lg border-white">Live Map Coming Soon</Badge>
               </GlassCard>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
