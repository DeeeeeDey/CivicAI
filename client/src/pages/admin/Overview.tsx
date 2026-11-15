import { useState, useMemo, useEffect } from 'react';
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
  Database,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Layers,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '../../theme/ThemeProvider';

const createAdminIcon = (severity: number, status: string) => {
  const colors: Record<number, string> = {
    1: '#10b981', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444'
  };
  const color = colors[severity] || '#eab308';
  const isUrgent = severity >= 4 && status !== 'RESOLVED' && status !== 'VERIFIED';
  const pulse = isUrgent
    ? '<div style="position: absolute; inset: -5px; border-radius: 50%; border: 2px solid ' + color + '; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>'
    : '';

  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        ${pulse}
        <div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
          ${severity}
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const AdminMapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 12, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
};

export const AdminOverview = () => {
  const { theme } = useTheme();
  const [mapFilter, setMapFilter] = useState<'ALL' | 'CRITICAL' | 'UNASSIGNED' | 'IN_PROGRESS'>('ALL');
  const [expandedMap, setExpandedMap] = useState(false);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 30000 // auto-refresh every 30s
  });

  const { data: mapComplaints = [], isLoading: mapLoading } = useQuery({
    queryKey: ['adminMapComplaints'],
    queryFn: async () => {
      const res = await api.get('/complaints/public/map');
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 30000
  });

  const filteredMapPins = useMemo(() => {
    return mapComplaints.filter((c: any) => {
      if (!c.latitude || !c.longitude) return false;
      if (mapFilter === 'CRITICAL') return c.severity >= 4;
      if (mapFilter === 'UNASSIGNED') return c.status === 'REPORTED' || c.status === 'UNDER_REVIEW';
      if (mapFilter === 'IN_PROGRESS') return c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED';
      return true;
    });
  }, [mapComplaints, mapFilter]);

  const mapCenter: [number, number] = useMemo(() => {
    if (filteredMapPins.length > 0 && filteredMapPins[0].latitude && filteredMapPins[0].longitude) {
      return [Number(filteredMapPins[0].latitude), Number(filteredMapPins[0].longitude)];
    }
    return [22.5726, 88.3639];
  }, [filteredMapPins]);

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
            <span className="w-2 h-2 rounded-full bg-success animate-ping"></span> Live Operations (30s)
          </span>
          <Link to="/admin/map">
            <Button variant="outline" className="text-xs flex items-center gap-1.5">
              <MapPin size={14} className="text-accent" /> Fullscreen Map
            </Button>
          </Link>
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

        {/* ========================================================================= */}
        {/* LIVE CITY OPERATIONS MAP (NEW & FULLY INTERACTIVE) */}
        {/* ========================================================================= */}
        <GlassCard variants={scrollReveal} className="p-0 overflow-hidden shadow-2xl border-accent/20">
          <div className="p-5 border-b border-border bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  Live City Operations & Incident Map
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {filteredMapPins.length} pins
                  </span>
                </h2>
                <p className="text-xs text-ink-500">Real-time geospatial hazard pins across municipal territory</p>
              </div>
            </div>

            {/* Filter Tabs & Expand Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1.5 p-1 bg-surface-glass rounded-xl border border-border text-xs">
                <button
                  onClick={() => setMapFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    mapFilter === 'ALL' ? 'bg-accent text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  All ({mapComplaints.length})
                </button>
                <button
                  onClick={() => setMapFilter('CRITICAL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    mapFilter === 'CRITICAL' ? 'bg-danger text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  Critical (Sev 4-5)
                </button>
                <button
                  onClick={() => setMapFilter('UNASSIGNED')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    mapFilter === 'UNASSIGNED' ? 'bg-warning text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  Unassigned
                </button>
                <button
                  onClick={() => setMapFilter('IN_PROGRESS')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    mapFilter === 'IN_PROGRESS' ? 'bg-info text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  In Progress
                </button>
              </div>

              <button
                onClick={() => setExpandedMap(!expandedMap)}
                title={expandedMap ? 'Collapse map' : 'Expand map height'}
                className="p-2 rounded-xl border border-border bg-surface text-ink-600 hover:text-ink-900 transition-colors"
              >
                {expandedMap ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Leaflet Map Area */}
          <div className={`relative transition-all duration-300 ${expandedMap ? 'h-[580px]' : 'h-[380px]'}`}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              className={theme === 'dark' ? 'map-tiles-dark' : ''}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <AdminMapController center={mapCenter} />

              <MarkerClusterGroup chunkedLoading>
                {filteredMapPins.map((c: any) => {
                  const latNum = Number(c.latitude);
                  const lngNum = Number(c.longitude);
                  if (isNaN(latNum) || isNaN(lngNum)) return null;

                  return (
                    <Marker
                      key={c.id || c.publicId}
                      position={[latNum, lngNum]}
                      icon={createAdminIcon(c.severity, c.status)}
                    >
                      <Popup className="custom-popup">
                        <div className="p-1 min-w-[220px]">
                          {c.imageUrl && (
                            <img
                              src={c.imageUrl}
                              alt="Issue photo"
                              className="w-full h-24 object-cover rounded-lg mb-2 shadow-sm"
                            />
                          )}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <Badge color={c.severity >= 4 ? 'danger' : 'warning'}>Sev {c.severity}/5</Badge>
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
                            <span className="text-[10px] font-mono font-bold text-ink-400 uppercase">
                              #{c.publicId || c.id}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-ink-900 mb-1">
                            {c.description || c.title || 'Civic Issue'}
                          </h4>
                          <p className="text-[11px] text-ink-500 mb-2">
                            {c.address || c.category?.name || 'General Municipal Issue'}
                          </p>

                          <div className="pt-2 border-t border-border flex items-center justify-between">
                            <Link
                              to={`/track/${c.publicId || c.id}`}
                              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                            >
                              Inspect Ticket <Navigation size={10} />
                            </Link>
                            <Link
                              to="/admin/complaints"
                              className="text-xs text-ink-400 hover:text-ink-900"
                            >
                              Queue &rarr;
                            </Link>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>

            {/* Map Legend Floating Overlay */}
            <div className="absolute bottom-3 left-3 z-[400] glass px-3 py-2 rounded-xl text-[11px] flex items-center gap-3 border border-white/20 shadow-md">
              <span className="font-bold text-ink-700">Severity:</span>
              <span className="flex items-center gap-1 text-danger font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-danger"></span> 4-5 Critical
              </span>
              <span className="flex items-center gap-1 text-warning font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-warning"></span> 3 Moderate
              </span>
              <span className="flex items-center gap-1 text-success font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-success"></span> 1-2 Low
              </span>
            </div>
          </div>
        </GlassCard>

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
