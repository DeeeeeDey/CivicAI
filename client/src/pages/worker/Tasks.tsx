import { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { Navigation, Camera, CheckCircle, Upload, X, MapPin, Eye } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';

export const WorkerTasks = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const { data: activeTasks, isLoading: activeLoading } = useQuery({
    queryKey: ['workerTasks', 'active'],
    queryFn: async () => {
      const res = await api.get('/workers/tasks');
      return res.data;
    }
  });

  const { data: completedTasks, isLoading: completedLoading } = useQuery({
    queryKey: ['workerTasks', 'completed'],
    queryFn: async () => {
      const res = await api.get('/workers/tasks?status=completed');
      return res.data;
    }
  });

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const closeProofModal = () => {
    setResolvingId(null);
    setProofFile(null);
    setProofPreview(null);
    setDesc('');
  };

  const submitResolution = async () => {
    if (!resolvingId || !proofFile) return;
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('image', proofFile);
      fd.append('description', desc);

      await api.post(`/workers/${resolvingId}/resolve`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      closeProofModal();
      queryClient.invalidateQueries({ queryKey: ['workerTasks'] });
    } catch (err) {
      alert("Failed to upload proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTasks = activeTab === 'ACTIVE' ? activeTasks : completedTasks;
  const isLoading = activeTab === 'ACTIVE' ? activeLoading : completedLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-ink-900">Field Operations</h1>
          <p className="text-ink-500">
            {activeTasks?.length || 0} active assignments awaiting action.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'ACTIVE' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Active Route ({activeTasks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === 'COMPLETED' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Resolved ({completedTasks?.length || 0})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-white/40 rounded-2xl"></div>
          <div className="h-48 bg-white/40 rounded-2xl"></div>
        </div>
      ) : currentTasks?.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center">
          <CheckCircle className="text-success mb-4" size={48} />
          <h2 className="text-xl font-bold text-ink-900">
            {activeTab === 'ACTIVE' ? 'All caught up!' : 'No completed jobs yet'}
          </h2>
          <p className="text-ink-500">
            {activeTab === 'ACTIVE'
              ? 'No pending field assignments assigned to your queue.'
              : 'Resolved assignments with verification proof will show up here.'}
          </p>
        </GlassCard>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {currentTasks?.map((task: any) => {
            const c = task.complaint;
            const resolution = c?.resolutions?.[0];
            return (
              <GlassCard key={task.id} interactive variants={scrollReveal} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-ink-400 uppercase tracking-wider">{c.publicId}</span>
                        <Badge color={c.status === 'RESOLVED' ? 'success' : c.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                          {c.status.replace('_', ' ')}
                        </Badge>
                        <Badge color={c.severity >= 4 ? 'danger' : c.severity === 3 ? 'warning' : 'info'}>
                          Sev {c.severity}/5
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-ink-900 leading-tight">{c.category?.name || 'Issue'}</h3>
                      <p className="text-ink-600 text-sm mt-2">{c.description}</p>
                      <p className="text-ink-500 text-xs mt-2 flex items-center gap-1">
                        <MapPin size={12} /> {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                      </p>
                    </div>

                    {/* Citizen Issue Photo thumbnail if exists */}
                    {c.imageUrl && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden border border-border shrink-0 bg-ink-900/5">
                        <img src={c.imageUrl} alt="Citizen report" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Resolution proof display if already completed */}
                  {resolution && resolution.proofImageUrl && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-xl mt-2">
                      <p className="text-xs font-bold text-success uppercase mb-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Verified Resolution
                      </p>
                      {resolution.description && <p className="text-xs text-ink-700 mb-2">{resolution.description}</p>}
                      <div className="h-32 rounded-lg overflow-hidden border border-success/20">
                        <img src={resolution.proofImageUrl} alt="Resolution" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Actions for active tasks */}
                  {activeTab === 'ACTIVE' && (
                    <div className="grid grid-cols-2 gap-3 mt-2 pt-4 border-t border-border">
                      {c.status === 'ASSIGNED' ? (
                        <>
                          <Button
                            variant="secondary"
                            className="w-full flex gap-2 justify-center"
                            onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}
                          >
                            <Navigation size={16} /> Open Maps
                          </Button>
                          <Button className="w-full" onClick={() => startJob(c.id)}>
                            Start Job
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            className="w-full flex gap-2 justify-center"
                            onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}
                          >
                            <Navigation size={16} /> Navigate
                          </Button>
                          <Button
                            className="w-full bg-success hover:bg-success/80 text-white flex gap-2 justify-center"
                            onClick={() => setResolvingId(c.id)}
                          >
                            <Camera size={16} /> Upload Proof
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </motion.div>
      )}

      {/* Upload Proof Modal */}
      <AnimatePresence>
        {resolvingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-bg-base rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
                <h3 className="font-bold text-lg text-ink-900">Upload Resolution Proof</h3>
                <button onClick={closeProofModal} className="text-ink-400 hover:text-ink-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-2">Photo Evidence</label>
                  {proofPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-success h-48 bg-ink-900/5 group">
                      <img src={proofPreview} alt="Proof preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-ink-900/70 text-white hover:bg-ink-900"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-border hover:border-accent hover:bg-accent/5">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-ink-400 mb-3" />
                        <p className="mb-2 text-sm text-ink-500">
                          <span className="font-semibold text-ink-900">Take or choose photo</span>
                        </p>
                        <p className="text-xs text-ink-400">PNG, JPG, WEBP</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-900 mb-2">Resolution Notes</label>
                  <textarea
                    className="w-full p-3 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={3}
                    placeholder="Describe the repair performed..."
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
                <Button variant="secondary" onClick={closeProofModal}>
                  Cancel
                </Button>
                <Button
                  onClick={submitResolution}
                  disabled={!proofFile || isSubmitting}
                  className="bg-success text-white hover:bg-success/90"
                >
                  {isSubmitting ? 'Uploading Proof...' : 'Confirm Resolution'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
