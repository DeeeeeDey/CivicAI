import { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { Navigation, Camera, CheckCircle, Upload, X, MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { useLocation, Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const WorkerTasks = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  // If visiting /worker/history directly, switch tab to COMPLETED
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>(
    location.pathname.includes('/history') ? 'COMPLETED' : 'ACTIVE'
  );

  useEffect(() => {
    if (location.pathname.includes('/history')) {
      setActiveTab('COMPLETED');
    } else {
      setActiveTab('ACTIVE');
    }
  }, [location.pathname]);

  const { data: activeTasks, isLoading: activeLoading, error: activeError } = useQuery({
    queryKey: ['workerTasks', 'active'],
    queryFn: async () => {
      const res = await api.get('/workers/tasks');
      return res.data;
    }
  });

  const { data: completedTasks, isLoading: completedLoading, error: completedError } = useQuery({
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
    } catch (err: any) {
      alert('Failed to start job: ' + (err.response?.data?.error || err.message));
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
    } catch (err: any) {
      alert('Failed to upload proof: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTasks = (activeTab === 'ACTIVE' ? activeTasks : completedTasks) || [];
  const isLoading = activeTab === 'ACTIVE' ? activeLoading : completedLoading;
  const error = activeTab === 'ACTIVE' ? activeError : completedError;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-ink-900">
            {activeTab === 'ACTIVE' ? 'Field Assignment Route' : 'Completed Work History'}
          </h1>
          <p className="text-ink-500">
            {activeTab === 'ACTIVE'
              ? `${activeTasks?.length || 0} active assignments requiring on-site action.`
              : `${completedTasks?.length || 0} tasks resolved with photographic proof.`}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
          <Link
            to="/worker/dashboard"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'ACTIVE' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Active Route ({activeTasks?.length || 0})
          </Link>
          <Link
            to="/worker/history"
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'COMPLETED' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            History ({completedTasks?.length || 0})
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-44 bg-surface rounded-2xl"></div>
          <div className="h-44 bg-surface rounded-2xl"></div>
        </div>
      ) : error ? (
        <GlassCard className="p-8 text-center text-danger">
          <AlertTriangle size={32} className="mx-auto mb-2" />
          <p className="font-bold">Failed to load assignments</p>
          <p className="text-xs">{(error as any)?.response?.data?.error || (error as any).message}</p>
        </GlassCard>
      ) : currentTasks.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center">
          <CheckCircle className="text-success mb-3" size={48} />
          <h2 className="text-xl font-bold text-ink-900">
            {activeTab === 'ACTIVE' ? 'All caught up!' : 'No completed jobs yet'}
          </h2>
          <p className="text-ink-500 text-sm">
            {activeTab === 'ACTIVE'
              ? 'No pending field assignments assigned to your queue.'
              : 'Resolved assignments with photographic proof will appear here.'}
          </p>
        </GlassCard>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
          {currentTasks.map((task: any) => {
            const c = task.complaint;
            if (!c) return null; // Defensive check

            const resolution = c.resolutions?.[0];
            const latStr = typeof c.latitude === 'number' ? c.latitude.toFixed(4) : c.latitude || '0.0000';
            const lngStr = typeof c.longitude === 'number' ? c.longitude.toFixed(4) : c.longitude || '0.0000';

            return (
              <GlassCard key={task.id} interactive className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Card top */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-ink-400 uppercase tracking-wider">
                          #{c.publicId || 'TICKET'}
                        </span>
                        <Badge
                          color={
                            c.status === 'RESOLVED' || c.status === 'VERIFIED'
                              ? 'success'
                              : c.status === 'IN_PROGRESS'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {c.status ? c.status.replace('_', ' ') : 'PENDING'}
                        </Badge>
                        <Badge color={c.severity >= 4 ? 'danger' : c.severity === 3 ? 'warning' : 'info'}>
                          Sev {c.severity || 1}/5
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-ink-900 leading-tight">
                        {c.category?.name || 'General Municipal Issue'}
                      </h3>
                      <p className="text-ink-700 text-sm">{c.description}</p>

                      <p className="text-ink-500 text-xs flex items-center gap-1 pt-1">
                        <MapPin size={12} /> {latStr}, {lngStr}
                      </p>
                    </div>

                    {/* Citizen Issue Photo thumbnail (click to expand) */}
                    {c.imageUrl && (
                      <div className="flex flex-col items-center">
                        <Thumbnail
                          src={c.imageUrl}
                          alt="Citizen Issue"
                          title={`Original Issue #${c.publicId}`}
                          className="w-24 h-24 rounded-xl"
                        />
                        <span className="text-[10px] text-ink-400 mt-1 font-semibold">Issue Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Resolution proof display if already completed */}
                  {resolution && resolution.proofImageUrl && (
                    <div className="p-4 bg-success/5 border border-success/30 rounded-xl mt-1 flex gap-4 items-center">
                      <Thumbnail
                        src={resolution.proofImageUrl}
                        alt="Resolution Proof"
                        title={`Resolution Proof #${c.publicId}`}
                        className="w-24 h-20 rounded-lg shrink-0 border border-success/40"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-success uppercase mb-1 flex items-center gap-1">
                          <CheckCircle size={13} /> Resolution Certified
                        </p>
                        <p className="text-ink-700">{resolution.description || 'Repair completed.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions for active tasks */}
                  {activeTab === 'ACTIVE' && (
                    <div className="grid grid-cols-2 gap-3 mt-1 pt-4 border-t border-border">
                      {c.status === 'ASSIGNED' ? (
                        <>
                          <Button
                            variant="secondary"
                            className="w-full flex gap-2 justify-center text-xs py-2.5"
                            onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}
                          >
                            <Navigation size={15} /> Directions
                          </Button>
                          <Button className="w-full text-xs py-2.5" onClick={() => startJob(c.id)}>
                            Start Job
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            className="w-full flex gap-2 justify-center text-xs py-2.5"
                            onClick={() => window.open(`https://maps.google.com/?q=${c.latitude},${c.longitude}`, '_blank')}
                          >
                            <Navigation size={15} /> Directions
                          </Button>
                          <Button
                            className="w-full bg-success hover:bg-success/90 text-white flex gap-2 justify-center text-xs py-2.5"
                            onClick={() => setResolvingId(c.id)}
                          >
                            <Camera size={15} /> Upload Proof
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
          <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-border"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
                <h3 className="font-bold text-base text-ink-900 flex items-center gap-2">
                  <Camera size={18} className="text-success" /> Upload Resolution Proof
                </h3>
                <button onClick={closeProofModal} className="text-ink-400 hover:text-ink-900">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-900 uppercase mb-2">Photo Evidence</label>
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
                        <Upload className="w-10 h-10 text-ink-400 mb-2" />
                        <p className="text-sm font-semibold text-ink-900">Take or choose photo</p>
                        <p className="text-xs text-ink-400 mt-1">Camera capture supported</p>
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
                  <label className="block text-xs font-bold text-ink-900 uppercase mb-1.5">Repair Notes</label>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
                  className="bg-success text-white hover:bg-success/90 text-xs px-5"
                >
                  {isSubmitting ? 'Uploading Proof...' : 'Confirm Resolution'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default WorkerTasks;
