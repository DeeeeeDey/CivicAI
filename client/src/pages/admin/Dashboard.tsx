import { useAdminUsers } from '../../hooks/queries';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Shield, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';

export const AdminDashboard = () => {
  const { data: users, isLoading } = useAdminUsers();

  const totalUsers = users?.length || 0;
  const officers = users?.filter((u: any) => u.role === 'OFFICER').length || 0;
  const workers = users?.filter((u: any) => u.role === 'WORKER').length || 0;
  const citizens = users?.filter((u: any) => u.role === 'CITIZEN').length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-ink-900 flex items-center gap-3">
              <Shield className="text-accent" size={32} /> System Admin
            </h1>
            <p className="text-ink-500">Manage users, roles, and global platform settings.</p>
         </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6"><div className="h-32 bg-white/40 rounded-[24px]"></div></div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-12">
          
          {/* STATS */}
          <div className="grid md:grid-cols-4 gap-6">
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Total Users</h3>
              <p className="text-4xl font-serif text-ink-900">{totalUsers}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Citizens</h3>
              <p className="text-4xl font-serif text-info">{citizens}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Officers</h3>
              <p className="text-4xl font-serif text-warning">{officers}</p>
            </GlassCard>
            <GlassCard interactive variants={scrollReveal}>
              <h3 className="text-ink-300 text-[11px] font-bold uppercase tracking-widest mb-2">Field Workers</h3>
              <p className="text-4xl font-serif text-success">{workers}</p>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </div>

            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><Settings size={20} className="text-ink-300"/> Quick Actions</h2>
               <div className="space-y-4">
                 <GlassCard interactive className="p-5 flex items-center justify-between cursor-pointer group">
                   <div>
                     <h4 className="font-bold text-ink-900 group-hover:text-accent transition-colors">Invite Officer</h4>
                     <p className="text-xs text-ink-500">Send an email invite to a new officer</p>
                   </div>
                 </GlassCard>
                 <GlassCard interactive className="p-5 flex items-center justify-between cursor-pointer group">
                   <div>
                     <h4 className="font-bold text-ink-900 group-hover:text-accent transition-colors">Manage Departments</h4>
                     <p className="text-xs text-ink-500">Add or edit city departments</p>
                   </div>
                 </GlassCard>
                 <GlassCard interactive className="p-5 flex items-center justify-between cursor-pointer group">
                   <div>
                     <h4 className="font-bold text-ink-900 group-hover:text-accent transition-colors">System Health</h4>
                     <p className="text-xs text-ink-500">View API and Database metrics</p>
                   </div>
                 </GlassCard>
               </div>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
};
