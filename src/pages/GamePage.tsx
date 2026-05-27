import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Lightbulb, Sparkles, Skull, Trophy } from 'lucide-react';
import { useGame } from '@/hooks/useGame';
import { useScriptStore } from '@/stores/scriptStore';
import { GameHeader } from '@/components/game/GameHeader';
import { ScenarioCard } from '@/components/game/ScenarioCard';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { GiveUpDialog } from '@/components/game/GiveUpDialog';
import { TruthReveal } from '@/components/game/TruthReveal';
import { cn } from '@/utils/cn';
import { ProgressBar } from '@/components/game/ProgressBar';

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const { id: routeAction } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const scriptId = searchParams.get('scriptId') || '';
  const mode = (searchParams.get('mode') as 'easy' | 'hardcore') || 'easy';
  const isResume = routeAction === 'resume';
  const { currentGame, isLoading, start, ask, hint, solve, quit, reset } = useGame();
  const getScriptById = useScriptStore((s) => s.getScriptById);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scriptId) return;

    // Resume: only skip starting if explicitly resuming and game matches
    if (
      isResume &&
      currentGame &&
      currentGame.status === 'active' &&
      currentGame.scriptId === scriptId &&
      currentGame.mode === mode
    ) {
      startedRef.current = `${scriptId}-${mode}`;
      return;
    }

    // Start a new game (or resume failed — fall through)
    const key = `${scriptId}-${mode}`;
    if (startedRef.current !== key) {
      startedRef.current = key;
      start(scriptId, mode);
    }
  }, [scriptId, mode, isResume, currentGame]);

  useEffect(() => {
    if (currentGame && (currentGame.status === 'solved' || currentGame.status === 'gave_up')) {
      const timer = setTimeout(() => {
        navigate(`/summary/${currentGame.id}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentGame?.status]);

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[#9D99B5]">加载中...</p>
      </div>
    );
  }

  const isActive = currentGame.status === 'active';
  const hintsTotal = currentGame.hints.length;
  const hintsUsed = currentGame.hintIndex;
  const hintsRemaining = hintsTotal - hintsUsed;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      <GameHeader
        title={currentGame.scriptTitle}
        questionCount={currentGame.questionCount}
        status={currentGame.status}
      />

      {/* Mode badge */}
      <div className="flex items-center gap-2 mb-3">
        {currentGame.mode === 'hardcore' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/20">
            <Skull size={11} />
            硬核模式
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/20">
            <Sparkles size={11} />
            简单模式
          </span>
        )}
      </div>

      {isActive && <ProgressBar progress={currentGame.progress} className="mb-3" />}

      <ScenarioCard scenario={currentGame.scenario} />

      <MessageList messages={currentGame.messages} isLoading={isLoading} />

      {/* Hint buttons */}
      {currentGame.status === 'solved' || currentGame.status === 'gave_up' ? (
        <div className="mt-3">
          <TruthReveal truth={currentGame.truth} />
        </div>
      ) : null}

      {isActive && (
        <div className="mt-3 space-y-2">
          {/* Hint bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={hint}
              disabled={hintsRemaining <= 0}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                hintsRemaining > 0
                  ? 'bg-[#FBBF24]/10 text-[#FBBF24] hover:bg-[#FBBF24]/20'
                  : 'bg-white/[0.04] text-[#6B6680] cursor-not-allowed'
              )}
            >
              <Lightbulb size={14} />
              提示（{hintsRemaining}/{hintsTotal}）
            </button>
            <div className="flex gap-1">
              {Array.from({ length: hintsTotal }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    i < hintsUsed ? 'bg-[#FBBF24]' : 'bg-white/[0.1]'
                  )}
                />
              ))}
            </div>
          </div>

          <ChatInput
            onSend={ask}
            onGiveUp={() => setShowGiveUp(true)}
            disabled={isLoading || !isActive}
            placeholder="输入你的问题（是/否问题）..."
          />

          {currentGame.progress >= 80 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={solve}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5EEAD4] to-[#34D399] text-[#0F0B1A] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              <Trophy size={18} />
              通关 - 我已知晓真相
            </motion.button>
          )}
        </div>
      )}

      {currentGame.status === 'error' && (
        <div className="mt-3 p-3 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20">
          <p className="text-xs text-[#FB7185]">{currentGame.error}</p>
        </div>
      )}

      <GiveUpDialog
        open={showGiveUp}
        onClose={() => setShowGiveUp(false)}
        onConfirm={() => {
          setShowGiveUp(false);
          quit();
        }}
      />
    </div>
  );
}
