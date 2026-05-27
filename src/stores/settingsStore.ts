import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';
import { getProviderById } from '@/data/providers';

interface SettingsStore {
  settings: AppSettings;
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (v: boolean) => void;
  setProvider: (providerId: string) => void;
  setApiBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setTemperature: (t: number) => void;
  setCustomPrompt: (prompt: string) => void;
}

const defaults: AppSettings = {
  provider: 'deepseek',
  apiBaseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-v4-flash',
  temperature: 0.3,
  customPrompt: '',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaults,
      hasSeenWelcome: false,
      setHasSeenWelcome: (v) => set({ hasSeenWelcome: v }),

      setProvider: (providerId) => {
        const preset = getProviderById(providerId);
        if (preset && providerId !== 'custom') {
          set({
            settings: {
              provider: providerId,
              apiBaseUrl: preset.apiBaseUrl,
              model: preset.defaultModel,
              apiKey: useSettingsStore.getState().settings.apiKey,
              temperature: useSettingsStore.getState().settings.temperature,
              customPrompt: useSettingsStore.getState().settings.customPrompt,
            },
          });
        } else {
          set((s) => ({ settings: { ...s.settings, provider: 'custom' } }));
        }
      },

      setApiBaseUrl: (url) => set((s) => ({ settings: { ...s.settings, apiBaseUrl: url } })),
      setApiKey: (key) => set((s) => ({ settings: { ...s.settings, apiKey: key } })),
      setModel: (model) => set((s) => ({ settings: { ...s.settings, model } })),
      setTemperature: (t) => set((s) => ({ settings: { ...s.settings, temperature: t } })),
      setCustomPrompt: (prompt) => set((s) => ({ settings: { ...s.settings, customPrompt: prompt } })),
    }),
    {
      name: '@haigui/settings',
    }
  )
);
