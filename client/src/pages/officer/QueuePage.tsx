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
  ExternalLink
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
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                    {isUnassigned ? (
                      <Button onClick={() => setSelectedTicket(c)} className="text-xs w-full">
                        Dispatch Worker
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedTicket(c)}
                        className="text-xs w-full flex items-center justify-center gap-1"
                      >
                        Reassign Worker
                      </Button>
                    )}

                    <Link to={`/track/${c.publicId}`} className="w-full sm:w-auto">
                      <Button variant="secondary" className="text-xs w-full flex items-center justify-center gap-1.5">
                        <ExternalLink size={13} /> Track
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
    </div>
  );
};
export default OfficerQueuePage;
