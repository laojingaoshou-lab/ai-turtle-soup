import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GameRecord, ChatMessage } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface GameStore {
  currentGame: GameState | null;
  gameHistory: GameRecord[];
  isLoading: boolean;
  startGame: (scriptId: string, scriptTitle: string, scenario: string, truth: string, hints: string[], mode?: 'easy' | 'hardcore') => void;  sendQuestion: (question: string) => void;
  receiveAnswer: (content: string, answerType: ChatMessage['answerType'], progress?: number) => void;
  requestHint: () => string | null;
  markSolved: () => void;
  giveUp: () => void;
  resetGame: () => void;
  setError: (error: string) => void;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentGame: null,
      gameHistory: [],
      isLoading: false,

      startGame: (scriptId, scriptTitle, scenario, truth, hints, mode = 'easy') => {
        const isHardcore = mode === 'hardcore';
        const game: GameState = {
          id: genId(),
          scriptId,
          scriptTitle,
          scenario,
          truth,
          mode,
          status: 'active',
          messages: [{
            id: genId(),
            role: 'assistant',
            content: isHardcore
              ? `欢迎来到 AI主持人海龟汤（硬核模式）！\n\n**汤面：** ${scenario}\n\n在硬核模式下，AI 只会回答"是"、"不是"或"无关"，不会有任何解释。请开始提问。`
              : `欢迎来到 AI主持人海龟汤！\n\n**汤面：** ${scenario}\n\n请开始提问，我是 AI 主持人，会回答"是"、"不是"或"无关"。你可以随时请求提示。`,
            timestamp: Date.now(),
            answerType: 'welcome',
          }],
          questionCount: 0,
          hintCount: hints.length,
          hints,
          hintIndex: 0,
          progress: 0,
          startedAt: Date.now(),
        };
        set({ currentGame: game });
      },

      sendQuestion: (question) => {
        const { currentGame } = get();
        if (!currentGame || currentGame.status !== 'active') return;

        const userMsg: ChatMessage = {
          id: genId(),
          role: 'user',
          content: question,
          timestamp: Date.now(),
        };

        set({
          currentGame: {
            ...currentGame,
            messages: [...currentGame.messages, userMsg],
            questionCount: currentGame.questionCount + 1,
          },
          isLoading: true,
        });
      },

      receiveAnswer: (content, answerType, progress) => {
        const { currentGame } = get();
        if (!currentGame) return;

        const aiMsg: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
          answerType,
        };

        set({
          currentGame: {
            ...currentGame,
            messages: [...currentGame.messages, aiMsg],
            progress: progress !== undefined ? Math.max(currentGame.progress, progress) : currentGame.progress,
          },
          isLoading: false,
        });
      },

      requestHint: () => {
        const { currentGame } = get();
        if (!currentGame || currentGame.status !== 'active' || currentGame.hintIndex >= currentGame.hints.length) {
          return null;
        }

        const hint = currentGame.hints[currentGame.hintIndex];
        const hintMsg: ChatMessage = {
          id: genId(),
          role: 'system',
          content: `提示 ${currentGame.hintIndex + 1}/${currentGame.hints.length}：${hint}`,
          timestamp: Date.now(),
          answerType: 'hint',
        };

        set({
          currentGame: {
            ...currentGame,
            messages: [...currentGame.messages, hintMsg],
            hintIndex: currentGame.hintIndex + 1,
          },
        });

        return hint;
      },

      markSolved: () => {
        const { currentGame, gameHistory } = get();
        if (!currentGame) return;

        const solvedMsg: ChatMessage = {
          id: genId(),
          role: 'system',
          content: `恭喜解谜！\n\n**汤底：** ${currentGame.truth}`,
          timestamp: Date.now(),
          answerType: 'correct',
        };

        const endedAt = Date.now();
        const record: GameRecord = {
          id: currentGame.id,
          scriptId: currentGame.scriptId,
          scriptTitle: currentGame.scriptTitle,
          status: 'solved',
          questionCount: currentGame.questionCount,
          startedAt: currentGame.startedAt,
          endedAt,
          result: 'solved',
        };

        set({
          currentGame: {
            ...currentGame,
            status: 'solved',
            messages: [...currentGame.messages, solvedMsg],
            endedAt,
            result: 'solved',
          },
          gameHistory: [record, ...gameHistory].slice(0, 50),
        });

        // Sync to server if logged in
        if (useAuthStore.getState().isAuthenticated) {
          import('@/services/userApi').then(({ saveRecord }) => {
            saveRecord(record).catch(() => {});
          });
        }
      },

      giveUp: () => {
        const { currentGame, gameHistory } = get();
        if (!currentGame) return;

        const giveUpMsg: ChatMessage = {
          id: genId(),
          role: 'system',
          content: `你选择了放弃。\n\n**汤底：** ${currentGame.truth}`,
          timestamp: Date.now(),
          answerType: 'error',
        };

        const endedAt = Date.now();
        const record: GameRecord = {
          id: currentGame.id,
          scriptId: currentGame.scriptId,
          scriptTitle: currentGame.scriptTitle,
          status: 'gave_up',
          questionCount: currentGame.questionCount,
          startedAt: currentGame.startedAt,
          endedAt,
          result: 'gave_up',
        };

        set({
          currentGame: {
            ...currentGame,
            status: 'gave_up',
            messages: [...currentGame.messages, giveUpMsg],
            endedAt,
            result: 'gave_up',
          },
          gameHistory: [record, ...gameHistory].slice(0, 50),
        });

        // Sync to server if logged in
        if (useAuthStore.getState().isAuthenticated) {
          import('@/services/userApi').then(({ saveRecord }) => {
            saveRecord(record).catch(() => {});
          });
        }
      },

      resetGame: () => {
        set({ currentGame: null, isLoading: false });
      },

      setError: (error) => {
        const { currentGame } = get();
        if (!currentGame) return;
        set({
          currentGame: { ...currentGame, status: 'error', error },
          isLoading: false,
        });
      },
    }),
    {
      name: '@haigui/game',
      partialize: (state) => ({
        currentGame: state.currentGame,
        gameHistory: state.gameHistory.slice(0, 50),
      }),
    }
  )
);
