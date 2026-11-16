import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PlusCircle, Activity, MapPin, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useComplaints } from '../../hooks/queries';
import { useLocationStore } from '../../store/locationStore';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';

export const CitizenDashboard = () => {
  const { data: complaints, isLoading } = useComplaints();
  const { label } = useLocationStore();
  const navigate = useNavigate();

  const pendingVerification = complaints?.find((c: any) => c.status === 'RESOLVED');

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
          {pendingVerification && (
            <motion.div variants={scrollReveal}>
              <GlassCard className="bg-accent-soft/40 border-accent/30 shadow-md">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle2 size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-lg text-ink-900 flex items-center gap-2">
                             Action Required: Verify Repair <Badge color="warning" className="text-[10px]">#{pendingVerification.publicId}</Badge>
                          </h3>
                          <p className="text-ink-700 text-sm mt-0.5">
                             A municipal worker marked "{pendingVerification.category?.name || 'Community Issue'}" as resolved. Please review the photo proof and confirm.
                          </p>
                       </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/track/${pendingVerification.publicId}`)}
                      className="shrink-0 flex items-center gap-1.5 px-6 shadow-md"
                    >
                      <ShieldCheck size={16} /> Review Proof & Confirm
                    </Button>
                 </div>
              </GlassCard>
            </motion.div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><Activity size={20} className="text-ink-300"/> Recent Activity</h2>
              <div className="space-y-4">
                 {complaints && complaints.length > 0 ? (
                   complaints.slice(0, 5).map((item: any) => (
                      <Link to={`/track/${item.publicId}`} key={item.id} className="block">
                        <GlassCard interactive className="p-5 flex justify-between items-center group">
                           <div className="flex items-start gap-4">
                             <div className="mt-1"><MapPin size={20} className="text-ink-300 group-hover:text-accent transition-colors"/></div>
                             <div>
                               <div className="flex items-center gap-3 mb-1">
                                 <h4 className="text-lg font-bold text-ink-900 group-hover:text-accent transition-colors">{item.category?.name || 'Report'}</h4>
                                 <Badge color={item.status === 'RESOLVED' || item.status === 'VERIFIED' ? 'success' : item.status === 'IN_PROGRESS' || item.status === 'ASSIGNED' ? 'warning' : 'info'}>
                                    {item.status.replace('_', ' ')}
                                 </Badge>
                                 <span className="text-xs font-mono text-ink-400">#{item.publicId}</span>
                               </div>
                               <p className="text-sm text-ink-500 truncate max-w-[250px] md:max-w-md">{item.description}</p>
                             </div>
                           </div>
                           <ArrowRight size={16} className="text-ink-300 group-hover:text-accent transition-transform group-hover:translate-x-1" />
                        </GlassCard>
                      </Link>
                   ))
                 ) : (
                   <GlassCard className="p-8 text-center">
                     <p className="text-sm text-ink-500">No issues reported yet. Click "Report an issue" to log your first community ticket.</p>
                   </GlassCard>
                 )}
              </div>
            </div>

            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><MapPin size={20} className="text-ink-300"/> Community GIS Map</h2>
               <Link to="/citizen/map" className="block group">
                 <GlassCard className="h-[300px] p-6 flex flex-col justify-between border-border group-hover:border-accent/40 transition-all bg-surface shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-bold uppercase tracking-wider text-accent">Active Ward</span>
                         <Badge color="info">Live Feed</Badge>
                      </div>
                      <h3 className="font-bold text-xl text-ink-900 group-hover:text-accent transition-colors">
                        {label || 'Metropolitan Ward'}
                      </h3>
                      <p className="text-xs text-ink-500 mt-1">
                        Inspect nearby civic pins, road works, and sanitation dispatches in real-time.
                      </p>
                    </div>

                    <div className="p-3 bg-accent/5 rounded-xl border border-accent/20 flex items-center justify-between">
                       <span className="text-xs font-semibold text-accent">Open Interactive Map</span>
                       <ArrowRight size={16} className="text-accent group-hover:translate-x-1 transition-transform" />
                    </div>
                 </GlassCard>
               </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
