import { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { Navigation, Camera, CheckCircle, Upload, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';

export const WorkerTasks = () => {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['workerTasks'],
    queryFn: async () => {
      const res = await api.get('/workers/tasks');
      return res.data;
    }
  });

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startJob = async (complaintId: string) => {
    try {
      await api.post(`/workers/${complaintId}/start`);
      queryClient.invalidateQueries({ queryKey: ['workerTasks'] });
    } catch (err) {
      alert("Failed to start job");
    }
  };

  const submitResolution = async () => {
    if (!resolvingId || !proofFile) return;
    setIsSubmitting(true);
    try {
       const fd = new FormData();
       fd.append('image', proofFile);
       fd.append('description', desc);
       
       // In a real app we'd get worker's current GPS location here
       // using navigator.geolocation.getCurrentPosition
       // fd.append('latitude', String(workerLat));
       // fd.append('longitude', String(workerLng));

       await api.post(`/workers/${resolvingId}/resolve`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
       });
       
       setResolvingId(null);
       setProofFile(null);
       setDesc('');
       queryClient.invalidateQueries({ queryKey: ['workerTasks'] });
    } catch (err) {
       alert("Failed to upload proof");
    } finally {
       setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center p-8">Loading tasks...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 relative">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-ink-900">Today's Route</h1>
        <p className="text-ink-500">You have {tasks?.length || 0} active assignments.</p>
      </div>
      
      {tasks?.length === 0 ? (
         <GlassCard className="p-12 text-center flex flex-col items-center">
            <CheckCircle className="text-success mb-4" size={48} />
            <h2 className="text-xl font-bold text-ink-900">All caught up!</h2>
            <p className="text-ink-500">No active tasks assigned to you right now.</p>
         </GlassCard>
      ) : (
         <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
           {tasks?.map((task: any) => {
             const c = task.complaint;
             return (
             <GlassCard key={task.id} interactive variants={scrollReveal} className="p-6">
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">{c.publicId}</span>
                            <Badge color={c.severity >= 4 ? 'danger' : c.severity === 3 ? 'warning' : 'info'}>Sev {c.severity}</Badge>
                         </div>
                         <h3 className="text-2xl font-bold text-ink-900 leading-tight">{c.category?.name || 'Issue'}</h3>
                         <p className="text-ink-500 text-sm mt-1 flex items-center gap-1"><Navigation size={12}/> {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 mt-4">
                      {c.status === 'ASSIGNED' ? (
                         <>
                           <Button variant="secondary" className="w-full flex gap-2" onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}><Navigation size={16}/> Map</Button>
                           <Button className="w-full" onClick={() => startJob(c.id)}>Start Job</Button>
                         </>
                      ) : (
                         <>
                           <Button variant="secondary" className="w-full text-ink-500" onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}>Navigate</Button>
                           <Button className="w-full bg-success hover:bg-success/80 flex gap-2" onClick={() => setResolvingId(c.id)}><Camera size={16}/> Upload Proof</Button>
                         </>
                      )}
                   </div>
                </div>
             </GlassCard>
           )})}
         </motion.div>
      )}

      {/* Upload Proof Modal */}
      <AnimatePresence>
         {resolvingId && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                  className="bg-bg-base rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
               >
                  <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
                     <h3 className="font-bold text-lg text-ink-900">Upload Resolution Proof</h3>
                     <button onClick={() => { setResolvingId(null); setProofFile(null); }} className="text-ink-400 hover:text-ink-900"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-ink-900 mb-2">Photo Evidence</label>
                        <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${proofFile ? 'border-success bg-success/5' : 'border-border hover:border-accent hover:bg-accent/5'}`}>
                           <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {proofFile ? (
                                 <>
                                    <CheckCircle className="w-10 h-10 text-success mb-3" />
                                    <p className="text-sm font-semibold text-success">{proofFile.name}</p>
                                 </>
                              ) : (
                                 <>
                                    <Upload className="w-10 h-10 text-ink-400 mb-3" />
                                    <p className="mb-2 text-sm text-ink-500"><span className="font-semibold text-ink-900">Click to upload</span> or drag and drop</p>
                                 </>
                              )}
                           </div>
                           <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => e.target.files && setProofFile(e.target.files[0])} />
                        </label>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-ink-900 mb-2">Resolution Notes</label>
                        <textarea 
                           className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent" 
                           rows={3} 
                           placeholder="Describe the repair..."
                           value={desc}
                           onChange={e => setDesc(e.target.value)}
                        />
                     </div>
                  </div>
                  <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
                     <Button variant="secondary" onClick={() => setResolvingId(null)}>Cancel</Button>
                     <Button onClick={submitResolution} disabled={!proofFile || isSubmitting} className="bg-success text-white hover:bg-success/90">
                        {isSubmitting ? 'Uploading...' : 'Confirm Resolution'}
                     </Button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};
