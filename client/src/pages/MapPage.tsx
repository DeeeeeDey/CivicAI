import { useState, useEffect } from 'react';
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
import { Search, MapPin, Navigation, Crosshair } from 'lucide-react';

const createIcon = (severity: number) => {
  const colors = {
    1: '#7FA37C', 2: '#B7C177', 3: '#E0B84F', 4: '#D98B48', 5: '#C05A44'
  };
  const color = colors[severity as keyof typeof colors] || colors[3];
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
};

export const MapPage = () => {
  const { lat, lng } = useLocationStore();
  const { theme } = useTheme();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        // We use the full API URL just in case, or relative if proxied
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiUrl}/complaints/public/map?lat=${lat}&lng=${lng}&radiusKm=10`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map(item => ({
             ...item,
             id: item.publicId || item.id,
             lat: item.latitude,
             lng: item.longitude,
             title: item.title || item.description || "Civic Issue"
          }));
          setComplaints(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch complaints for map:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, [lat, lng]);

  // Using standard OpenStreetMap to completely bypass all API key requirements
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="h-[calc(100vh-80px)] mt-[80px] relative flex overflow-hidden">
      
      {/* Left Panel */}
      <div className="hidden md:flex w-96 flex-col bg-surface z-10 border-r border-border shadow-2xl relative">
        <div className="p-6 border-b border-border">
           <h2 className="text-2xl font-bold text-ink-900 mb-4">Issue Map</h2>
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={16} />
              <input type="text" placeholder="Search address or ID..." className="w-full pl-9 pr-4 py-2 bg-bg-base border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Badge className="bg-ink-900 text-white border-transparent cursor-pointer whitespace-nowrap">All Issues</Badge>
              <Badge className="bg-surface border-border text-ink-500 cursor-pointer whitespace-nowrap">High Severity</Badge>
              <Badge className="bg-surface border-border text-ink-500 cursor-pointer whitespace-nowrap">Unresolved</Badge>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {complaints.map(c => (
              <GlassCard key={c.id} interactive className="p-4 cursor-pointer hover:border-accent">
                 <div className="flex justify-between items-start mb-2">
                    <Badge color={c.severity >= 4 ? 'danger' : 'warning'}>Sev {c.severity}</Badge>
                    <span className="text-[10px] font-bold text-ink-300 uppercase">{c.id}</span>
                 </div>
                 <h4 className="font-bold text-ink-900">{c.title}</h4>
                 <p className="text-xs text-ink-500 mt-1">Reported 2 days ago</p>
              </GlassCard>
           ))}
        </div>

        <div className="p-4 border-t border-border">
           <Link to="/citizen/report">
              <Button className="w-full text-sm py-3"><MapPin size={16} className="mr-2"/> Report issue here</Button>
           </Link>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className={theme === 'dark' ? 'map-tiles-dark' : ''}>
          <TileLayer url={tileUrl} />
          <MapController center={[lat, lng]} />
          
          {/* User Location Marker */}
          <Marker position={[lat, lng]} icon={L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: var(--accent); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(194,104,58,0.8);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          })} />

          <MarkerClusterGroup chunkedLoading>
            {complaints.map(c => (
               <Marker key={c.id} position={[c.lat, c.lng]} icon={createIcon(c.severity)}>
                  <Popup className="custom-popup">
                     <div className="p-1">
                        <div className="flex gap-2 items-center mb-2">
                          <Badge color={c.severity >= 4 ? 'danger' : 'warning'}>Sev {c.severity}</Badge>
                          <span className="text-[10px] font-bold text-gray-400">{c.id}</span>
                        </div>
                        <h4 className="font-bold text-sm mb-3">{c.title}</h4>
                        <Link to={`/track/${c.id}`} className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
                           Track this complaint <Navigation size={12} />
                        </Link>
                     </div>
                  </Popup>
               </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Floating Mobile Search/Filter (Simplified) */}
        <div className="md:hidden absolute top-4 left-4 right-4 z-[400] glass p-3 rounded-2xl flex gap-3 shadow-xl">
           <Search className="text-ink-300" size={20} />
           <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none flex-1 text-sm text-ink-900 font-medium" />
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-3">
           <button className="w-12 h-12 bg-surface rounded-full shadow-xl flex items-center justify-center text-ink-900 hover:bg-surface-glass border border-border">
              <Crosshair size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};
