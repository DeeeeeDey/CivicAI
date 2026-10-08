import { create } from 'zustand';
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
