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
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  User,
  Briefcase,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const AdminComplaintsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: complaints, isLoading, error } = useQuery({
    queryKey: ['adminComplaintsList'],
    queryFn: async () => {
      const res = await api.get('/admin/complaints');
      return res.data;
    }
  });

  const handleDelete = async (id: string, publicId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket #${publicId}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/admin/complaints/${id}`);
      queryClient.invalidateQueries({ queryKey: ['adminComplaintsList'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err: any) {
      alert('Failed to delete complaint: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = complaints?.filter((c: any) => {
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'RESOLVED'
        ? c.status === 'RESOLVED' || c.status === 'VERIFIED'
        : c.status === statusFilter;

    const matchesSearch =
      search.trim() === '' ||
      c.publicId.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.citizen?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  }) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <FileText className="text-accent" size={32} /> Master Complaints Registry
          </h1>
          <p className="text-ink-500 mt-1">
            Global repository of all city complaints, assignment dispatches, and proof verifications.
          </p>
        </div>
        <Badge color="info" className="text-sm py-1 px-3">
          Total: {complaints?.length || 0} issues
        </Badge>
      </div>

      {/* Controls: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-1.5 p-1 bg-surface rounded-xl border border-border w-full sm:w-auto overflow-x-auto">
          {['ALL', 'REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                statusFilter === s ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {s.replace('_', ' ').toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by ID, keyword, citizen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-surface rounded-2xl"></div>
          <div className="h-32 bg-surface rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load complaints registry.</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center text-ink-500">
          <p className="text-lg font-bold mb-1">No complaints found</p>
          <p className="text-xs">No records matching the selected status or search query.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((c: any) => {
            const assignedWorker = c.assignments?.[0]?.worker;
            const resolution = c.resolutions?.[0];

            return (
              <GlassCard key={c.id} className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  {/* Left Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-sm text-ink-900 bg-surface px-2.5 py-1 rounded-md border border-border">
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

                    <p className="text-base font-semibold text-ink-900">{c.description}</p>

                    {/* Metadata Strip */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
                      <span className="flex items-center gap-1">
                        <User size={13} className="text-ink-400" />
                        Citizen: <strong className="text-ink-700">{c.citizen?.name || 'Unknown'}</strong> ({c.citizen?.email})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-ink-400" />
                        {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-ink-400" />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Assigned Worker Info */}
                    {assignedWorker && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
                        <Briefcase size={13} className="text-accent" />
                        <span className="text-ink-500">Assigned Worker:</span>
                        <strong className="text-ink-900">{assignedWorker.name}</strong> ({assignedWorker.email})
                      </div>
                    )}

                    {/* Photo previews if available */}
                    <div className="flex gap-4 pt-1">
                      {c.imageUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-ink-400 uppercase mb-1">Issue Photo (Click to zoom)</p>
                          <Thumbnail
                            src={c.imageUrl}
                            alt="Issue"
                            title={`Issue Evidence #${c.publicId}`}
                            className="w-24 h-20 rounded-lg"
                          />
                        </div>
                      )}

                      {resolution?.proofImageUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-success uppercase mb-1 flex items-center gap-1">
                            <Camera size={11} /> Repair Proof (Click to zoom)
                          </p>
                          <Thumbnail
                            src={resolution.proofImageUrl}
                            alt="Resolution"
                            title={`Resolution Proof #${c.publicId}`}
                            className="w-24 h-20 rounded-lg border border-success/40"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                    <Link to={`/track/${c.publicId}`} className="w-full sm:w-auto">
                      <Button variant="secondary" className="text-xs w-full flex items-center justify-center gap-1.5">
                        <ExternalLink size={13} /> View Audit Track
                      </Button>
                    </Link>

                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(c.id, c.publicId)}
                      disabled={deletingId === c.id}
                      className="text-xs w-full border-danger/40 text-danger hover:bg-danger hover:text-white flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} /> {deletingId === c.id ? 'Deleting...' : 'Delete'}
                    </Button>
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
export default AdminComplaintsPage;
