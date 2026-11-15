import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import {
  Settings,
  Clock,
  Cpu,
  Bell,
  AlertTriangle,
  Server,
  Save,
  CheckCircle,
  Database,
  Mail,
  ShieldCheck,
  Radio
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const queryClient = useQueryClient();
  const [successToast, setSuccessToast] = useState(false);

  // Form State
  const [slaHours, setSlaHours] = useState(48);
  const [aiConfidence, setAiConfidence] = useState(75);
  const [emergency, setEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [publicTracking, setPublicTracking] = useState(true);
  const [autoEmail, setAutoEmail] = useState(true);

  const { data: serverConfig, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    }
  });

  useEffect(() => {
    if (serverConfig?.settings) {
      setSlaHours(serverConfig.settings.slaTargetHours ?? 48);
      setAiConfidence(serverConfig.settings.aiConfidenceThreshold ?? 75);
      setEmergency(Boolean(serverConfig.settings.emergencyBroadcast));
      setEmergencyMessage(serverConfig.settings.emergencyMessage || '');
      setPublicTracking(serverConfig.settings.allowPublicTracking ?? true);
      setAutoEmail(serverConfig.settings.autoEmailNotifications ?? true);
    }
  }, [serverConfig]);

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const res = await api.post('/admin/settings', updated);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3500);
    },
    onError: (err: any) => {
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      slaTargetHours: slaHours,
      aiConfidenceThreshold: aiConfidence,
      emergencyBroadcast: emergency,
      emergencyMessage,
      allowPublicTracking: publicTracking,
      autoEmailNotifications: autoEmail
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900 flex items-center gap-3">
          <Settings className="text-accent" size={32} /> Platform Settings & Controls
        </h1>
        <p className="text-ink-500 mt-1">
          Configure city response SLAs, AI triage confidence thresholds, emergency alerts, and services.
        </p>
      </div>

      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-success/15 border border-success/30 rounded-xl text-success font-semibold text-sm flex items-center gap-2"
        >
          <CheckCircle size={18} /> Platform settings saved and applied to all services successfully!
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SLA & Triage Configuration */}
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <Clock size={20} className="text-accent" /> Operations & SLA Standards
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-ink-900 mb-1.5">
                SLA Breach Threshold (Hours)
              </label>
              <p className="text-xs text-ink-500 mb-2.5">
                Tickets pending review or in-progress beyond this limit trigger SLA breach warnings.
              </p>
              <input
                type="number"
                min="1"
                max="168"
                value={slaHours}
                onChange={(e) => setSlaHours(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-border bg-surface text-ink-900 font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-900 mb-1.5">
                AI Triage Confidence: {aiConfidence}%
              </label>
              <p className="text-xs text-ink-500 mb-2.5">
                Minimum Gemini confidence score required before auto-assigning category and severity.
              </p>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={aiConfidence}
                onChange={(e) => setAiConfidence(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer mt-2"
              />
            </div>
          </div>
        </GlassCard>

        {/* Emergency Broadcast System */}
        <GlassCard className="p-6 space-y-4 border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio size={22} className={emergency ? 'text-danger animate-pulse' : 'text-warning'} />
              <div>
                <h3 className="font-bold text-ink-900">Emergency Broadcast Banner</h3>
                <p className="text-xs text-ink-500">
                  Broadcast an urgent advisory across the citizen portal and mobile tracking interface.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emergency}
                onChange={(e) => setEmergency(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-danger"></div>
            </label>
          </div>

          {emergency && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-ink-900 mb-1 uppercase">Emergency Advisory Notice</label>
              <input
                type="text"
                placeholder="e.g. Flash flood warning in Sector 5. All non-essential municipal crews dispatched."
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                className="w-full p-2.5 text-sm rounded-xl border border-warning/40 bg-surface text-ink-900 focus:outline-none focus:ring-2 focus:ring-warning"
              />
            </div>
          )}
        </GlassCard>

        {/* Feature Toggles */}
        <GlassCard className="p-6 space-y-5">
          <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <Bell size={20} className="text-accent" /> Citizen Communication & Privacy
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <p className="text-sm font-bold text-ink-900">Automated Resend Email Notifications</p>
              <p className="text-xs text-ink-500">
                Send emails to citizens when tickets change to ASSIGNED, IN_PROGRESS, or RESOLVED.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoEmail}
              onChange={(e) => setAutoEmail(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-ink-900">Unauthenticated Public Tracking</p>
              <p className="text-xs text-ink-500">
                Allow citizens to view audit timelines without logging into an account via public ticket ID.
              </p>
            </div>
            <input
              type="checkbox"
              checked={publicTracking}
              onChange={(e) => setPublicTracking(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>
        </GlassCard>

        {/* Connected Services Health */}
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <Server size={20} className="text-accent" /> Connected Services Status
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
              <span className="font-semibold text-ink-700 flex items-center gap-2">
                <Database size={15} className="text-info" /> Database
              </span>
              <Badge color="success">PostgreSQL (Supabase)</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
              <span className="font-semibold text-ink-700 flex items-center gap-2">
                <Cpu size={15} className="text-accent" /> AI Engine
              </span>
              <Badge color="success">Google Gemini 2.5</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
              <span className="font-semibold text-ink-700 flex items-center gap-2">
                <Mail size={15} className="text-warning" /> Email Service
              </span>
              <Badge color="success">Resend API</Badge>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between">
              <span className="font-semibold text-ink-700 flex items-center gap-2">
                <ShieldCheck size={15} className="text-success" /> Cloud Storage
              </span>
              <Badge color="success">Supabase Storage</Badge>
            </div>
          </div>
        </GlassCard>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saveMutation.isPending} className="px-8 py-3 flex items-center gap-2">
            <Save size={16} /> {saveMutation.isPending ? 'Saving Settings...' : 'Save Platform Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};
export default AdminSettingsPage;
