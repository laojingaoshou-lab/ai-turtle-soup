import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Script } from '@/types';
import { builtinScripts } from '@/data/builtinScripts';
import { fetchApprovedScripts } from '@/services/scriptApi';
import { useAuthStore } from '@/stores/authStore';

interface ScriptStore {
  builtInScripts: Script[];
  serverApprovedScripts: Script[];
  customScripts: Script[];
  isLoading: boolean;
  loadScripts: () => void;
  fetchServerScripts: () => Promise<void>;
  getScriptById: (id: string) => Script | undefined;
  getRandomScript: () => Script;
  importScript: (script: Omit<Script, 'id' | 'source' | 'createdAt' | 'playCount'>) => Script;
  deleteScript: (id: string) => void;
  incrementPlayCount: (id: string) => void;
}

function genId() {
  return 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      builtInScripts: builtinScripts,
      serverApprovedScripts: [],
      customScripts: [],
      isLoading: false,

      loadScripts: () => {
        set({ builtInScripts: builtinScripts });
      },

      fetchServerScripts: async () => {
        try {
          const scripts = await fetchApprovedScripts();
          set({ serverApprovedScripts: scripts.map((s) => ({ ...s, source: 'builtin' as const })) });
        } catch {
          // Server unreachable — keep whatever we have
        }
      },

      getScriptById: (id) => {
        const { builtInScripts, serverApprovedScripts, customScripts } = get();
        return [...builtInScripts, ...serverApprovedScripts, ...customScripts].find((s) => s.id === id);
      },

      getRandomScript: () => {
        const { builtInScripts, serverApprovedScripts, customScripts } = get();
        const all = [...builtInScripts, ...serverApprovedScripts, ...customScripts];
        return all[Math.floor(Math.random() * all.length)];
      },

      importScript: (data) => {
        const script: Script = {
          ...data,
          id: genId(),
          source: 'custom',
          createdAt: Date.now(),
          playCount: 0,
        };
        set((s) => ({ customScripts: [...s.customScripts, script] }));

        // Sync to server if logged in
        if (useAuthStore.getState().isAuthenticated) {
          import('@/services/userApi').then(({ saveScript }) => {
            saveScript(script).catch(() => {});
          });
        }

        return script;
      },

      deleteScript: (id) => {
        set((s) => ({ customScripts: s.customScripts.filter((sc) => sc.id !== id) }));

        // Sync to server if logged in
        if (useAuthStore.getState().isAuthenticated) {
          import('@/services/userApi').then(({ deleteScript: deleteScriptApi }) => {
            deleteScriptApi(id).catch(() => {});
          });
        }
      },

      incrementPlayCount: (id) => {
        set((s) => ({
          builtInScripts: s.builtInScripts.map((sc) =>
            sc.id === id ? { ...sc, playCount: sc.playCount + 1 } : sc
          ),
          serverApprovedScripts: s.serverApprovedScripts.map((sc) =>
            sc.id === id ? { ...sc, playCount: sc.playCount + 1 } : sc
          ),
          customScripts: s.customScripts.map((sc) =>
            sc.id === id ? { ...sc, playCount: sc.playCount + 1 } : sc
          ),
        }));
      },
    }),
    {
      name: '@haigui/scripts',
      partialize: (state) => ({ customScripts: state.customScripts }),
    }
  )
);
