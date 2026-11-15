import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Mail, 
  CheckCheck,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCitizenNotifications } from '../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { motion } from 'framer-motion';
import { staggerContainer, scrollReveal } from '../../lib/motion';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useCitizenNotifications();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [markingAll, setMarkingAll] = useState(false);

  const filteredNotifications = notifications.filter((item: any) => {
    if (filter === 'UNREAD') return !item.read;
    return true;
  });

  const unreadCount = notifications.filter((item: any) => !item.read).length;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post('/citizens/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['citizenNotifications'] });
    } catch (e) {
      console.error('Failed to mark all as read', e);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/citizens/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ['citizenNotifications'] });
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const getNotificationIcon = (title: string, message: string) => {
    const text = `${title} ${message}`.toLowerCase();
    if (text.includes('certified') || text.includes('verified') || text.includes('signed off')) {
      return {
        icon: <ShieldCheck className="text-emerald-500" size={20} />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
      };
    }
    if (text.includes('completed') || text.includes('repair completed') || text.includes('resolved')) {
      return {
        icon: <CheckCircle2 className="text-teal-500" size={20} />,
        bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800'
      };
    }
    if (text.includes('progress') || text.includes('worker') || text.includes('dispatched') || text.includes('assigned')) {
      return {
        icon: <Wrench className="text-amber-500" size={20} />,
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
      };
    }
    if (text.includes('review') || text.includes('triage') || text.includes('registered')) {
      return {
        icon: <Clock className="text-blue-500" size={20} />,
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
      };
    }
    if (text.includes('reopened') || text.includes('rejected')) {
      return {
        icon: <AlertTriangle className="text-rose-500" size={20} />,
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
      };
    }
    return {
      icon: <Bell className="text-accent" size={20} />,
      bg: 'bg-accent/10 border-accent/20'
    };
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Municipal Dispatches & Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-accent text-white rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-ink-500 text-sm">
            Live lifecycle notifications, worker dispatches, and certified verification sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs flex items-center gap-1.5"
            >
              <CheckCheck size={14} />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-paper-line/50 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-ink-900 text-paper shadow-sm'
              : 'text-ink-500 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          All Updates ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            filter === 'UNREAD'
              ? 'bg-ink-900 text-paper shadow-sm'
              : 'text-ink-500 hover:text-ink-900 hover:bg-white/50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/40 animate-pulse rounded-2xl border border-paper-line/40"></div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <GlassCard className="text-center py-16 px-6 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft/40 text-accent flex items-center justify-center mx-auto mb-4">
            <Mail size={26} />
          </div>
          <h3 className="text-lg font-bold text-ink-900 mb-1">
            {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-ink-500 max-w-md mx-auto mb-6">
            Whenever your submitted issues are reviewed, workers are dispatched, or repairs are certified by officers,
            you will receive instant notifications and email dispatches here.
          </p>
          <Link to="/citizen/report">
            <Button size="sm">Report a new community issue</Button>
          </Link>
        </GlassCard>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {filteredNotifications.map((item: any) => {
            const { icon, bg } = getNotificationIcon(item.title, item.message);
            const targetLink = item.link || '/citizen/complaints';

            return (
              <motion.div key={item.id} variants={scrollReveal}>
                <GlassCard
                  className={`p-4 md:p-5 transition-all hover:shadow-md border ${
                    !item.read
                      ? 'bg-white/95 dark:bg-zinc-900/90 border-accent/30 shadow-[0_2px_12px_rgba(194,104,58,0.08)]'
                      : 'bg-white/60 dark:bg-zinc-900/40 border-paper-line/50 opacity-90'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Badge Icon */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                      {icon}
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-ink-900 leading-snug">
                            {item.title}
                          </h4>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-ink-400 shrink-0">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-ink-600 dark:text-zinc-400 leading-relaxed mb-3">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-paper-line/30">
                        <Link
                          to={targetLink}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
                        >
                          View public audit & evidence <ArrowRight size={13} />
                        </Link>

                        {!item.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-[11px] text-ink-400 hover:text-ink-900 flex items-center gap-1"
                            title="Mark as read"
                          >
                            <Check size={12} /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
