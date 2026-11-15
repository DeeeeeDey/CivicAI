import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Users, Search, Briefcase, CheckCircle2, Phone, Mail, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OfficerWorkersPage = () => {
  const [search, setSearch] = useState('');

  const { data: workers, isLoading, error } = useQuery({
    queryKey: ['officerWorkers'],
    queryFn: async () => {
      const res = await api.get('/officers/workers');
      return res.data;
    }
  });

  const filtered = workers?.filter((w: any) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <Users className="text-accent" size={32} /> Municipal Field Crew
          </h1>
          <p className="text-ink-500 mt-1">Directory of field technicians, active task loads, and completed repair history.</p>
        </div>
        <Link to="/officer/queue">
          <Button className="text-xs">Dispatch Task</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Search worker by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-surface rounded-2xl"></div>
          <div className="h-32 bg-surface rounded-2xl"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load field workers.</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center text-ink-500">
          <Users size={36} className="mx-auto text-ink-300 mb-2" />
          <p className="font-bold text-ink-900">No field workers found</p>
          <p className="text-xs">Promote users to Field Worker role in the Admin dashboard.</p>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((w: any) => {
            const initials = w.name
              ? w.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'W';

            const isHighLoad = (w.activeTasksCount || 0) >= 5;
            const isMediumLoad = (w.activeTasksCount || 0) >= 3;

            return (
              <GlassCard key={w.id} className="p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-base flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <Badge color={isHighLoad ? 'danger' : isMediumLoad ? 'warning' : 'success'}>
                      {isHighLoad ? 'High Load' : isMediumLoad ? 'Active' : 'Available'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-lg text-ink-900">{w.name}</h3>

                  <div className="space-y-1.5 text-xs text-ink-500 mt-2">
                    <p className="flex items-center gap-2">
                      <Mail size={13} className="text-ink-400" /> {w.email}
                    </p>
                    {w.phone && (
                      <p className="flex items-center gap-2">
                        <Phone size={13} className="text-ink-400" /> {w.phone}
                      </p>
                    )}
                    {w.joinedAt && (
                      <p className="flex items-center gap-2">
                        <Calendar size={13} className="text-ink-400" /> Joined {new Date(w.joinedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-surface rounded-lg border border-border">
                    <span className="text-[10px] font-bold text-ink-400 uppercase">Active Jobs</span>
                    <p className="text-xl font-bold text-warning">{w.activeTasksCount || 0}</p>
                  </div>
                  <div className="p-2 bg-surface rounded-lg border border-border">
                    <span className="text-[10px] font-bold text-ink-400 uppercase">Completed</span>
                    <p className="text-xl font-bold text-success">{w.completedCount || 0}</p>
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
export default OfficerWorkersPage;
