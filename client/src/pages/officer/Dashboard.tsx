import { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { AlertTriangle, Bot, XCircle } from 'lucide-react';
import { api } from '../../api/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const OfficerDashboard = () => {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['officerStats'],
    queryFn: async () => {
      const res = await api.get('/officers/stats');
      return res.data;
    }
  });

  const { data: complaints, isLoading: compLoading } = useQuery({
    queryKey: ['officerComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints');
      return res.data.filter((c: any) => c.status === 'REPORTED');
    }
  });

  const { data: workers } = useQuery({
    queryKey: ['officerWorkers'],
    queryFn: async () => {
      const res = await api.get('/officers/workers');
      return res.data;
    }
  });

  const { data: hotspots } = useQuery({
    queryKey: ['officerHotspots'],
    queryFn: async () => {
      const res = await api.get('/analytics/hotspots');
      return res.data;
    }
  });

  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async (id: string, action: 'accept' | 'override') => {
    if (action === 'override' && !overrideReason) {
       alert("Override reason required!");
       return;
    }
    if (action === 'accept' && !selectedWorkerId) {
       alert("Please select a worker to assign to.");
       return;
    }
    
    setIsSubmitting(true);
    try {
       if (action === 'accept') {
          await api.post(`/officers/${id}/assign`, { workerId: selectedWorkerId });
       } else {
          await api.post(`/officers/${id}/override`, { 
             categoryId: selectedTicket.categoryId, 
             departmentId: selectedTicket.departmentId, 
             severity: selectedTicket.severity, 
             reason: overrideReason 
          });
          // After override, it's still unassigned. They'd need to review again, but let's simplify and dismiss modal.
       }
       queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
       queryClient.invalidateQueries({ queryKey: ['officerStats'] });
       setSelectedTicket(null);
       setOverrideReason('');
       setSelectedWorkerId('');
    } catch (err: any) {
       alert("Error processing review: " + (err.response?.data?.error || err.message));
    } finally {
       setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 relative pb-12">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ink-900">Command Center</h1>
            <p className="text-ink-500">Overview of city-wide operations and queue health.</p>
         </div>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">Pending Review</h3><p className="text-4xl font-serif text-info">{stats?.pendingReview || 0}</p></GlassCard>
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">Active Field Tasks</h3><p className="text-4xl font-serif text-ink-900">{stats?.activeTasks || 0}</p></GlassCard>
          <GlassCard variants={scrollReveal}><h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-1">SLA Breaches (48h)</h3><p className="text-4xl font-serif text-danger">{stats?.slaBreaches || 0}</p></GlassCard>
        </div>

        {hotspots && hotspots.length > 0 && (
           <div className="space-y-4">
              <h2 className="text-2xl font-bold text-ink-900">AI Hotspot Detection</h2>
              <div className="grid md:grid-cols-2 gap-4">
                 {hotspots.map((h: any, idx: number) => (
                    <GlassCard key={idx} className="p-4 border-l-4 border-l-accent shadow-lg bg-surface">
                       <div className="flex justify-between">
                          <Badge color="warning">{h.category}</Badge>
                          <Badge color="danger">Severity {h.topSeverity}</Badge>
                       </div>
                       <p className="mt-3 text-sm text-ink-900 font-semibold">{h.insight}</p>
                    </GlassCard>
                 ))}
              </div>
           </div>
        )}

        <div className="space-y-6">
           <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><AlertTriangle size={20} className="text-danger"/> Urgent Queue for Review</h2>
           {compLoading && <p>Loading queue...</p>}
           {!compLoading && complaints?.length === 0 && <p className="text-ink-500">No tickets currently awaiting review.</p>}
           
           {complaints?.map((c: any) => (
             <GlassCard interactive key={c.id} variants={scrollReveal} className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                   <div className="flex flex-wrap gap-2 mb-3">
                     {c.severity >= 4 && <Badge color="danger">Critical Severity</Badge>}
                     <Badge color="info">{c.category?.name || 'Unknown'}</Badge>
                     <span className="text-xs font-bold text-ink-300 uppercase self-center">{c.publicId}</span>
                   </div>
                   <h4 className="font-bold text-lg text-ink-900 mb-2">{c.description}</h4>
                   {c.imageUrl && (
                      <div className="h-24 w-40 rounded-lg overflow-hidden border border-border">
                         <img src={c.imageUrl} className="w-full h-full object-cover" />
                      </div>
                   )}
                </div>
                <Button onClick={() => setSelectedTicket(c)}>Review Ticket</Button>
             </GlassCard>
           ))}
        </div>
      </motion.div>

      {/* Review Modal */}
      <AnimatePresence>
         {selectedTicket && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
               <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></motion.div>
               <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-border flex justify-between items-center">
                     <h2 className="text-xl font-bold text-ink-900">Review Ticket #{selectedTicket.publicId}</h2>
                     <button onClick={() => setSelectedTicket(null)} className="text-ink-500 hover:text-ink-900"><XCircle /></button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                     <div className="p-4 bg-ink-900/5 rounded-xl flex gap-4">
                        {selectedTicket.imageUrl && (
                           <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border">
                              <img src={selectedTicket.imageUrl} className="w-full h-full object-cover" />
                           </div>
                        )}
                        <div>
                           <p className="text-sm font-bold text-ink-500 mb-1">Description</p>
                           <p className="text-ink-900">{selectedTicket.description}</p>
                        </div>
                     </div>
                     
                     <div className="p-4 border border-accent/20 bg-accent/5 rounded-xl relative">
                        <div className="absolute top-4 right-4"><Badge color="accent">AI Suggestion</Badge></div>
                        <h3 className="font-bold text-ink-900 flex items-center gap-2 mb-4"><Bot className="text-accent" size={18}/> Automated Assessment</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <p className="text-xs text-ink-500 font-bold uppercase">Category</p>
                              <p className="font-semibold text-ink-900">{selectedTicket.category?.name || 'Pothole'}</p>
                           </div>
                           <div>
                              <p className="text-xs text-ink-500 font-bold uppercase">Severity</p>
                              <p className="font-semibold text-ink-900">{selectedTicket.severity}/5</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="text-sm font-bold text-ink-900 block mb-2">Assign Field Worker</label>
                           <select 
                              className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                              value={selectedWorkerId}
                              onChange={e => setSelectedWorkerId(e.target.value)}
                           >
                              <option value="">Select a worker...</option>
                              {workers?.map((w: any) => (
                                 <option key={w.id} value={w.id}>{w.name} ({w.email})</option>
                              ))}
                           </select>
                        </div>
                        
                        <div>
                           <label className="text-sm font-bold text-ink-900 block mb-2">Override Reason (Optional)</label>
                           <textarea 
                              className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent" 
                              placeholder="Why are you overriding the AI suggestion?"
                              value={overrideReason}
                              onChange={e => setOverrideReason(e.target.value)}
                           />
                        </div>
                     </div>
                  </div>
                  <div className="p-6 border-t border-border bg-ink-900/5 flex justify-end gap-4">
                     <Button variant="secondary" onClick={() => handleReview(selectedTicket.id, 'override')} disabled={isSubmitting} className="border-danger text-danger hover:bg-danger hover:text-white">Override AI</Button>
                     <Button onClick={() => handleReview(selectedTicket.id, 'accept')} disabled={isSubmitting || !selectedWorkerId}>Accept & Assign</Button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};
