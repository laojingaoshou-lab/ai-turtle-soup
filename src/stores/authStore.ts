import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginApi, registerApi, getMe } from '@/services/userApi';

async function syncCloudToLocal() {
  const [{ getRecords, getScripts }, { useGameStore }, { useScriptStore }] = await Promise.all([
    import('@/services/userApi'),
    import('@/stores/gameStore'),
    import('@/stores/scriptStore'),
  ]);

  const [recordsRes, scriptsRes] = await Promise.all([
    getRecords().catch(() => ({ records: [] as any[] })),
    getScripts().catch(() => ({ scripts: [] as any[] })),
  ]);

  if (recordsRes.records.length > 0) {
    const existing = useGameStore.getState().gameHistory;
    const existingIds = new Set(existing.map((r: any) => r.id));
    const newRecords = recordsRes.records.filter((r: any) => !existingIds.has(r.id));
    if (newRecords.length > 0) {
      useGameStore.setState({ gameHistory: [...newRecords, ...existing].slice(0, 50) });
    }
  }

  if (scriptsRes.scripts.length > 0) {
    const existing = useScriptStore.getState().customScripts;
    const existingIds = new Set(existing.map((s: any) => s.id));
    const newScripts = scriptsRes.scripts.filter((s: any) => !existingIds.has(s.id));
    if (newScripts.length > 0) {
      useScriptStore.setState({ customScripts: [...newScripts, ...existing] });
    }
  }
}

interface AuthStore {
  user: { id: number; username: string } | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (username, password) => {
        const { token, user } = await loginApi(username, password);
        set({ token, user, isAuthenticated: true });
        syncCloudToLocal().catch(() => {});
      },

      register: async (username, password) => {
        const { token, user } = await registerApi(username, password);
        set({ token, user, isAuthenticated: true });
        syncCloudToLocal().catch(() => {});
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          set({ isLoading: true });
          const { user } = await getMe(token);
          set({ user, isAuthenticated: true, isLoading: false });
          syncCloudToLocal().catch(() => {});
        } catch {
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
      },

      syncFromCloud: async () => {
        await syncCloudToLocal();
      },
    }),
    {
      name: '@haigui/auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
