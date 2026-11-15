import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Camera,
  AlertTriangle,
  Clock,
  User,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const OfficerVerificationPage = () => {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: complaints, isLoading, error } = useQuery({
    queryKey: ['officerVerificationQueue'],
    queryFn: async () => {
      const res = await api.get('/officers/verification');
      return res.data;
    }
  });

  const handleVerify = async (id: string, approved: boolean, notes?: string) => {
    setIsProcessing(true);
    try {
      await api.post(`/officers/${id}/verify`, { approved, notes });
      queryClient.invalidateQueries({ queryKey: ['officerVerificationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
      setRejectId(null);
      setRejectReason('');
    } catch (err: any) {
      alert('Verification action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <ShieldCheck className="text-success" size={32} /> Quality Assurance & Verification
          </h1>
          <p className="text-ink-500 mt-1">
            Compare initial evidence against worker repair photos before issuing final certification.
          </p>
        </div>
        <Badge color="success" className="text-sm py-1 px-3">
          {complaints?.length || 0} awaiting sign-off
        </Badge>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-44 bg-surface rounded-2xl"></div>
          <div className="h-44 bg-surface rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load verification queue.</div>
      ) : complaints?.length === 0 ? (
        <GlassCard className="p-16 text-center text-ink-500">
          <CheckCircle size={48} className="mx-auto text-success mb-3" />
          <h2 className="text-xl font-bold text-ink-900 mb-1">Verification Queue Clear!</h2>
          <p className="text-sm">No resolved field jobs currently awaiting officer review and sign-off.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {complaints?.map((c: any) => {
            const resolution = c.resolutions?.[0];
            const worker = resolution?.worker;

            return (
              <GlassCard key={c.id} className="p-6 space-y-5">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm bg-surface px-2.5 py-1 rounded border border-border">
                      #{c.publicId}
                    </span>
                    <Badge color="warning">RESOLVED (AWAITING SIGN-OFF)</Badge>
                    <Badge color={c.severity >= 4 ? 'danger' : 'info'}>Severity {c.severity}/5</Badge>
                    <Badge color="default">{c.category?.name || 'General'}</Badge>
                  </div>

                  <Link to={`/track/${c.publicId}`}>
                    <Button variant="secondary" className="text-xs py-1 px-3 flex items-center gap-1">
                      <ExternalLink size={12} /> Audit Timeline
                    </Button>
                  </Link>
                </div>

                {/* Description & Worker notes */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-xl border border-border">
                    <p className="text-xs font-bold text-ink-400 uppercase mb-1">Citizen Problem Statement</p>
                    <p className="text-sm font-semibold text-ink-900">{c.description}</p>
                    <p className="text-xs text-ink-500 mt-2">
                      Reported by {c.citizen?.name || 'Citizen'} ({c.citizen?.email})
                    </p>
                  </div>

                  <div className="p-4 bg-success/5 rounded-xl border border-success/30">
                    <p className="text-xs font-bold text-success uppercase mb-1 flex items-center gap-1">
                      <Briefcase size={12} /> Worker Resolution Report
                    </p>
                    <p className="text-sm font-semibold text-ink-900">
                      {resolution?.description || 'Worker reported issue fixed.'}
                    </p>
                    <p className="text-xs text-ink-500 mt-2">
                      Completed by <strong className="text-ink-800">{worker?.name || 'Field Worker'}</strong> (
                      {worker?.email})
                    </p>
                  </div>
                </div>

                {/* Side-by-side Photo Comparison: BEFORE vs AFTER */}
                <div className="grid sm:grid-cols-2 gap-6 p-4 bg-ink-900/5 rounded-2xl">
                  {/* Before */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Before (Initial Report)</span>
                    </div>
                    {c.imageUrl ? (
                      <Thumbnail
                        src={c.imageUrl}
                        alt="Initial Evidence"
                        title={`Initial Evidence for #${c.publicId}`}
                        className="w-full h-52 rounded-xl"
                      />
                    ) : (
                      <div className="h-52 rounded-xl border border-dashed border-border bg-surface flex items-center justify-center text-xs text-ink-400">
                        No photo attached to original report
                      </div>
                    )}
                  </div>

                  {/* After */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-success uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle size={14} /> After (Repair Proof)
                      </span>
                    </div>
                    {resolution?.proofImageUrl ? (
                      <Thumbnail
                        src={resolution.proofImageUrl}
                        alt="Resolution Proof"
                        title={`Resolution Proof for #${c.publicId}`}
                        className="w-full h-52 rounded-xl border-2 border-success/40"
                      />
                    ) : (
                      <div className="h-52 rounded-xl border border-dashed border-danger/40 bg-danger/5 flex items-center justify-center text-xs text-danger font-medium">
                        No resolution proof photo provided
                      </div>
                    )}
                  </div>
                </div>

                {/* Officer Decision Buttons */}
                <div className="flex justify-end items-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setRejectId(c.id)}
                    disabled={isProcessing}
                    className="border-danger/40 text-danger hover:bg-danger hover:text-white text-xs flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Reject & Reopen Task
                  </Button>

                  <Button
                    onClick={() => handleVerify(c.id, true)}
                    disabled={isProcessing}
                    className="bg-success text-white hover:bg-success/90 text-xs px-6 flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Verify & Close Issue
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setRejectId(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 border border-border space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-ink-900 flex items-center gap-2">
                  <RotateCcw className="text-danger" size={18} /> Reopen Ticket
                </h3>
                <button onClick={() => setRejectId(null)} className="text-ink-400 hover:text-ink-900">
                  <XCircle size={20} />
                </button>
              </div>

              <p className="text-xs text-ink-500">
                Please specify why the resolution proof was insufficient. This will be sent to the field worker.
              </p>

              <textarea
                rows={3}
                placeholder="e.g. Photo unclear or pothole only partially filled..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-danger"
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setRejectId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleVerify(rejectId, false, rejectReason)}
                  disabled={!rejectReason.trim() || isProcessing}
                  className="bg-danger text-white hover:bg-danger/90"
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default OfficerVerificationPage;
