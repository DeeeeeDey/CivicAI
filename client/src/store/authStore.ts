import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  role: 'CITIZEN' | 'OFFICER' | 'WORKER' | 'ADMIN';
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setInitializing: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  login: (user, token) => set({ user, accessToken: token }),
  logout: () => set({ user: null, accessToken: null }),
  setToken: (token) => set({ accessToken: token }),
  setInitializing: (val) => set({ isInitializing: val })
}));
