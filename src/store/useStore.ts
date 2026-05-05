import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  wallet_balance?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setAuth: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    loading: true,
    setLoading: (loading) => set({ loading }),
    setAuth: (user) => set({ user, loading: false }),
  })
);
