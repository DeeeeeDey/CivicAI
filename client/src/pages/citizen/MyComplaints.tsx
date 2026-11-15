import { useState } from 'react';
import { useComplaints } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Clock, MapPin, CheckCircle2, ExternalLink, Search, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Thumbnail } from '../../components/ui/ImageLightbox';

export const MyComplaints = () => {
  const { data: complaints, isLoading } = useComplaints();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const myComplaints = complaints?.filter((c: any) => c.citizenId === user?.id) || [];

  const filteredComplaints = myComplaints.filter((c: any) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'RESOLVED'
        ? c.status === 'RESOLVED' || c.status === 'VERIFIED'
        : c.status !== 'RESOLVED' && c.status !== 'VERIFIED';

    const matchesSearch =
      searchQuery.trim() === '' ||
      c.publicId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 mb-2">My Complaints</h1>
          <p className="text-ink-500">Track the status, timeline, and resolution proof for issues you have reported.</p>
        </div>
        <Link to="/report">
          <Button className="w-full md:w-auto">+ Report New Issue</Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border w-full sm:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              filter === 'ALL' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            All ({myComplaints.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              filter === 'ACTIVE' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Active ({myComplaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length})
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              filter === 'RESOLVED' ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            Resolved ({myComplaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-44 bg-white/40 rounded-2xl"></div>
          <div className="h-44 bg-white/40 rounded-2xl"></div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <GlassCard className="text-center py-16">
          <CheckCircle2 size={48} className="mx-auto text-ink-300 mb-4" />
          <h3 className="text-xl font-bold text-ink-900 mb-2">
            {myComplaints.length === 0 ? "No complaints yet" : "No matching complaints"}
          </h3>
          <p className="text-ink-500 mb-6">
            {myComplaints.length === 0
              ? "You haven't reported any issues in the community yet."
              : "Try adjusting your filter or search keywords."}
          </p>
          {myComplaints.length === 0 && (
            <Link to="/report">
              <Button>Report an Issue Now</Button>
            </Link>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {filteredComplaints.map((complaint: any) => {
            const resolution = complaint.resolutions?.[0];
            return (
              <GlassCard key={complaint.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-ink-900">{complaint.category?.name || 'Report'}</h3>
                      <Badge color={complaint.status === 'RESOLVED' ? 'success' : complaint.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                      <Badge color={complaint.severity >= 4 ? 'danger' : complaint.severity >= 3 ? 'warning' : 'info'}>
                        Severity: {complaint.severity}/5
                      </Badge>
                    </div>
                    <p className="text-ink-700 font-mono text-sm font-semibold mb-1">{complaint.publicId}</p>
                    <p className="text-ink-500 text-sm flex items-center gap-2">
                      <MapPin size={14} /> {typeof complaint.latitude === 'number' ? complaint.latitude.toFixed(4) : (complaint.latitude || '0.0000')}, {typeof complaint.longitude === 'number' ? complaint.longitude.toFixed(4) : (complaint.longitude || '0.0000')}
                    </p>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <p className="text-sm text-ink-500 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                    <Link to={`/track/${complaint.publicId}`}>
                      <Button variant="secondary" className="text-xs flex items-center gap-1.5 py-1 px-3">
                        <ExternalLink size={12} /> Track Live
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-border">
                  <p className="text-ink-900 font-medium">{complaint.description}</p>
                  {complaint.imageUrl && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold text-ink-400 uppercase mb-1">Issue Photo (Click to zoom)</p>
                      <Thumbnail
                        src={complaint.imageUrl}
                        alt="Complaint Evidence"
                        title={`Evidence for #${complaint.publicId}`}
                        className="h-48 w-full max-w-md rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Worker Resolution Proof if Resolved */}
                {resolution && resolution.proofImageUrl && (
                  <div className="bg-success/5 border border-success/30 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-bold text-success uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Camera size={16} /> Field Resolution Proof (Click to zoom)
                    </h4>
                    {resolution.description && (
                      <p className="text-sm text-ink-800 mb-3">{resolution.description}</p>
                    )}
                    <Thumbnail
                      src={resolution.proofImageUrl}
                      alt="Resolution Evidence"
                      title={`Resolution Proof #${complaint.publicId}`}
                      className="h-48 w-full max-w-md rounded-xl border border-success/30"
                    />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock size={16} /> Audit Timeline
                  </h4>
                  {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                    <div className="space-y-4">
                      {complaint.statusHistory.map((history: any, idx: number) => (
                        <div key={history.id} className="flex gap-4 relative">
                          {idx !== complaint.statusHistory.length - 1 && (
                            <div className="absolute top-6 left-3 bottom-[-16px] w-[2px] bg-border z-0"></div>
                          )}
                          <div className="w-6 h-6 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center shrink-0 z-10 mt-0.5"></div>
                          <div>
                            <p className="font-bold text-ink-900 text-sm">{history.status.replace('_', ' ')}</p>
                            <p className="text-xs text-ink-500">{new Date(history.createdAt).toLocaleString()}</p>
                            {history.notes && (
                              <p className="text-xs text-ink-700 mt-1 bg-surface p-2 rounded-lg border border-border">
                                {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0 z-10 mt-0.5">
                        <CheckCircle2 size={12} />
                      </div>
                      <div>
                        <p className="font-bold text-ink-900 text-sm">Reported</p>
                        <p className="text-xs text-ink-500">{new Date(complaint.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-ink-700 mt-1 bg-surface p-2 rounded-lg border border-border">
                          Complaint logged and AI assessment completed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
