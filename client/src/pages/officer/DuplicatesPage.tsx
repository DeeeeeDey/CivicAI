import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const OfficerDuplicatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MODERATE'>('ALL');
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: duplicates = [], isLoading, error } = useQuery({
    queryKey: ['officerDuplicates'],
    queryFn: async () => {
      const res = await api.get('/officers/duplicates');
      return res.data;
    },
    refetchInterval: 10000
  });

  const handleMerge = async (complaintId: string, targetPublicId?: string) => {
    if (!confirm(`Are you sure you want to merge this ticket into #${targetPublicId}? The duplicate will be closed and subscribers transferred.`)) {
      return;
    }
    setMergingId(complaintId);
    try {
      await api.post(`/officers/duplicates/${complaintId}/merge`, {
        targetPublicId
      });
      queryClient.invalidateQueries({ queryKey: ['officerDuplicates'] });
      queryClient.invalidateQueries({ queryKey: ['officerMasterQueue'] });
      queryClient.invalidateQueries({ queryKey: ['officerStats'] });
    } catch (err: any) {
      alert('Failed to merge duplicate: ' + (err.response?.data?.error || err.message));
    } finally {
      setMergingId(null);
    }
  };

  const handleDismiss = async (complaintId: string) => {
    setDismissingId(complaintId);
    try {
      await api.post(`/officers/duplicates/${complaintId}/dismiss`, {
        reason: 'Officer verified this is a distinct community issue'
      });
      queryClient.invalidateQueries({ queryKey: ['officerDuplicates'] });
      queryClient.invalidateQueries({ queryKey: ['officerMasterQueue'] });
    } catch (err: any) {
      alert('Failed to dismiss duplicate flag: ' + (err.response?.data?.error || err.message));
    } finally {
      setDismissingId(null);
    }
  };

  const filtered = duplicates.filter((item: any) => {
    const prob = item.aiAnalysis?.duplicateProbability || 0;
    if (filter === 'HIGH' && prob < 0.75) return false;
    if (filter === 'MODERATE' && (prob >= 0.75 || prob < 0.4)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchComp = item.matchedTicket;
      return (
        item.publicId?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.citizen?.name?.toLowerCase().includes(q) ||
        matchComp?.publicId?.toLowerCase().includes(q) ||
        matchComp?.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
              <Copy className="text-accent" size={32} /> Duplicate Triage Queue
            </h1>
            <span className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
              {duplicates.length} Flagged
            </span>
          </div>
          <p className="text-ink-500 mt-1 text-sm">
            AI-detected duplicate reports based on GPS proximity, category alignment, and description similarity.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-ink-900 text-paper'
                : 'text-ink-500 hover:text-ink-900 hover:bg-black/5'
            }`}
          >
            All Flagged ({duplicates.length})
          </button>
          <button
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'HIGH'
                ? 'bg-ink-900 text-paper'
                : 'text-ink-500 hover:text-ink-900 hover:bg-black/5'
            }`}
          >
            High Probability (&gt;75%)
          </button>
          <button
            onClick={() => setFilter('MODERATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'MODERATE'
                ? 'bg-ink-900 text-paper'
                : 'text-ink-500 hover:text-ink-900 hover:bg-black/5'
            }`}
          >
            Moderate (40-75%)
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input
          type="text"
          placeholder="Search by ticket ID, citizen name, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-paper-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-ink-900"
        />
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white/40 animate-pulse rounded-2xl border border-paper-line"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-16 px-6 border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink-900 mb-1">Queue Clean — No Duplicates Pending</h3>
          <p className="text-sm text-ink-500 max-w-md mx-auto">
            All active municipal complaints appear distinct. When incoming complaints closely overlap in location and topic,
            they will automatically surface here for triage.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {filtered.map((item: any) => {
            const prob = Math.round((item.aiAnalysis?.duplicateProbability || 0) * 100);
            const primary = item.matchedTicket;
            const primaryId = primary?.publicId || item.aiAnalysis?.duplicateOf || 'Unknown';

            return (
              <GlassCard
                key={item.id}
                className="p-5 md:p-6 border border-paper-line/70 hover:border-accent/40 transition-all shadow-sm"
              >
                {/* Top Match Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-paper-line/40">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                      <Sparkles size={13} className="text-amber-600" />
                      {prob}% AI Proximity &amp; Semantic Match
                    </span>
                    <span className="text-xs text-ink-500">
                      Flagged against Primary Record <strong>#{primaryId}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(item.id)}
                      disabled={dismissingId === item.id || mergingId === item.id}
                      className="text-xs text-ink-600 hover:text-ink-900"
                    >
                      <XCircle size={14} className="mr-1" />
                      Mark Distinct (Dismiss)
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleMerge(item.id, primaryId)}
                      disabled={mergingId === item.id || dismissingId === item.id}
                      className="text-xs bg-accent text-white hover:bg-accent/90 shadow-sm"
                    >
                      <Layers size={14} className="mr-1" />
                      {mergingId === item.id ? 'Merging...' : `Merge into #${primaryId}`}
                    </Button>
                  </div>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid md:grid-cols-2 gap-6 relative">
                  {/* Left: Flagged Duplicate */}
                  <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                            Flagged Duplicate
                          </span>
                          <span className="text-sm font-mono font-bold text-ink-900">
                            #{item.publicId}
                          </span>
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">
                          Reported by <strong>{item.citizen?.name || 'Citizen'}</strong> &bull; {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge color="warning" className="text-[10px]">
                        {item.status}
                      </Badge>
                    </div>

                    <div className="flex gap-3 items-start">
                      {item.imageUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-paper-line">
                          <Thumbnail
                            src={item.imageUrl}
                            alt="Duplicate photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink-700 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-ink-500">
                          <span className="px-2 py-0.5 rounded bg-surface border border-paper-line font-medium">
                            {item.category?.name || 'General'}
                          </span>
                          <Link
                            to={`/track/${item.publicId}`}
                            target="_blank"
                            className="text-accent hover:underline flex items-center gap-0.5"
                          >
                            Track <ExternalLink size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Primary Ticket */}
                  <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                            Primary Ticket (Retained)
                          </span>
                          <span className="text-sm font-mono font-bold text-ink-900">
                            #{primaryId}
                          </span>
                        </div>
                        {primary && (
                          <p className="text-xs text-ink-500 mt-0.5">
                            Reported by <strong>{primary.citizen?.name || 'Citizen'}</strong> &bull; {new Date(primary.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {primary && (
                        <Badge color="info" className="text-[10px]">
                          {primary.status}
                        </Badge>
                      )}
                    </div>

                    {primary ? (
                      <div className="flex gap-3 items-start">
                        {primary.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-paper-line">
                            <Thumbnail
                              src={primary.imageUrl}
                              alt="Primary photo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink-700 leading-relaxed line-clamp-3">
                            {primary.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-ink-500">
                            <span className="px-2 py-0.5 rounded bg-surface border border-paper-line font-medium">
                              {primary.category?.name || 'General'}
                            </span>
                            <Link
                              to={`/track/${primary.publicId}`}
                              target="_blank"
                              className="text-accent hover:underline flex items-center gap-0.5"
                            >
                              Track <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-ink-500 italic">
                        Referenced ticket #{primaryId} details loading or archived.
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
