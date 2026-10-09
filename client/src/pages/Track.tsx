import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, Clock, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { api } from '../api/axios';

export const Track = () => {
  const { id } = useParams<{ id: string }>();
  const [ticketId, setTicketId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);

  useEffect(() => {
    if (id) {
      handleTrack({ preventDefault: () => {} });
    }
  }, [id]);

  const handleTrack = async (e: any) => {
    e.preventDefault();
    if (!ticketId) return;
    setLoading(true);
    try {
      const res = await api.get(`/complaints/public/track/${ticketId}`);
      setComplaint(res.data);
      setLoading(false);
    } catch(err: any) {
      alert(err.response?.data?.error || "Ticket not found");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center p-6 relative z-10 pt-32">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">Track a <span className="font-serif italic text-accent font-normal">Complaint</span></h1>
        <p className="text-ink-500 mb-8">Enter your public complaint ID to see its real-time public audit timeline.</p>
        
        <GlassCard className="p-4 md:p-8 shadow-2xl bg-surface">
           <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleTrack}>
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={20} />
                 <Input 
                   placeholder="e.g. CIV-2041" 
                   value={ticketId}
                   onChange={(e:any) => setTicketId(e.target.value)}
                   className="pl-12 h-14 text-lg font-mono uppercase"
                 />
              </div>
              <Button type="submit" className="h-14 px-8 text-lg" disabled={loading}>
                 {loading ? 'Searching...' : 'Track'}
              </Button>
           </form>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
         {complaint && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-2xl">
               <GlassCard className="p-8 shadow-xl bg-surface border-border">
                  <div className="flex justify-between items-start mb-8 pb-8 border-b border-border">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-2xl font-bold text-ink-900">#{complaint.publicId}</h2>
                           <Badge color="info">{complaint.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-ink-700">{complaint.description}</p>
                        {complaint.imageUrl && (
                           <div className="mt-4 h-48 w-full rounded-xl overflow-hidden border border-border">
                              <img src={complaint.imageUrl} className="w-full h-full object-cover" />
                           </div>
                        )}
                        
                        {complaint.resolution && complaint.resolution.proofImageUrl && (
                           <div className="mt-6 p-4 bg-success/10 border border-success/30 rounded-xl">
                              <h3 className="text-success font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Resolution Proof</h3>
                              <p className="text-sm text-ink-700 mb-3">{complaint.resolution.description || 'Issue has been successfully resolved.'}</p>
                              <div className="h-48 w-full rounded-xl overflow-hidden border border-success/20">
                                 <img src={complaint.resolution.proofImageUrl} className="w-full h-full object-cover" />
                              </div>
                           </div>
                        )}
                     </div>
                     <Badge color="danger">Severity {complaint.severity}</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2"><Clock size={18}/> Audit Timeline</h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-900/10 before:to-transparent">
                     {complaint.history.map((item:any, idx:number) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                           <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-ink-500">
                              {item.type === 'AI' ? <Bot size={16} className="text-accent"/> : item.type === 'REPORTED' ? <FileText size={16}/> : <CheckCircle2 size={16}/>}
                           </div>
                           <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-white shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                 <span className="font-bold text-ink-900 text-sm">{item.type}</span>
                                 <time className="text-xs font-mono text-ink-500">{new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                              </div>
                              <p className="text-sm text-ink-700">{item.event}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </GlassCard>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};
