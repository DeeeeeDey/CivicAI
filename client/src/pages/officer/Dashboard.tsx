import { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { AlertTriangle, Bot, XCircle, Users, CheckCircle2, Clock, ArrowRight, Eye, ShieldAlert, Copy, RefreshCw, Trash2, Tag, Send } from 'lucide-react';
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
  const [triageAction, setTriageAction] = useState<'dispatch' | 'reclassify' | 'discard'>('dispatch');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [reclassifyCategory, setReclassifyCategory] = useState('');
  const [reclassifySeverity, setReclassifySeverity] = useState(3);
  const [reclassifyReason, setReclassifyReason] = useState('');
  const [discardReason, setDiscardReason] = useState('');
  const [markImproper, setMarkImproper] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCategories = [
    'Pothole',
    'Damaged Road',
    'Garbage Accumulation',
    'Illegal Dumping',
    'Water Leakage',
    'Broken Streetlight',
    'Drainage Problem',
    'Fallen Tree',
    'Damaged Footpath',
    'Damaged Public Infrastructure',
    'General Municipal Issue',
    'Improper / Non-Civic Category'
  ];

  const discardPresets = [
    'Non-Civic Media: Depicts a stage performance, concert, personal indoor scene, or unrelated entertainment photo.',
    'False Report: Visual inspection confirms no civic hazard or municipal infrastructure damage.',
    'Prank / Spam: Submission is not a genuine community infrastructure report.',
    'Private Grounds: Issue is located on private residential/commercial property outside municipal purview.',
    'Duplicate / Invalid: Already logged or not actionable by municipal teams.'
  ];

  const openReviewModal = (c: any) => {
    setSelectedTicket(c);
    setTriageAction('dispatch');
    setSelectedWorkerId('');
    setDispatchNotes('');
    setReclassifyCategory(c.category?.name || 'General Municipal Issue');
    setReclassifySeverity(c.severity || 3);
    setReclassifyReason('');
    setDiscardReason('');
    setMarkImproper(true);
  };

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

  const handleDispatch = async () => {
    if (!selectedWorkerId) {
      alert('Please select a field worker to assign this ticket to.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${selectedTicket.id}/assign`, {
        workerId: selectedWorkerId,
        notes: dispatchNotes
      });
      queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setSelectedTicket(null);
    } catch (err: any) {
      alert('Error dispatching worker: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReclassify = async () => {
    if (!reclassifyReason.trim()) {
      alert('Please explain the reclassification reason (this will be sent to the reporting citizen).');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${selectedTicket.id}/reclassify`, {
        categoryName: reclassifyCategory,
        severity: reclassifySeverity,
        reason: reclassifyReason
      });
      queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setSelectedTicket(null);
      alert('Category successfully updated! The citizen has been notified via in-app notification and email.');
    } catch (err: any) {
      alert('Error updating category: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (!discardReason.trim()) {
      alert('Please provide a reason for discarding this report (this will be sent to the reporting citizen).');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${selectedTicket.id}/discard`, {
        reason: discardReason,
        markImproperCategory: markImproper
      });
      queryClient.invalidateQueries({ queryKey: ['officerComplaints'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setSelectedTicket(null);
      alert('Report discarded as false/invalid. The citizen has been notified via in-app notification and email.');
    } catch (err: any) {
      alert('Error discarding report: ' + (err.response?.data?.error || err.message));
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
                      {c.mergedTickets && c.mergedTickets.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                          <Copy size={11} className="text-blue-700" />
                          {c.mergedTickets.length} Merged ({c.mergedTickets.map((t: string) => '#' + t).join(', ')})
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-ink-900">{c.description}</h4>
                    <p className="text-xs text-ink-500">
                      Reported {new Date(c.createdAt).toLocaleDateString()} • {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>

                <Button onClick={() => openReviewModal(c)} className="shrink-0 text-xs py-2 px-4">
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
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                <div>
                  <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                    Triage Ticket #{selectedTicket.publicId}
                  </h2>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Reported by {selectedTicket.citizen?.name || 'Citizen'} ({selectedTicket.citizen?.email || 'N/A'})
                  </p>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="text-ink-500 hover:text-ink-900">
                  <XCircle size={22} />
                </button>
              </div>

              {/* Modal Body */}
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
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-ink-400 uppercase">Issue Description</p>
                    <p className="text-sm font-semibold text-ink-900">{selectedTicket.description}</p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs">
                      <span className="font-mono text-ink-500">Current: {selectedTicket.category?.name || 'General'}</span>
                      <span>•</span>
                      <span className="font-mono text-ink-500">Severity: {selectedTicket.severity}/5</span>
                    </div>
                  </div>
                </div>

                {/* Action Navigation Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-ink-900/5 rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setTriageAction('dispatch')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      triageAction === 'dispatch' ? 'bg-accent text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    <Send size={14} /> Dispatch Worker
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageAction('reclassify')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      triageAction === 'reclassify' ? 'bg-accent text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    <RefreshCw size={14} /> Reclassify
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriageAction('discard')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      triageAction === 'discard' ? 'bg-danger text-white shadow-sm' : 'text-danger hover:bg-danger/10'
                    }`}
                  >
                    <Trash2 size={14} /> Discard as False
                  </button>
                </div>

                {/* TAB 1: DISPATCH WORKER */}
                {triageAction === 'dispatch' && (
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
                      <label className="text-sm font-bold text-ink-900 block mb-1.5">Dispatch Instructions / Notes</label>
                      <textarea
                        className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        rows={2}
                        placeholder="Instructions for the assigned worker..."
                        value={dispatchNotes}
                        onChange={(e) => setDispatchNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: RECLASSIFY / FIX IMPROPER CATEGORY */}
                {triageAction === 'reclassify' && (
                  <div className="space-y-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900">
                    <div>
                      <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                        <Tag size={16} /> Reclassify Falsely Classified Problem
                      </h4>
                      <p className="text-xs text-ink-500 mt-1">
                        Select the correct municipal category or mark as improper category. The citizen will be notified of this change by email and in-app alert.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-800 uppercase block mb-1">Target Category</label>
                      <select
                        value={reclassifyCategory}
                        onChange={(e) => setReclassifyCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        {availableCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-800 uppercase block mb-1">Adjusted Severity (1 to 5)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setReclassifySeverity(lvl)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              reclassifySeverity === lvl
                                ? 'bg-accent text-white border-accent shadow-sm'
                                : 'bg-surface text-ink-700 border-border hover:bg-ink-100'
                            }`}
                          >
                            {lvl} {lvl === 5 ? '(Critical)' : lvl === 1 ? '(Low)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-800 uppercase block mb-1">
                        Reason for Reclassification <span className="text-danger">*</span>
                      </label>
                      <textarea
                        rows={2}
                        className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Explain why this category was corrected (e.g. Stage performance photo was falsely tagged as pothole)..."
                        value={reclassifyReason}
                        onChange={(e) => setReclassifyReason(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: DISCARD AS FALSE REPORT */}
                {triageAction === 'discard' && (
                  <div className="space-y-4 p-4 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <div>
                      <h4 className="font-bold text-sm text-red-900 dark:text-red-300 flex items-center gap-2">
                        <Trash2 size={16} /> Discard Problem as False / Non-Civic
                      </h4>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        Discarding marks this issue as REJECTED and terminates all further dispatch. The citizen will be notified with the explanation below.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-800 uppercase block mb-1">Select Common Reason Preset</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setDiscardReason(e.target.value);
                        }}
                        className="w-full p-2 rounded-xl border border-border bg-surface text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                      >
                        <option value="">Choose a reason template...</option>
                        {discardPresets.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-800 uppercase block mb-1">
                        Officer Explanation <span className="text-danger">*</span>
                      </label>
                      <textarea
                        rows={2}
                        className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Explain why this problem is false or non-civic (emailed to the citizen)..."
                        value={discardReason}
                        onChange={(e) => setDiscardReason(e.target.value)}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-ink-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markImproper}
                        onChange={(e) => setMarkImproper(e.target.checked)}
                        className="rounded border-border text-danger focus:ring-danger"
                      />
                      <span>Also label ticket category as &quot;Improper / Non-Civic Category&quot;</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-border bg-surface flex justify-between items-center">
                <Button variant="secondary" onClick={() => setSelectedTicket(null)} className="text-xs">
                  Cancel
                </Button>

                {triageAction === 'dispatch' && (
                  <Button
                    onClick={handleDispatch}
                    disabled={isSubmitting || !selectedWorkerId}
                    className="text-xs px-6"
                  >
                    {isSubmitting ? 'Dispatching...' : 'Accept & Dispatch Worker'}
                  </Button>
                )}

                {triageAction === 'reclassify' && (
                  <Button
                    onClick={handleReclassify}
                    disabled={isSubmitting || !reclassifyReason.trim()}
                    className="text-xs px-6 bg-accent text-white hover:bg-accent-hover"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Reclassification & Notify Citizen'}
                  </Button>
                )}

                {triageAction === 'discard' && (
                  <Button
                    onClick={handleDiscard}
                    disabled={isSubmitting || !discardReason.trim()}
                    className="text-xs px-6 bg-danger text-white hover:bg-danger-hover border-danger"
                  >
                    {isSubmitting ? 'Discarding...' : 'Discard Problem as False & Notify'}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
