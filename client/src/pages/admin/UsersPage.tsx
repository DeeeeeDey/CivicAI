import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { staggerContainer } from '../../lib/motion';
import { Users, Search, Shield, UserCheck, Briefcase, UserX, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CITIZEN' | 'WORKER' | 'OFFICER' | 'ADMIN'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    }
  });

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setSuccessToast(`Updated ${userName}'s role to ${newRole}`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert('Failed to update role: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users?.filter((u: any) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      search.trim() === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

  const counts = {
    ALL: users?.length || 0,
    CITIZEN: users?.filter((u: any) => u.role === 'CITIZEN').length || 0,
    WORKER: users?.filter((u: any) => u.role === 'WORKER').length || 0,
    OFFICER: users?.filter((u: any) => u.role === 'OFFICER').length || 0,
    ADMIN: users?.filter((u: any) => u.role === 'ADMIN').length || 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <Users className="text-accent" size={32} /> User Directory & Roles
          </h1>
          <p className="text-ink-500 mt-1">
            Manage permissions, promote field workers & officers, and audit platform accounts.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-success/15 border border-success/30 rounded-xl text-success font-semibold text-sm flex items-center gap-2"
        >
          <CheckCircle size={16} /> {successToast}
        </motion.div>
      )}

      {/* Role Counts Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase">Citizens</p>
            <p className="text-2xl font-bold text-info mt-0.5">{counts.CITIZEN}</p>
          </div>
          <Users size={24} className="text-info/40" />
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase">Field Workers</p>
            <p className="text-2xl font-bold text-success mt-0.5">{counts.WORKER}</p>
          </div>
          <Briefcase size={24} className="text-success/40" />
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase">Officers</p>
            <p className="text-2xl font-bold text-warning mt-0.5">{counts.OFFICER}</p>
          </div>
          <UserCheck size={24} className="text-warning/40" />
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-400 uppercase">Admins</p>
            <p className="text-2xl font-bold text-danger mt-0.5">{counts.ADMIN}</p>
          </div>
          <Shield size={24} className="text-danger/40" />
        </GlassCard>
      </div>

      {/* Controls: Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Role Tabs */}
        <div className="flex gap-1.5 p-1 bg-surface rounded-xl border border-border w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'CITIZEN', 'WORKER', 'OFFICER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                roleFilter === r ? 'bg-accent text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              {r === 'ALL' ? `All (${counts.ALL})` : `${r.toLowerCase()}s (${counts[r]})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-surface rounded-xl"></div>
          <div className="h-16 bg-surface rounded-xl"></div>
          <div className="h-16 bg-surface rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-danger">Failed to load users.</div>
      ) : filteredUsers.length === 0 ? (
        <GlassCard className="p-12 text-center text-ink-500">
          <UserX size={36} className="mx-auto text-ink-300 mb-2" />
          <p className="font-semibold">No users matching "{search}"</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-0 overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/70 text-xs font-bold text-ink-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Current Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {filteredUsers.map((user: any) => {
                  const initials = user.name
                    ? user.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'U';
                  return (
                    <tr key={user.id} className="hover:bg-surface/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-ink-900 leading-tight">{user.name}</p>
                            <p className="text-xs text-ink-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4">
                        <p className="text-ink-700 font-medium">{user.email}</p>
                        {user.phone && <p className="text-xs text-ink-400">{user.phone}</p>}
                      </td>

                      {/* Current Role Badge */}
                      <td className="p-4">
                        <Badge
                          color={
                            user.role === 'ADMIN'
                              ? 'danger'
                              : user.role === 'OFFICER'
                              ? 'warning'
                              : user.role === 'WORKER'
                              ? 'success'
                              : 'info'
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>

                      {/* Joined Date */}
                      <td className="p-4 text-xs text-ink-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Role Switcher */}
                      <td className="p-4 pr-6 text-right">
                        <select
                          disabled={updatingId === user.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-900 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                        >
                          <option value="CITIZEN">Citizen</option>
                          <option value="WORKER">Field Worker</option>
                          <option value="OFFICER">Officer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
export default AdminUsersPage;
