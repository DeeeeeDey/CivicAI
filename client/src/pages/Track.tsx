import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, Clock, AlertTriangle, FileText, Bot, Camera, ShieldCheck } from 'lucide-react';
import { api } from '../api/axios';
import { Thumbnail } from '../components/ui/ImageLightbox';

export const Track = () => {
  const { id } = useParams<{ id: string }>();
  const [ticketId, setTicketId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<any>(null);

  useEffect(() => {
    if (id) {
      handleTrackDirect(id);
    }
  }, [id]);

  const handleTrackDirect = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/complaints/public/track/${code.trim()}`);
      setComplaint(res.data);
    } catch(err: any) {
      setComplaint(null);
      setErrorMsg(err.response?.data?.error || "Complaint ID not found. Please verify the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: any) => {
    e.preventDefault();
    handleTrackDirect(ticketId);
  };

  const resolution = complaint?.resolution || complaint?.resolutions?.[0];
  const isResolved = complaint?.status === 'RESOLVED' || complaint?.status === 'VERIFIED';

  return (
    <div className="min-h-[80vh] flex flex-col items-center p-6 relative z-10 pt-32">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-xl text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mb-4">Track a <span className="font-serif italic text-accent font-normal">Complaint</span></h1>
        <p className="text-ink-500 mb-8">Enter your public complaint ID to inspect real-time progress and photographic evidence.</p>
        
        <GlassCard className="p-4 md:p-8 shadow-2xl bg-surface">
           <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleTrack}>
              <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={20} />
                 <Input 
                   placeholder="e.g. CIV-1025" 
                   value={ticketId}
                   onChange={(e:any) => setTicketId(e.target.value)}
                   className="pl-12 h-14 text-lg font-mono uppercase"
                 />
              </div>
              <Button type="submit" className="h-14 px-8 text-lg" disabled={loading}>
                 {loading ? 'Searching...' : 'Track'}
              </Button>
           </form>
           {errorMsg && (
              <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm font-medium flex items-center justify-center gap-2">
                 <AlertTriangle size={16} /> {errorMsg}
              </div>
           )}
        </GlassCard>
      </motion.div>

      <AnimatePresence>
         {complaint && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full max-w-2xl space-y-6">
               <GlassCard className="p-8 shadow-xl bg-surface border-border">
                  {/* Header Strip */}
                  <div className="flex justify-between items-start mb-6 pb-6 border-b border-border flex-wrap gap-4">
                     <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                           <h2 className="text-2xl font-bold text-ink-900">#{complaint.publicId}</h2>
                           <Badge color={isResolved ? 'success' : complaint.status === 'IN_PROGRESS' || complaint.status === 'ASSIGNED' ? 'warning' : 'info'}>
                              {complaint.status.replace('_', ' ')}
                           </Badge>
                           <Badge color="default">{complaint.category || 'General Issue'}</Badge>
                        </div>
                        <p className="text-ink-700 text-sm leading-relaxed">{complaint.description}</p>
                     </div>
                     <Badge color={complaint.severity >= 4 ? 'danger' : complaint.severity === 3 ? 'warning' : 'info'}>
                        Severity {complaint.severity}/5
                     </Badge>
                  </div>

                  {/* Photo Evidence Section */}
                  <div className="space-y-6 mb-8">
                     {/* Original Problem Photo (Before) */}
                     {complaint.imageUrl && (
                        <div>
                           <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Camera size={14} className="text-ink-400" /> Initial Report Evidence (Before)
                           </p>
                           <Thumbnail
                              src={complaint.imageUrl}
                              alt="Initial Complaint Evidence"
                              title={`Original Problem #${complaint.publicId}`}
                              className="h-56 sm:h-64 w-full rounded-2xl shadow-sm"
                           />
                        </div>
                     )}

                     {/* Final Resolution Proof (After) */}
                     {isResolved && (
                        <div className="p-5 bg-success/5 border-2 border-success/30 rounded-2xl">
                           <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                              <h3 className="text-success font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                 <ShieldCheck size={18} /> Resolution Certified (After)
                              </h3>
                              <span className="text-[11px] bg-success/20 text-success font-bold px-2.5 py-0.5 rounded-full">
                                 Field Work Verified
                              </span>
                           </div>
                           
                           {resolution?.description && (
                              <p className="text-sm text-ink-800 mb-4 bg-surface/70 p-3 rounded-xl border border-success/20">
                                 {resolution.description}
                              </p>
                           )}

                           {resolution?.proofImageUrl ? (
                              <div>
                                 <p className="text-xs font-bold text-success uppercase mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> Field Completion Photo (Click to zoom)
                                 </p>
                                 <Thumbnail
                                    src={resolution.proofImageUrl}
                                    alt="Field Resolution Proof"
                                    title={`Resolved Completion Proof #${complaint.publicId}`}
                                    className="h-56 sm:h-64 w-full rounded-xl border border-success/40 shadow-sm"
                                 />
                              </div>
                           ) : (
                              <div className="p-4 bg-surface rounded-xl border border-dashed border-success/40 text-center text-xs text-ink-500">
                                 Work certified completed by municipal team.
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Audit Timeline */}
                  <div>
                     <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2">
                        <Clock size={18} /> Audit Timeline
                     </h3>
                     {complaint.history && complaint.history.length > 0 ? (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-900/10 before:to-transparent">
                           {complaint.history.map((item:any, idx:number) => (
                              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-ink-500">
                                    {item.type === 'AI' ? <Bot size={16} className="text-accent"/> : item.type === 'REPORTED' ? <FileText size={16}/> : <CheckCircle2 size={16} className="text-success"/>}
                                 </div>
                                 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                       <span className="font-bold text-ink-900 text-sm">{item.type.replace('_', ' ')}</span>
                                       <time className="text-xs font-mono text-ink-500">{new Date(item.date).toLocaleDateString()}</time>
                                    </div>
                                    <p className="text-sm text-ink-700">{item.event}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-sm text-ink-500">No timeline history recorded yet.</p>
                     )}
                  </div>
               </GlassCard>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};
