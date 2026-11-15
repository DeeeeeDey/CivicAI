import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  AlertTriangle,
  Bot,
  XCircle,
  ExternalLink,
  Copy,
  Tag,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const OfficerQueuePage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reclassify Modal State
  const [reclassifyTicket, setReclassifyTicket] = useState<any>(null);
  const [targetCategory, setTargetCategory] = useState('');
  const [targetSeverity, setTargetSeverity] = useState(3);
  const [reclassifyReason, setReclassifyReason] = useState('');

  // Discard Modal State
  const [discardTicket, setDiscardTicket] = useState<any>(null);
  const [discardReason, setDiscardReason] = useState('');
  const [markImproper, setMarkImproper] = useState(true);

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
    'Non-Civic Media: Image portrays entertainment, stage performance, or indoor personal media.',
    'False Report: Field inspection found zero civic damage or public infrastructure hazard.',
    'Prank / Spam: Report is not a genuine community municipal issue.',
    'Private Grounds: Location falls inside private residence or non-municipal compound.',
    'Duplicate / Invalid: Already logged or non-actionable.'
  ];

  const openReclassifyModal = (ticket: any) => {
    setReclassifyTicket(ticket);
    setTargetCategory(ticket.category?.name || 'General Municipal Issue');
    setTargetSeverity(ticket.severity || 3);
    setReclassifyReason('');
  };

  const openDiscardModal = (ticket: any) => {
    setDiscardTicket(ticket);
    setDiscardReason('');
    setMarkImproper(true);
  };

  const handleReclassifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reclassifyTicket || !reclassifyReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${reclassifyTicket.id}/reclassify`, {
        categoryName: targetCategory,
        severity: targetSeverity,
        reason: reclassifyReason
      });
      queryClient.invalidateQueries({ queryKey: ['officerMasterQueue'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setReclassifyTicket(null);
      alert('Issue category reclassified! Citizen notified via email & in-app message.');
    } catch (err: any) {
      alert('Failed to reclassify: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discardTicket || !discardReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${discardTicket.id}/discard`, {
        reason: discardReason,
        markImproperCategory: markImproper
      });
      queryClient.invalidateQueries({ queryKey: ['officerMasterQueue'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setDiscardTicket(null);
      alert('Issue discarded as false/invalid! Citizen notified via email & in-app message.');
    } catch (err: any) {
      alert('Failed to discard: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { data: complaints, isLoading, error } = useQuery({
    queryKey: ['officerMasterQueue'],
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !selectedWorkerId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/officers/${selectedTicket.id}/assign`, {
        workerId: selectedWorkerId,
        notes
      });
      queryClient.invalidateQueries({ queryKey: ['officerMasterQueue'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
      setSelectedTicket(null);
      setSelectedWorkerId('');
      setNotes('');
    } catch (err: any) {
      alert('Failed to dispatch worker: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = complaints?.filter((c: any) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'UNASSIGNED'
        ? c.status === 'REPORTED' || c.status === 'UNDER_REVIEW'
        : c.status === statusFilter;

    const matchesSearch =
      search.trim() === '' ||
      c.publicId.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <FileText className="text-accent" size={32} /> Municipal Triage Queue
          </h1>
          <p className="text-ink-500 mt-1">Review incoming civic issues, assign field workers, and track operations.</p>
        </div>
        <Badge color="info" className="text-sm py-1 px-3">
          {filtered.length} tickets matching filter
        </Badge>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-1.5 p-1 bg-surface rounded-xl border border-border w-full sm:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'UNASSIGNED', label: 'Unassigned / Needs Dispatch' },
            { key: 'ASSIGNED', label: 'Assigned' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'RESOLVED', label: 'Resolved' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                statusFilter === tab.key ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search queue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-28 bg-surface rounded-2xl"></div>
          <div className="h-28 bg-surface rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load queue.</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center text-ink-500">
          <CheckCircle2 size={36} className="mx-auto text-success mb-2" />
          <p className="font-bold text-lg text-ink-900">Queue is clear!</p>
          <p className="text-xs">No tickets match the selected status filter or search query.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((c: any) => {
            const isUnassigned = c.status === 'REPORTED' || c.status === 'UNDER_REVIEW';

            return (
              <GlassCard key={c.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  {/* Left content with thumbnail */}
                  <div className="flex-1 flex gap-4">
                    {c.imageUrl && (
                      <Thumbnail
                        src={c.imageUrl}
                        alt="Issue photo"
                        title={`Evidence for #${c.publicId}`}
                        className="w-24 h-24 shrink-0 rounded-xl"
                      />
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-surface px-2 py-0.5 rounded border border-border">
                          #{c.publicId}
                        </span>
                        <Badge
                          color={
                            c.status === 'RESOLVED' || c.status === 'VERIFIED'
                              ? 'success'
                              : c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
                              ? 'warning'
                              : 'info'
                          }
                        >
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
                        {c.isMergedChild && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Copy size={11} className="text-amber-700" />
                            Merged into #{c.aiAnalysis?.duplicateOf}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-semibold text-ink-900">{c.description}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
                        <span>Reported by {c.citizen?.name || 'Citizen'}</span>
                        <span>•</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>
                          {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex sm:flex-col items-stretch gap-1.5 shrink-0 w-full sm:w-36 pt-2 sm:pt-0">
                    {isUnassigned ? (
                      <Button onClick={() => setSelectedTicket(c)} className="text-xs w-full py-1.5">
                        Dispatch Worker
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTicket(c)}
                        className="text-xs w-full py-1.5 flex items-center justify-center gap-1"
                      >
                        Reassign Worker
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={() => openReclassifyModal(c)}
                      className="text-xs w-full py-1.5 flex items-center justify-center gap-1 text-ink-700 hover:text-accent hover:border-accent/40"
                    >
                      <Tag size={12} /> Reclassify
                    </Button>

                    {c.status !== 'REJECTED' && (
                      <Button
                        variant="secondary"
                        onClick={() => openDiscardModal(c)}
                        className="text-xs w-full py-1.5 flex items-center justify-center gap-1 text-danger hover:bg-danger/5 hover:border-danger/30"
                      >
                        <Trash2 size={12} /> Discard False
                      </Button>
                    )}

                    <Link to={`/track/${c.publicId}`} className="w-full">
                      <Button variant="secondary" className="text-xs w-full py-1.5 flex items-center justify-center gap-1">
                        <ExternalLink size={12} /> Track
                      </Button>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Dispatch Modal */}
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
              className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                <h2 className="text-lg font-bold text-ink-900">Dispatch Worker for #{selectedTicket.publicId}</h2>
                <button onClick={() => setSelectedTicket(null)} className="text-ink-500 hover:text-ink-900">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleAssign} className="p-6 space-y-4">
                <div className="p-3.5 bg-ink-900/5 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-ink-900">{selectedTicket.category?.name || 'General Issue'}</p>
                  <p className="text-ink-600">{selectedTicket.description}</p>
                </div>

                {selectedTicket.mergedTickets && selectedTicket.mergedTickets.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Copy size={13} /> Consolidated Community Tickets ({selectedTicket.mergedTickets.length} Merged)
                    </p>
                    <p className="text-ink-600">
                      Contains: <strong>{selectedTicket.mergedTickets.map((t: string) => '#' + t).join(', ')}</strong>.
                      All {selectedTicket.mergedTickets.length + 1} citizens will automatically receive notification updates.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1.5">
                    Select Field Worker
                  </label>
                  <select
                    required
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select available worker...</option>
                    {workers?.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.email}) — {w.activeTasksCount || 0} active jobs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1.5">
                    Dispatch Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Prioritize morning repair due to school traffic..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setSelectedTicket(null)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !selectedWorkerId}>
                    {isSubmitting ? 'Dispatching...' : 'Confirm Assignment'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reclassify Modal */}
      <AnimatePresence>
        {reclassifyTicket && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setReclassifyTicket(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Tag size={18} className="text-accent" /> Reclassify Ticket #{reclassifyTicket.publicId}
                </h2>
                <button onClick={() => setReclassifyTicket(null)} className="text-ink-500 hover:text-ink-900">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleReclassifySubmit} className="p-6 space-y-4">
                <div className="p-3 bg-ink-900/5 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-ink-900">Issue: {reclassifyTicket.description}</p>
                  <p className="text-ink-500 font-mono">Current Category: {reclassifyTicket.category?.name || 'General'}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1">Target Category</label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-ink-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1">Severity Level</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTargetSeverity(lvl)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          targetSeverity === lvl
                            ? 'bg-accent text-white border-accent shadow-sm'
                            : 'bg-surface text-ink-700 border-border hover:bg-ink-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1">
                    Reason for Reclassification <span className="text-danger">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Explain why this problem is being reclassified (will be emailed to the reporting citizen)..."
                    value={reclassifyReason}
                    onChange={(e) => setReclassifyReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setReclassifyTicket(null)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !reclassifyReason.trim()} className="bg-accent text-white hover:bg-accent-hover">
                    {isSubmitting ? 'Updating...' : 'Save & Notify Citizen'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discard as False Modal */}
      <AnimatePresence>
        {discardTicket && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setDiscardTicket(null)}
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface">
                <h2 className="text-lg font-bold text-danger flex items-center gap-2">
                  <Trash2 size={18} /> Discard Issue as False Report (#{discardTicket.publicId})
                </h2>
                <button onClick={() => setDiscardTicket(null)} className="text-ink-500 hover:text-ink-900">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleDiscardSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-danger">Issue: {discardTicket.description}</p>
                  <p className="text-ink-600">
                    Discarding marks this issue as REJECTED. The citizen will be sent an email explaining why this report was discarded.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1">Select Preset Reason</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setDiscardReason(e.target.value);
                    }}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Choose a reason preset...</option>
                    {discardPresets.map((preset, idx) => (
                      <option key={idx} value={preset}>{preset}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-900 uppercase block mb-1">
                    Officer Explanation <span className="text-danger">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Detailed explanation sent to the citizen..."
                    value={discardReason}
                    onChange={(e) => setDiscardReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-ink-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markImproper}
                    onChange={(e) => setMarkImproper(e.target.checked)}
                    className="rounded border-border text-danger focus:ring-danger"
                  />
                  <span>Also update category to &quot;Improper / Non-Civic Category&quot;</span>
                </label>

                <div className="pt-2 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setDiscardTicket(null)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !discardReason.trim()} className="bg-danger text-white hover:bg-danger-hover border-danger">
                    {isSubmitting ? 'Discarding...' : 'Discard as False & Notify'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default OfficerQueuePage;
