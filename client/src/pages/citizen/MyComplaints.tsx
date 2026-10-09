import { useComplaints } from '../../hooks/queries';
import { useAuthStore } from '../../store/authStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Clock, MapPin, CheckCircle2 } from 'lucide-react';

export const MyComplaints = () => {
  const { data: complaints, isLoading } = useComplaints();
  const { user } = useAuthStore();

  const myComplaints = complaints?.filter((c: any) => c.citizenId === user?.id) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink-900 mb-2">My Complaints</h1>
        <p className="text-ink-500">Track the status and updates for issues you have reported.</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-white/40 rounded-2xl"></div>
          <div className="h-40 bg-white/40 rounded-2xl"></div>
        </div>
      ) : myComplaints.length === 0 ? (
        <GlassCard className="text-center py-16">
          <CheckCircle2 size={48} className="mx-auto text-ink-300 mb-4" />
          <h3 className="text-xl font-bold text-ink-900 mb-2">No complaints yet</h3>
          <p className="text-ink-500">You haven't reported any issues in the community.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {myComplaints.map((complaint: any) => (
            <GlassCard key={complaint.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-ink-900">{complaint.category?.name || 'Report'}</h3>
                    <Badge color={complaint.status === 'RESOLVED' ? 'success' : complaint.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                    <Badge color={complaint.severity >= 4 ? 'danger' : complaint.severity >= 3 ? 'warning' : 'info'}>
                      Severity: {complaint.severity}/5
                    </Badge>
                  </div>
                  <p className="text-ink-700 font-medium mb-1">{complaint.publicId}</p>
                  <p className="text-ink-500 flex items-center gap-2"><MapPin size={16}/> {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-ink-500 font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-border">
                <p className="text-ink-900">{complaint.description}</p>
                {complaint.imageUrl && (
                   <div className="mt-4 rounded-lg overflow-hidden border border-border h-48 bg-ink-900/5">
                      <img src={complaint.imageUrl} alt="Complaint Evidence" className="w-full h-full object-cover" />
                   </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={16} /> Timeline & Updates
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
                          <p className="font-bold text-ink-900">{history.status.replace('_', ' ')}</p>
                          <p className="text-sm text-ink-500">{new Date(history.createdAt).toLocaleString()}</p>
                          {history.notes && <p className="text-sm text-ink-700 mt-1 bg-surface p-2 rounded-lg">{history.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shrink-0 z-10 mt-0.5"><CheckCircle2 size={12}/></div>
                    <div>
                      <p className="font-bold text-ink-900">Reported</p>
                      <p className="text-sm text-ink-500">{new Date(complaint.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-ink-700 mt-1 bg-surface p-2 rounded-lg">Complaint logged and AI analysis complete.</p>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
