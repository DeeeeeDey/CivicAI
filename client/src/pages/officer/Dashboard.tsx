import { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { AlertTriangle, Bot, XCircle, Users, CheckCircle2, Clock, ArrowRight, Eye, ShieldAlert, Copy } from 'lucide-react';
import { api } from '../../api/axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const OfficerDashboard = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'URGENT' | 'HIGH_SEV' | 'ALL'>('URGENT');

  const { data: stats } = useQuery({
    queryKey: ['officerStats'],
    queryFn: async () => {
      const res = await api.get('/officers/stats');
      return res.data;
    }
  });

  const { data: allComplaints, isLoading: compLoading } = useQuery({
    queryKey: ['officerComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints');
      return res.data;
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

  // Filter complaints for the triage queue
  const displayComplaints = (allComplaints || []).filter((c: any) => {
    if (filter === 'URGENT') {
      return c.status === 'REPORTED' || c.status === 'UNDER_REVIEW' || (c.severity >= 4 && c.status !== 'RESOLVED' && c.status !== 'VERIFIED');
    }
    if (filter === 'HIGH_SEV') {
      return c.severity >= 4 && c.status !== 'RESOLVED' && c.status !== 'VERIFIED';
    }
    return c.status !== 'RESOLVED' && c.status !== 'VERIFIED';
  });

  const handleReview = async (id: string, action: 'accept' | 'override') => {
    if (action === 'override' && !overrideReason) {
      alert('Override reason required!');
      return;
    }
    if (action === 'accept' && !selectedWorkerId) {
      alert('Please select a field worker to assign this ticket to.');
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
      }
      queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setSelectedTicket(null);
      setOverrideReason('');
      setSelectedWorkerId('');
    } catch (err: any) {
      alert('Error processing review: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 relative pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900">Officer Command Center</h1>
          <p className="text-ink-500 mt-1">Overview of municipal triage, incoming queues, and dispatched field teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/officer/duplicates">
            <Button variant="outline" className="text-xs flex items-center gap-2 border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100">
              <Copy size={14} className="text-amber-700" /> Duplicate Queue
            </Button>
          </Link>
          <Link to="/officer/verification">
            <Button variant="secondary" className="text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="text-success" /> Verification Queue ({stats?.needsVerification || 0})
            </Button>
          </Link>
          <Link to="/officer/queue">
            <Button className="text-xs flex items-center gap-1.5">
              Full Triage Queue <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-10">
        {/* KPI Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard variants={scrollReveal} className="p-6">
            <h3 className="text-ink-400 text-[11px] font-bold uppercase tracking-wider mb-2">Pending Triage</h3>
            <p className="text-4xl font-serif font-bold text-info mb-1">{stats?.pendingReview || 0}</p>
            <p className="text-xs text-ink-500">Awaiting officer assignment</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <h3 className="text-ink-400 text-[11px] font-bold uppercase tracking-wider mb-2">Needs Verification</h3>
            <p className="text-4xl font-serif font-bold text-success mb-1">{stats?.needsVerification || 0}</p>
            <p className="text-xs text-ink-500">Proof uploaded by workers</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <h3 className="text-ink-400 text-[11px] font-bold uppercase tracking-wider mb-2">Active Field Tasks</h3>
            <p className="text-4xl font-serif font-bold text-ink-900 mb-1">{stats?.activeTasks || 0}</p>
            <p className="text-xs text-ink-500">In-progress on the ground</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <h3 className="text-ink-400 text-[11px] font-bold uppercase tracking-wider mb-2">SLA Breaches (48h)</h3>
            <p className={`text-4xl font-serif font-bold mb-1 ${stats?.slaBreaches > 0 ? 'text-danger' : 'text-ink-900'}`}>
              {stats?.slaBreaches || 0}
            </p>
            <p className="text-xs text-ink-500">{stats?.slaBreaches > 0 ? 'Overdue for dispatch' : 'All SLAs nominal'}</p>
          </GlassCard>
        </div>

        {/* Hotspot Detection Alert */}
        {hotspots && hotspots.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <ShieldAlert className="text-accent" size={20} /> AI Hotspot & Cluster Detection
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {hotspots.map((h: any, idx: number) => (
                <GlassCard key={idx} className="p-5 border-l-4 border-l-accent shadow-md bg-surface">
                  <div className="flex justify-between items-center mb-2">
                    <Badge color="warning">{h.category}</Badge>
                    <Badge color="danger">Severity {h.topSeverity}</Badge>
                  </div>
                  <p className="text-sm text-ink-900 font-semibold">{h.insight}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Triage Queue */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-danger" /> Urgent Queue for Review
            </h2>

            {/* Filter Pills */}
            <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
              <button
                onClick={() => setFilter('URGENT')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === 'URGENT' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                Urgent ({allComplaints?.filter((c: any) => c.status === 'REPORTED' || (c.severity >= 4 && c.status !== 'RESOLVED')).length || 0})
              </button>
              <button
                onClick={() => setFilter('HIGH_SEV')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === 'HIGH_SEV' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                Critical Severity ({allComplaints?.filter((c: any) => c.severity >= 4 && c.status !== 'RESOLVED').length || 0})
              </button>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === 'ALL' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                All Active ({allComplaints?.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length || 0})
              </button>
            </div>
          </div>

          {compLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-28 bg-surface rounded-2xl"></div>
              <div className="h-28 bg-surface rounded-2xl"></div>
            </div>
          ) : displayComplaints.length === 0 ? (
            <GlassCard className="p-12 text-center text-ink-500">
              <CheckCircle2 size={36} className="mx-auto text-success mb-2" />
              <p className="font-bold text-lg text-ink-900">Urgent Queue Clean!</p>
              <p className="text-sm">No issues currently flagged for urgent triage.</p>
            </GlassCard>
          ) : (
            displayComplaints.slice(0, 10).map((c: any) => (
              <GlassCard
                interactive
                key={c.id}
                className="p-6 flex flex-col sm:flex-row justify-between items-start gap-4"
              >
                <div className="flex-1 flex gap-4">
                  {c.imageUrl && (
                    <Thumbnail
                      src={c.imageUrl}
                      alt="Issue Photo"
                      title={`Complaint #${c.publicId}`}
                      className="w-24 h-24 shrink-0 rounded-xl"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono font-bold text-ink-400 uppercase">{c.publicId}</span>
                      <Badge color={c.status === 'REPORTED' ? 'info' : c.status === 'ASSIGNED' ? 'warning' : 'default'}>
                        {c.status.replace('_', ' ')}
                      </Badge>
                      <Badge color={c.severity >= 4 ? 'danger' : c.severity === 3 ? 'warning' : 'info'}>
                        Severity {c.severity}/5
                      </Badge>
                      <Badge color="default">{c.category?.name || 'General'}</Badge>
                    </div>
                    <h4 className="font-bold text-base text-ink-900">{c.description}</h4>
                    <p className="text-xs text-ink-500">
                      Reported {new Date(c.createdAt).toLocaleDateString()} • {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>

                <Button onClick={() => setSelectedTicket(c)} className="shrink-0 text-xs py-2 px-4">
                  Review & Dispatch
                </Button>
              </GlassCard>
            ))
          )}
        </div>
      </motion.div>

      {/* Triage Review Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setSelectedTicket(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                <h2 className="text-lg font-bold text-ink-900">Triage Ticket #{selectedTicket.publicId}</h2>
                <button onClick={() => setSelectedTicket(null)} className="text-ink-500 hover:text-ink-900">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                {/* Photo & Description */}
                <div className="p-4 bg-ink-900/5 rounded-xl flex gap-4">
                  {selectedTicket.imageUrl && (
                    <Thumbnail
                      src={selectedTicket.imageUrl}
                      alt="Ticket Evidence"
                      title={`Evidence for #${selectedTicket.publicId}`}
                      className="w-28 h-24 shrink-0 rounded-xl"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-ink-400 uppercase mb-1">Issue Description</p>
                    <p className="text-sm font-semibold text-ink-900">{selectedTicket.description}</p>
                  </div>
                </div>

                {/* AI Assessment */}
                <div className="p-4 border border-accent/20 bg-accent/5 rounded-xl relative">
                  <div className="absolute top-4 right-4">
                    <Badge color="accent">AI Multimodal</Badge>
                  </div>
                  <h3 className="font-bold text-ink-900 flex items-center gap-2 mb-3">
                    <Bot className="text-accent" size={18} /> Automated AI Assessment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-500 font-bold uppercase">Predicted Category</p>
                      <p className="font-semibold text-ink-900">{selectedTicket.category?.name || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 font-bold uppercase">Assessed Severity</p>
                      <p className="font-semibold text-ink-900">{selectedTicket.severity}/5</p>
                    </div>
                  </div>
                </div>

                {/* Dispatch Field Worker */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-ink-900 block mb-1.5">Assign Municipal Field Worker</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-border bg-surface text-ink-900 font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                    >
                      <option value="">Select an available field worker...</option>
                      {workers?.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.email}) — {w.activeTasksCount || 0} active tasks
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-ink-900 block mb-1.5">Override Notes / Instructions</label>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      rows={2}
                      placeholder="Optional notes or instructions for the worker..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-surface flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handleReview(selectedTicket.id, 'override')}
                  disabled={isSubmitting}
                  className="border-danger/40 text-danger hover:bg-danger hover:text-white text-xs"
                >
                  Override Classification
                </Button>
                <Button
                  onClick={() => handleReview(selectedTicket.id, 'accept')}
                  disabled={isSubmitting || !selectedWorkerId}
                  className="text-xs px-6"
                >
                  {isSubmitting ? 'Dispatching...' : 'Accept & Dispatch Worker'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
