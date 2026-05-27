import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MultiplayerResumeState {
  roomCode: string | null;
  playerName: string | null;
  setActive: (code: string, name: string) => void;
  clear: () => void;
}

export const useMultiplayerResumeStore = create<MultiplayerResumeState>()(
  persist(
    (set) => ({
      roomCode: null,
      playerName: null,
      setActive: (code, name) => set({ roomCode: code, playerName: name }),
      clear: () => set({ roomCode: null, playerName: null }),
    }),
    { name: '@haigui/mp-resume' }
  )
);
