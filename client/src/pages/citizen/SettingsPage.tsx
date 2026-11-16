import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';
import { User, Bell, MapPin, Shield, CheckCircle, Mail, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CitizenSettingsPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { label } = useLocationStore();
  const navigate = useNavigate();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Account Settings</h1>
        <p className="text-ink-500">Manage your profile, notification preferences, and default municipality ward.</p>
      </div>

      {savedToast && (
        <div className="p-4 bg-success/15 border border-success/30 rounded-xl text-success font-semibold text-sm flex items-center gap-2">
          <CheckCircle size={18} /> Preferences saved successfully.
        </div>
      )}

      {/* Profile Overview */}
      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-accent/20">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">{user?.name || 'Citizen'}</h2>
            <p className="text-sm text-ink-500">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge color="accent">Verified Resident</Badge>
              <Badge color="info">Role: {user?.role || 'CITIZEN'}</Badge>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
          <div>
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Account ID</span>
            <p className="font-mono text-ink-800 text-xs mt-1 truncate">{user?.id}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Default Municipal Ward</span>
            <p className="text-ink-800 font-medium flex items-center gap-1.5 mt-1">
              <MapPin size={14} className="text-accent" /> {label || 'Metropolitan Ward'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="text-accent" size={20} />
          <h3 className="text-lg font-bold text-ink-900">Dispatch & Resolution Alerts</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <div>
              <p className="font-semibold text-sm text-ink-900">Email Status Notifications</p>
              <p className="text-xs text-ink-500">Receive verified repair notices and triage updates via email.</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <div>
              <p className="font-semibold text-sm text-ink-900">Critical Public Safety Broadcasts</p>
              <p className="text-xs text-ink-500">Urgent municipal announcements for water shutoffs or storm advisories.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="p-6 border-danger/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-danger text-sm">Session Management</h3>
          <p className="text-xs text-ink-500">Sign out of your citizen account on this device.</p>
        </div>
        <Button variant="danger" onClick={handleLogout} className="flex items-center gap-2 self-start sm:self-auto">
          <LogOut size={16} /> Sign Out
        </Button>
      </GlassCard>
    </div>
  );
};
