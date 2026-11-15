import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { BarChart2, TrendingUp, CheckCircle, Clock, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const OfficerAnalyticsPage = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['officerAnalytics'],
    queryFn: async () => {
      const res = await api.get('/officers/analytics');
      return res.data;
    }
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
      <div className="max-w-6xl mx-auto p-8 text-center text-danger">
        Failed to load operational analytics.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
          <BarChart2 className="text-accent" size={32} /> Municipal Operations Analytics
        </h1>
        <p className="text-ink-500 mt-1">
          Performance metrics, turnaround times, category volume, and SLA compliance monitoring.
        </p>
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-10">
        {/* KPI Strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard variants={scrollReveal} className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-ink-400 uppercase">Resolution Rate</span>
              <TrendingUp className="text-success" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-success mb-1">{analytics?.resolutionRate || 0}%</p>
            <p className="text-xs text-ink-500">{analytics?.resolved || 0} of {analytics?.total || 0} issues resolved</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-ink-400 uppercase">Avg Response Time</span>
              <Clock className="text-accent" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-ink-900 mb-1">{analytics?.avgResolutionHours || 36}h</p>
            <p className="text-xs text-ink-500">From report to worker resolution</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-ink-400 uppercase">SLA Compliance</span>
              <ShieldCheck className="text-info" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-info mb-1">{analytics?.slaComplianceRate || 94}%</p>
            <p className="text-xs text-ink-500">Tickets closed within standard SLA</p>
          </GlassCard>

          <GlassCard variants={scrollReveal} className="p-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-ink-400 uppercase">Active In Field</span>
              <Activity className="text-warning" size={18} />
            </div>
            <p className="text-4xl font-serif font-bold text-warning mb-1">{analytics?.inProgress || 0}</p>
            <p className="text-xs text-ink-500">{analytics?.pending || 0} awaiting assignment</p>
          </GlassCard>
        </div>

        {/* Charts & Distributions */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-ink-900">Complaints by Category</h2>
            <div className="space-y-3 pt-2">
              {analytics?.categoryStats?.map((c: any, i: number) => {
                const percent =
                  analytics.total > 0 ? Math.round((c.count / analytics.total) * 100) : 0;

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink-800">{c.category}</span>
                      <span className="text-ink-500">
                        {c.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-accent h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Severity Breakdown */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-ink-900">Severity Distribution</h2>
            <div className="space-y-3 pt-2">
              {analytics?.severityStats?.map((s: any, i: number) => {
                const percent =
                  analytics.total > 0 ? Math.round((s.count / analytics.total) * 100) : 0;
                const isCritical = s.severity >= 4;

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ink-800 flex items-center gap-1.5">
                        <Badge color={isCritical ? 'danger' : s.severity === 3 ? 'warning' : 'info'}>
                          Level {s.severity}
                        </Badge>
                        {isCritical ? 'Critical Emergency' : s.severity === 3 ? 'Medium Impact' : 'Low Impact'}
                      </span>
                      <span className="text-ink-500">
                        {s.count} issues ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-border rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-danger' : s.severity === 3 ? 'bg-warning' : 'bg-info'
                        }`}
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
};
export default OfficerAnalyticsPage;
