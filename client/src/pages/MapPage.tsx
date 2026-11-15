import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocationStore } from '../store/locationStore';
import { useTheme } from '../theme/ThemeProvider';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Search, MapPin, Navigation, Crosshair, X, Filter, AlertCircle, Layers } from 'lucide-react';
import { api } from '../api/axios';

const createIcon = (severity: number, isSelected = false) => {
  const colors: Record<number, string> = {
    1: '#10b981', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444'
  };
  const color = colors[severity] || '#eab308';
  const size = isSelected ? 32 : 24;
  const pulse = isSelected ? '<div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid ' + color + '; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : '';

  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${pulse}
        <div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: ${isSelected ? '12px' : '10px'}; font-weight: bold;">
          ${severity}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const MapController = ({ center, zoom = 13 }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

export const MapPage = () => {
  const { lat: userLat, lng: userLng, setCoords } = useLocationStore();
  const { theme } = useTheme();

  const [mapCenter, setMapCenter] = useState<[number, number]>([userLat || 22.5726, userLng || 88.3639]);
  const [mapZoom, setMapZoom] = useState(13);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH_SEV' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const markerRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        let data: any[] = [];
        try {
          const res = await api.get(`/complaints/public/map?lat=${userLat}&lng=${userLng}&radiusKm=50`);
          data = res.data;
        } catch (e) {
          console.warn('Proximity map query failed, querying all public pins:', e);
        }

        if (!Array.isArray(data) || data.length === 0) {
          const resAll = await api.get('/complaints/public/map');
          data = resAll.data;
        }

        if (Array.isArray(data)) {
          const mapped = data
            .filter(item => item.latitude && item.longitude)
            .map(item => ({
              ...item,
              id: item.publicId || item.id,
              lat: Number(item.latitude),
              lng: Number(item.longitude),
              title: item.title || item.description || 'Civic Infrastructure Incident',
              categoryName: item.category?.name || 'General',
              createdAt: item.createdAt || new Date().toISOString()
            }));
          setComplaints(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch complaints for map:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [userLat, userLng]);

  // Handle address geocoding search
  const handleAddressSearch = async (query: string) => {
    if (!query.trim()) return;
    setGeocoding(true);
    setSearchNotice(null);

    // First check if query matches an existing complaint in memory
    const directMatch = complaints.find(
      c => c.id.toLowerCase() === query.trim().toLowerCase()
    );

    if (directMatch) {
      setSelectedId(directMatch.id);
      setMapCenter([directMatch.lat, directMatch.lng]);
      setMapZoom(16);
      setGeocoding(false);
      setSearchNotice(`Found complaint #${directMatch.id}`);
      return;
    }

    // Otherwise, perform OpenStreetMap Nominatim geocoding lookup
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const first = results[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);
        setMapCenter([newLat, newLng]);
        setMapZoom(14);
        setSearchNotice(`Centered on ${first.display_name.split(',').slice(0, 2).join(',')}`);
      } else {
        setSearchNotice('No location or ticket found matching query.');
      }
    } catch (e) {
      console.error('Geocoding error:', e);
      setSearchNotice('Could not reach geocoding service.');
    } finally {
      setGeocoding(false);
    }
  };

  // Filter complaints based on search query and category filters
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // 1. Text filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.id?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.categoryName?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Status / Severity Filter
      if (activeFilter === 'HIGH_SEV') {
        return c.severity >= 4;
      }
      if (activeFilter === 'ACTIVE') {
        return c.status === 'REPORTED' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS';
      }
      if (activeFilter === 'RESOLVED') {
        return c.status === 'RESOLVED' || c.status === 'VERIFIED';
      }
      return true;
    });
  }, [complaints, searchQuery, activeFilter]);

  const selectComplaint = (c: any) => {
    setSelectedId(c.id);
    setMapCenter([c.lat, c.lng]);
    setMapZoom(16);
    // Open marker popup if available
    const marker = markerRefs.current[c.id];
    if (marker) {
      marker.openPopup();
    }
  };

  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCoords(pos.coords.latitude, pos.coords.longitude);
          setMapCenter(userCoords);
          setMapZoom(14);
          setSearchNotice('Centered to your current GPS position');
        },
        () => {
          setMapCenter([userLat || 22.5726, userLng || 88.3639]);
          setMapZoom(14);
        }
      );
    }
  };

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="h-[calc(100vh-80px)] mt-[80px] relative flex overflow-hidden">
      {/* Left Sidebar Panel */}
      <div className="hidden md:flex w-[400px] flex-col bg-surface z-10 border-r border-border shadow-2xl relative">
        {/* Search & Filters */}
        <div className="p-5 border-b border-border space-y-3 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
              <MapPin className="text-accent" size={24} /> Issue Map
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {filteredComplaints.length} issues
            </span>
          </div>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddressSearch(searchQuery);
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchNotice(null);
              }}
              placeholder="Search by ID, keyword, or address..."
              className="w-full pl-9 pr-9 py-2.5 bg-bg-base border border-border rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchNotice(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-900"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {searchNotice && (
            <p className="text-xs text-accent font-medium flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle size={12} /> {searchNotice}
            </p>
          )}

          {/* Filter Badges */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-ink-900 text-white shadow-sm'
                  : 'bg-surface border border-border text-ink-600 hover:text-ink-900'
              }`}
            >
              All Issues ({complaints.length})
            </button>
            <button
              onClick={() => setActiveFilter('HIGH_SEV')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'HIGH_SEV'
                  ? 'bg-danger text-white shadow-sm'
                  : 'bg-surface border border-border text-ink-600 hover:text-ink-900'
              }`}
            >
              High Severity (4-5)
            </button>
            <button
              onClick={() => setActiveFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'ACTIVE'
                  ? 'bg-warning text-white shadow-sm'
                  : 'bg-surface border border-border text-ink-600 hover:text-ink-900'
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeFilter === 'RESOLVED'
                  ? 'bg-success text-white shadow-sm'
                  : 'bg-surface border border-border text-ink-600 hover:text-ink-900'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Complaints Scroll List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 p-2 animate-pulse">
              <div className="h-28 bg-surface-glass rounded-xl"></div>
              <div className="h-28 bg-surface-glass rounded-xl"></div>
              <div className="h-28 bg-surface-glass rounded-xl"></div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-12 px-4 text-ink-500">
              <AlertCircle size={32} className="mx-auto text-ink-400 mb-2" />
              <p className="font-semibold text-ink-900">No issues found</p>
              <p className="text-xs text-ink-500 mt-1">Try clearing filters or searching another area.</p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredComplaints.map(c => {
              const isSelected = selectedId === c.id;
              return (
                <GlassCard
                  key={c.id}
                  interactive
                  onClick={() => selectComplaint(c)}
                  className={`p-3.5 cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
                      : 'hover:border-accent/40'
                  }`}
                >
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      className="w-full h-28 object-cover rounded-xl mb-2.5 shadow-sm"
                    />
                  )}
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge color={c.severity >= 4 ? 'danger' : c.severity === 3 ? 'warning' : 'success'}>
                        Sev {c.severity}/5
                      </Badge>
                      <Badge color={c.status === 'RESOLVED' || c.status === 'VERIFIED' ? 'success' : 'default'}>
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-ink-400 uppercase">
                      #{c.id}
                    </span>
                  </div>

                  <h4 className="font-bold text-ink-900 text-sm line-clamp-1">{c.title}</h4>
                  <p className="text-xs text-ink-500 line-clamp-1 mt-0.5">{c.address || c.categoryName}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[11px] text-ink-400">
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    <Link
                      to={`/track/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent font-semibold hover:underline flex items-center gap-1"
                    >
                      Track <Navigation size={10} />
                    </Link>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>

        {/* Footer Report Action */}
        <div className="p-4 border-t border-border bg-surface">
          <Link to="/citizen/report">
            <Button className="w-full text-sm py-2.5 flex items-center justify-center gap-2">
              <MapPin size={16} /> Report issue at this location
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className={theme === 'dark' ? 'map-tiles-dark' : ''}
        >
          <TileLayer url={tileUrl} />
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* User Location Marker */}
          {userLat && userLng && (
            <Marker
              position={[userLat, userLng]}
              icon={L.divIcon({
                className: 'custom-icon',
                html: `<div style="background-color: var(--accent); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(194,104,58,0.8);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              })}
            >
              <Popup>
                <div className="p-1 text-xs font-semibold">Your Location</div>
              </Popup>
            </Marker>
          )}

          {/* Incident Markers */}
          <MarkerClusterGroup chunkedLoading>
            {filteredComplaints.map(c => {
              const isSelected = selectedId === c.id;
              return (
                <Marker
                  key={c.id}
                  position={[c.lat, c.lng]}
                  icon={createIcon(c.severity, isSelected)}
                  ref={(ref) => {
                    if (ref) markerRefs.current[c.id] = ref;
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedId(c.id);
                    }
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[220px]">
                      {c.imageUrl && (
                        <img
                          src={c.imageUrl}
                          alt={c.title}
                          className="w-full h-28 object-cover rounded-lg mb-2 shadow-sm"
                        />
                      )}
                      <div className="flex gap-1.5 items-center mb-1.5 flex-wrap">
                        <Badge color={c.severity >= 4 ? 'danger' : 'warning'}>Sev {c.severity}/5</Badge>
                        <Badge color={c.status === 'RESOLVED' || c.status === 'VERIFIED' ? 'success' : 'default'}>
                          {c.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-[10px] font-mono font-bold text-gray-400">#{c.id}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1 text-ink-900">{c.title}</h4>
                      <p className="text-xs text-ink-500 mb-3">{c.address || c.categoryName}</p>
                      <Link
                        to={`/track/${c.id}`}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        Open full tracking report <Navigation size={12} />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Floating Mobile Search Box */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-[400] glass p-2.5 rounded-2xl flex items-center gap-2 shadow-xl border border-white/20">
          <Search className="text-ink-400 shrink-0" size={18} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddressSearch(searchQuery);
            }}
            className="flex-1"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, address, issue..."
              className="bg-transparent border-none outline-none w-full text-sm text-ink-900 font-medium placeholder:text-ink-400"
            />
          </form>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ink-400 p-1">
              <X size={16} />
            </button>
          )}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-accent text-white"
          >
            List ({filteredComplaints.length})
          </button>
        </div>

        {/* Mobile Bottom Drawer for complaints list */}
        {mobileDrawerOpen && (
          <div className="md:hidden absolute inset-x-0 bottom-0 top-24 z-[500] bg-surface rounded-t-3xl shadow-2xl flex flex-col p-4 border-t border-border animate-slideUp">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-bold text-ink-900">Incident Feed ({filteredComplaints.length})</h3>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-glass text-ink-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pt-3">
              {filteredComplaints.map(c => (
                <GlassCard
                  key={c.id}
                  onClick={() => {
                    selectComplaint(c);
                    setMobileDrawerOpen(false);
                  }}
                  className="p-3"
                >
                  <div className="flex justify-between items-start">
                    <Badge color={c.severity >= 4 ? 'danger' : 'warning'}>Sev {c.severity}/5</Badge>
                    <span className="text-xs font-mono font-bold text-ink-400">#{c.id}</span>
                  </div>
                  <h4 className="font-bold text-sm text-ink-900 mt-1">{c.title}</h4>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-3">
          <button
            onClick={handleRecenter}
            title="Recenter to my location"
            className="w-12 h-12 bg-surface rounded-full shadow-xl flex items-center justify-center text-ink-900 hover:bg-surface-glass border border-border transition-all active:scale-95"
          >
            <Crosshair size={20} className={geocoding ? 'animate-spin text-accent' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
