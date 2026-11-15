import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import {
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Server,
  ArrowRight,
  TrendingUp,
  Cpu,
  Mail,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminOverview = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 30000 // auto-refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-20 bg-surface rounded-2xl"></div>
        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <GlassCard className="p-8 text-center border-danger/30 bg-danger/5">
          <AlertTriangle size={36} className="mx-auto text-danger mb-3" />
          <h2 className="text-xl font-bold text-danger mb-2">Unable to Load Platform Metrics</h2>
          <p className="text-ink-600 mb-4">
            {(error as any)?.response?.data?.error || (error as any).message || 'Server error'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry Connection</Button>
        </GlassCard>
      </div>
    );
  }

  const resolutionRate =
    stats?.totalComplaints > 0
      ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
      : 100;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <Shield className="text-accent" size={32} /> Command Overview
          </h1>
          <p className="text-ink-500 mt-1">Real-time pulse of city operations, triage queue, and system infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 text-success text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-ping"></span> Live Operations
          </span>
          <Link to="/admin/complaints">
            <Button variant="secondary" className="text-xs">
              View Master Queue
            </Button>
          </Link>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-10">
        {/* Primary KPI Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard interactive variants={scrollReveal} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Total Complaints</span>
              <Activity className="text-accent" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-ink-900 mb-2">{stats?.totalComplaints || 0}</p>
            <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
              <TrendingUp size={14} /> {resolutionRate}% Resolution Rate
            </div>
          </GlassCard>

          <GlassCard interactive variants={scrollReveal} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Resolved Issues</span>
              <CheckCircle2 className="text-success" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-success mb-2">{stats?.resolvedComplaints || 0}</p>
            <p className="text-xs text-ink-500">Fixed & verified by field teams</p>
          </GlassCard>

          <GlassCard interactive variants={scrollReveal} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Active Field Tasks</span>
              <Clock className="text-warning" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-warning mb-2">
              {(stats?.inProgress || 0) + (stats?.assigned || 0)}
            </p>
            <p className="text-xs text-ink-500">
              {stats?.inProgress || 0} in progress, {stats?.assigned || 0} dispatched
            </p>
          </GlassCard>

          <GlassCard interactive variants={scrollReveal} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">SLA Breaches</span>
              <AlertTriangle className={stats?.slaBreaches > 0 ? 'text-danger' : 'text-success'} size={18} />
            </div>
            <p className={`text-4xl font-serif font-bold mb-2 ${stats?.slaBreaches > 0 ? 'text-danger' : 'text-ink-900'}`}>
              {stats?.slaBreaches || 0}
            </p>
            <p className="text-xs text-ink-500">
              {stats?.slaBreaches === 0 ? 'All tickets within SLA target' : 'Pending review > 48 hours'}
            </p>
          </GlassCard>
        </div>

        {/* User Breakdown Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/users" className="block">
            <div className="p-4 rounded-xl border border-border bg-surface hover:border-accent/40 transition-all">
              <span className="text-xs font-bold text-ink-400 uppercase">Citizens</span>
              <p className="text-2xl font-bold text-info mt-1">{stats?.usersByRole?.CITIZEN || 0}</p>
            </div>
          </Link>
          <Link to="/admin/users" className="block">
            <div className="p-4 rounded-xl border border-border bg-surface hover:border-accent/40 transition-all">
              <span className="text-xs font-bold text-ink-400 uppercase">Field Workers</span>
              <p className="text-2xl font-bold text-success mt-1">{stats?.usersByRole?.WORKER || 0}</p>
            </div>
          </Link>
          <Link to="/admin/users" className="block">
            <div className="p-4 rounded-xl border border-border bg-surface hover:border-accent/40 transition-all">
              <span className="text-xs font-bold text-ink-400 uppercase">Officers</span>
              <p className="text-2xl font-bold text-warning mt-1">{stats?.usersByRole?.OFFICER || 0}</p>
            </div>
          </Link>
          <Link to="/admin/users" className="block">
            <div className="p-4 rounded-xl border border-border bg-surface hover:border-accent/40 transition-all">
              <span className="text-xs font-bold text-ink-400 uppercase">Admins</span>
              <p className="text-2xl font-bold text-danger mt-1">{stats?.usersByRole?.ADMIN || 0}</p>
            </div>
          </Link>
        </div>

        {/* Main Content Split: Recent Activity & Diagnostics */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Complaints Feed (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
                <Activity size={18} className="text-accent" /> Recent Activity Stream
              </h2>
              <Link to="/admin/complaints" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                View All ({stats?.totalComplaints || 0}) <ArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentComplaints?.length === 0 ? (
                <GlassCard className="p-8 text-center text-ink-500">No issues reported yet.</GlassCard>
              ) : (
                stats?.recentComplaints?.map((c: any) => (
                  <GlassCard key={c.id} interactive className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-ink-400 uppercase">{c.publicId}</span>
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
                        <Badge color={c.severity >= 4 ? 'danger' : 'info'}>Sev {c.severity}/5</Badge>
                      </div>
                      <p className="text-sm font-semibold text-ink-900 truncate">{c.description}</p>
                      <p className="text-xs text-ink-500 mt-1">
                        Reported by {c.citizen?.name || 'Citizen'} • {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/track/${c.publicId}`}>
                      <Button variant="secondary" className="text-xs py-1.5 px-3 shrink-0">
                        Inspect
                      </Button>
                    </Link>
                  </GlassCard>
                ))
              )}
            </div>
          </div>

          {/* Infrastructure & Categories (1 Col) */}
          <div className="space-y-6">
            {/* System Infrastructure Health */}
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Server size={18} className="text-ink-400" /> Infrastructure Health
              </h2>
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    <Database size={14} className="text-info" /> Primary Database
                  </span>
                  <span className="text-xs font-bold text-success flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success"></span> Online (Postgres)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    <Cpu size={14} className="text-accent" /> AI Multimodal Triage
                  </span>
                  <span className="text-xs font-bold text-success flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success"></span> Gemini 2.5 Flash
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    <Mail size={14} className="text-warning" /> Email Dispatcher
                  </span>
                  <span className="text-xs font-bold text-success flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success"></span> Resend Engine
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-700 flex items-center gap-2">
                    <Shield size={14} className="text-accent" /> Role-Based Access
                  </span>
                  <span className="text-xs font-bold text-success flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success"></span> RBAC Enforced
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* Category Breakdown */}
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-4">Category Distribution</h2>
              <GlassCard className="p-5 space-y-3">
                {stats?.categoryBreakdown?.length === 0 ? (
                  <p className="text-xs text-ink-500">No categorised tickets yet.</p>
                ) : (
                  stats?.categoryBreakdown?.map((cat: any, i: number) => {
                    const percent =
                      stats.totalComplaints > 0
                        ? Math.round((cat.count / stats.totalComplaints) * 100)
                        : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-ink-800">{cat.name}</span>
                          <span className="text-ink-500">{cat.count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-surface-glass border border-border rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${Math.max(percent, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default AdminOverview;
