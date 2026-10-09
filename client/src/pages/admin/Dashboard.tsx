import { useState } from 'react';
import { useAdminUsers } from '../../hooks/queries';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Shield, Users, Settings, Activity, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    }
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    } catch (err: any) {
      alert("Failed to update role: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const isLoading = usersLoading || statsLoading;
  const error = usersError;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ink-900 flex items-center gap-3">
              <Shield className="text-accent" size={32} /> System Admin
            </h1>
            <p className="text-ink-500">Manage users, roles, and global platform settings.</p>
         </div>
      </div>

      {error ? (<div className="text-red-500 font-bold p-12 text-center">API Error: {(error as any)?.response?.data?.error || (error as any).message}</div>) : isLoading ? (
        <div className="animate-pulse space-y-6"><div className="h-32 bg-white/40 rounded-[24px]"></div></div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
          
          {/* STATS */}
          <div className="grid md:grid-cols-4 gap-6">
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={14}/> Total Tickets</h3>
              <p className="text-4xl font-serif text-ink-900">{stats?.totalComplaints || 0}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle2 size={14}/> Resolved</h3>
              <p className="text-4xl font-serif text-success">{stats?.resolvedComplaints || 0}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Total Users</h3>
              <p className="text-4xl font-serif text-info">{stats?.totalUsers || 0}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Platform Load</h3>
              <p className="text-4xl font-serif text-warning">
                 {stats?.totalComplaints ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}% <span className="text-sm font-sans text-ink-500">fixed</span>
              </p>
            </GlassCard>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">User Directory</h2>
              <GlassCard className="p-0 overflow-hidden border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface/50">
                      <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Name</th>
                      <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Role</th>
                      <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user: any) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-ink-900">{user.name}</td>
                        <td className="p-4 text-sm text-ink-500">{user.email}</td>
                        <td className="p-4 text-sm">
                          <Badge color={user.role === 'ADMIN' ? 'danger' : user.role === 'OFFICER' ? 'warning' : user.role === 'WORKER' ? 'success' : 'info'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-right">
                          <select 
                             disabled={updatingId === user.id}
                             value={user.role} 
                             onChange={(e) => handleRoleChange(user.id, e.target.value)}
                             className="text-xs p-1.5 rounded border border-border bg-surface focus:ring-1 focus:ring-accent outline-none"
                          >
                             <option value="CITIZEN">Citizen</option>
                             <option value="WORKER">Worker</option>
                             <option value="OFFICER">Officer</option>
                             <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </div>

            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><Settings size={20} className="text-ink-300"/> User Base</h2>
               <div className="space-y-4">
                 <GlassCard className="p-5 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-ink-900">Citizens</h4>
                     <p className="text-xs text-ink-500">Public users reporting issues</p>
                   </div>
                   <p className="text-2xl font-bold text-info">{stats?.usersByRole?.CITIZEN || 0}</p>
                 </GlassCard>
                 <GlassCard className="p-5 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-ink-900">Field Workers</h4>
                     <p className="text-xs text-ink-500">Fixing issues on the ground</p>
                   </div>
                   <p className="text-2xl font-bold text-success">{stats?.usersByRole?.WORKER || 0}</p>
                 </GlassCard>
                 <GlassCard className="p-5 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-ink-900">Officers</h4>
                     <p className="text-xs text-ink-500">Managing triage & dispatch</p>
                   </div>
                   <p className="text-2xl font-bold text-warning">{stats?.usersByRole?.OFFICER || 0}</p>
                 </GlassCard>
                 <GlassCard className="p-5 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-ink-900">Administrators</h4>
                     <p className="text-xs text-ink-500">System oversight</p>
                   </div>
                   <p className="text-2xl font-bold text-danger">{stats?.usersByRole?.ADMIN || 0}</p>
                 </GlassCard>
               </div>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
};
