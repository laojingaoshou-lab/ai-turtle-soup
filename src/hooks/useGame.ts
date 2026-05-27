import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useScriptStore } from '@/stores/scriptStore';
import { askAI, buildMessageHistory } from '@/services/aiApi';

export function useGame() {
  const { currentGame, isLoading, startGame, sendQuestion, receiveAnswer, requestHint, markSolved, giveUp, resetGame, setError } = useGameStore();
  const incrementPlayCount = useScriptStore((s) => s.incrementPlayCount);

  const start = useCallback((scriptId: string, mode: 'easy' | 'hardcore' = 'easy') => {
    const { getScriptById } = useScriptStore.getState();
    const script = getScriptById(scriptId);
    if (!script) return;
    startGame(script.id, script.title, script.scenario, script.truth, script.hints, mode);
    incrementPlayCount(scriptId);
  }, [startGame, incrementPlayCount]);

  const ask = useCallback(async (question: string) => {
    const game = useGameStore.getState().currentGame;
    if (!game || game.status !== 'active') return;

    sendQuestion(question);

    try {
      const updatedGame = useGameStore.getState().currentGame!;
      const messages = updatedGame.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }));

      const result = await askAI(question, game.scenario, game.truth, messages, game.mode);
      receiveAnswer(result.content, result.answerType, result.progress);
    } catch (err: any) {
      setError(err.message || 'AI 请求失败');
    }
  }, [sendQuestion, receiveAnswer, setError]);

  const hint = useCallback(() => {
    return requestHint();
  }, [requestHint]);

  const solve = useCallback(() => {
    markSolved();
  }, [markSolved]);

  const quit = useCallback(() => {
    giveUp();
  }, [giveUp]);

  const reset = useCallback(() => {
    resetGame();
  }, [resetGame]);

  return {
    currentGame,
    isLoading,
    start,
    ask,
    hint,
    solve,
    quit,
    reset,
  };
}
