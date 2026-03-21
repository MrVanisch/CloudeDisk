import { create } from 'zustand';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    plan_id: number | null;
    current_storage_used: number;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    checkAuth: () => Promise<void>;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!Cookies.get('access_token'),
    isLoading: true,
    error: null,

    checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = Cookies.get('access_token');
            if (!token) {
                set({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }

            const response = await api.get('/auth/me');
            set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            console.error('Check auth failed:', error);
            Cookies.remove('access_token');
            set({ user: null, isAuthenticated: false, isLoading: false, error: 'Session expired' });
        }
    },

    login: async (token: string) => {
        Cookies.set('access_token', token, { expires: 7 }); // 7 days
        set({ isAuthenticated: true });
        // Immediately fetch user details after successful login
        const response = await api.get('/auth/me');
        set({ user: response.data });
    },

    logout: () => {
        Cookies.remove('access_token');
        set({ user: null, isAuthenticated: false });
    },
}));
