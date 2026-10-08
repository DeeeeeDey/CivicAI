import os

files = {
    "src/store/locationStore.ts": """import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationState {
  label: string;
  lat: number;
  lng: number;
  city: string;
  wardId?: string;
  radiusKm: number;
  source: 'gps' | 'search' | 'city';
}

interface LocationStore extends LocationState {
  setLocation: (loc: Partial<LocationState>) => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      label: 'Salt Lake, Kolkata',
      lat: 22.5726,
      lng: 88.3639,
      city: 'Kolkata',
      radiusKm: 5,
      source: 'city',
      setLocation: (loc) => set((state) => ({ ...state, ...loc })),
    }),
    { name: 'civicai-location' }
  )
);
""",

    "src/components/LocationPill.tsx": """import { useState } from 'react';
import { useLocationStore } from '../store/locationStore';
import { MapPin, ChevronDown, Crosshair, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export const LocationPill = () => {
  const { label, setLocation, radiusKm } = useLocationStore();
  const [open, setOpen] = useState(false);

  const handleGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current Location',
          source: 'gps'
        });
        setOpen(false);
      }, () => alert('Location denied or unavailable.'));
    }
  };

  const cities = [
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/50 border border-border hover:bg-surface transition-colors text-sm font-medium text-ink-900"
      >
        <MapPin size={16} className="text-accent" />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown size={14} className="text-ink-500" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 md:left-0 md:right-auto w-80 z-50 origin-top-right md:origin-top-left"
          >
            <GlassCard className="p-4 shadow-2xl flex flex-col gap-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={16} />
                 <Input placeholder="Search address..." className="pl-9 bg-surface text-sm h-10" />
              </div>
              
              <button onClick={handleGPS} className="flex items-center gap-2 text-sm font-semibold text-accent hover:bg-accent/10 p-2 rounded-lg transition-colors">
                 <Crosshair size={16} /> Use my current location
              </button>

              <div>
                <p className="text-xs font-bold text-ink-300 uppercase mb-2">Quick Cities</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => {
                        setLocation({ lat: c.lat, lng: c.lng, city: c.name, label: c.name, source: 'city' });
                        setOpen(false);
                      }}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-surface border border-border hover:border-accent text-ink-700"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                 <div className="flex justify-between text-xs font-bold text-ink-500 uppercase mb-2">
                    <span>Search Radius</span>
                    <span>{radiusKm} km</span>
                 </div>
                 <input 
                   type="range" min="1" max="25" value={radiusKm} 
                   onChange={(e) => setLocation({ radiusKm: parseInt(e.target.value) })}
                   className="w-full accent-accent"
                 />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
"""
}

for path, content in files.items():
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Location store and pill generated.")
