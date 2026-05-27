import { create } from 'zustand';
import type { RoomState, PlayerInfo, ChatMessage } from '@/types';

interface RoomStore {
  room: RoomState | null;
  isConnected: boolean;
  myId: string | null;
  error: string | null;
  setConnected: (connected: boolean) => void;
  setMyId: (id: string | null) => void;
  setRoom: (room: RoomState) => void;
  updatePlayers: (players: PlayerInfo[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setPendingQuestion: (pq: { questionId: string; playerName: string; question: string } | null) => void;
  setGameResult: (result: { result: string; questionCount: number; truth: string } | null) => void;
  setStatus: (status: RoomState['status']) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>()((set) => ({
  room: null,
  isConnected: false,
  myId: null,
  error: null,

  setConnected: (connected) => set({ isConnected: connected }),
  setMyId: (id) => set({ myId: id }),
  setRoom: (room) => set({ room, error: null }),
  updatePlayers: (players) => set((s) => s.room ? { room: { ...s.room, players } } : {}),
  addMessage: (msg) => set((s) => s.room ? { room: { ...s.room, messages: [...s.room.messages, msg] } } : {}),
  setMessages: (messages) => set((s) => s.room ? { room: { ...s.room, messages } } : {}),
  setPendingQuestion: (pq) => set((s) => s.room ? { room: { ...s.room, pendingQuestion: pq } } : {}),
  setGameResult: (result) => set((s) => s.room ? { room: { ...s.room, gameResult: result } } : {}),
  setStatus: (status) => set((s) => s.room ? { room: { ...s.room, status } } : {}),
  setProgress: (progress) => set((s) => s.room ? { room: { ...s.room, progress } } : {}),
  setError: (error) => set({ error }),
  reset: () => set({ room: null, isConnected: false, myId: null, error: null }),
}));
