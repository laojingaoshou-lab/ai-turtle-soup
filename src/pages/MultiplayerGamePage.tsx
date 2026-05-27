import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Circle, Sparkles, Skull, Trophy } from 'lucide-react';
import { useRoomStore } from '@/stores/roomStore';
import { useMultiplayerResumeStore } from '@/stores/multiplayerResumeStore';
import { connectSocket, rejoinRoom, sendQuestion, hostAnswer, requestHint, giveUp, solveGame, leaveRoom } from '@/services/socket';
import { GameHeader } from '@/components/game/GameHeader';
import { ScenarioCard } from '@/components/game/ScenarioCard';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { GiveUpDialog } from '@/components/game/GiveUpDialog';
import { TruthReveal } from '@/components/game/TruthReveal';
import { cn } from '@/utils/cn';
import { ProgressBar } from '@/components/game/ProgressBar';

export default function MultiplayerGamePage() {
  const navigate = useNavigate();
  const { room, myId, error } = useRoomStore();
  const setActive = useMultiplayerResumeStore((s) => s.setActive);
  const clearResume = useMultiplayerResumeStore((s) => s.clear);
  const resumeCode = useMultiplayerResumeStore((s) => s.roomCode);
  const resumeName = useMultiplayerResumeStore((s) => s.playerName);
  const [showGiveUp, setShowGiveUp] = useState(false);
  const [rejoining, setRejoining] = useState(false);
  const [hostNote, setHostNote] = useState('');

  const myName = useMemo(
    () => room?.players.find((p) => p.id === myId)?.name || resumeName || '',
    [room, myId, resumeName]
  );

  useEffect(() => {
    if (room) return; // Already in a room

    // Try to rejoin from persisted state
    if (resumeCode && resumeName && !rejoining) {
      setRejoining(true);
      const socket = connectSocket();
      if (socket.connected) {
        rejoinRoom(resumeCode, resumeName);
      } else {
        socket.once('connect', () => {
          rejoinRoom(resumeCode, resumeName);
        });
      }
      return;
    }

    // No room and no resume data — go to lobby
    if (!resumeCode) {
      navigate('/lobby');
    }
  }, [room, resumeCode, resumeName, rejoining, navigate]);

  // Navigate to lobby if rejoin fails with an error
  useEffect(() => {
    if (error && rejoining) {
      clearResume();
      navigate('/lobby');
    }
  }, [error, rejoining, clearResume, navigate]);

  // Persist multiplayer game for resume
  useEffect(() => {
    if (room && room.status === 'playing' && myName) {
      setActive(room.code, myName);
    }
    if (room && (room.status === 'ended' || room.gameResult)) {
      clearResume();
    }
  }, [room?.status, room?.code, myName, room?.gameResult]);

  useEffect(() => {
    if (room?.gameResult) {
      const timer = setTimeout(() => {
        navigate(`/summary/multi-${room.code}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [room?.gameResult, navigate]);

  if (!room) return null;

  const isHost = myId === room.hostId;
  const isPlayerHost = room.hostMode === 'player';
  const isPlaying = room.status === 'playing';
  const isEnded = room.status === 'ended';

  const handleGiveUp = () => {
    giveUp();
    setShowGiveUp(false);
  };

  const handleBack = () => {
    navigate(`/room/${room.code}`, { state: { fromGame: true } });
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    useRoomStore.getState().reset();
    clearResume();
    navigate('/home');
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-full">
      <GameHeader
        title={room.scriptTitle}
        questionCount={room.questionCount}
        status={room.status}
        onBack={handleBack}
      />

      {/* Player chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {room.players.map((p) => (
          <span
            key={p.id}
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-white/[0.06] text-[#9D99B5]"
          >
            {p.isHost ? <Crown size={10} className="text-[#FBBF24]" /> : <Circle size={6} className={cn('fill-current', p.id === myId ? 'text-[#5EEAD4]' : 'text-[#6B6680]')} />}
            {p.name}
            {p.id === myId && <span className="text-[#6B6680]">(你)</span>}
          </span>
        ))}
      </div>

      {/* Mode badge + Leave button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {room.gameMode === 'hardcore' ? (
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
        <button
          onClick={handleLeaveRoom}
          className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/15 hover:bg-[#FB7185]/20 transition-colors"
        >
          离开房间
        </button>
      </div>

      {isPlaying && <ProgressBar progress={room.progress} className="mb-3" />}

      <ScenarioCard scenario={room.scenario} />

      <MessageList messages={room.messages} />

      {isEnded && room.gameResult && (
        <div className="mt-3">
          <TruthReveal truth={room.gameResult.truth} />
        </div>
      )}

      {isPlaying && (
        <div className="mt-3 space-y-3">
          {/* Player Host Answering Panel */}
          {isPlayerHost && isHost && room.pendingQuestion ? (
            <div className="glass rounded-xl p-4 border-l-2 border-l-[#A78BFA]">
              <p className="text-[10px] text-[#6B6680] mb-1">
                {room.pendingQuestion.playerName} 提问：
              </p>
              <p className="text-sm text-[#E8E6F0] mb-3">{room.pendingQuestion.question}</p>
              {room.gameMode !== 'hardcore' && (
                <textarea
                  value={hostNote}
                  onChange={(e) => setHostNote(e.target.value)}
                  placeholder="输入解释（可选）..."
                  rows={2}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 resize-none mb-3"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />
              )}
              <div className="flex gap-2">
                {[
                  { label: '是', type: '是', color: '#5EEAD4' },
                  { label: '不是', type: '不是', color: '#F472B6' },
                  { label: '无关', type: '无关', color: '#FBBF24' },
                ].map((opt) => {
                  const makeContent = () => {
                    const note = hostNote.trim();
                    return room.gameMode !== 'hardcore' && note
                      ? `${opt.label} — ${note}`
                      : opt.label;
                  };
                  return (
                    <button
                      key={opt.type}
                      onClick={() => {
                        hostAnswer(room.pendingQuestion!.questionId, makeContent(), opt.type);
                        setHostNote('');
                      }}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: `${opt.color}15`,
                        color: opt.color,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isPlayerHost && isHost ? (
            <div className="text-center py-3">
              <p className="text-xs text-[#6B6680]">等待玩家提问...</p>
            </div>
          ) : (
            <ChatInput
              onSend={sendQuestion}
              onGiveUp={() => setShowGiveUp(true)}
              placeholder="输入你的问题..."
            />
          )}

          {/* 通关 button: all players when progress >= 80 */}
          {room.progress >= 80 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => solveGame()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5EEAD4] to-[#34D399] text-[#0F0B1A] font-bold text-sm flex items-center justify-center gap-2"
            >
              <Trophy size={18} />
              通关 - 我已知晓真相
            </motion.button>
          )}

          {/* Hint button: all players in AI mode, non-hosts in player-host mode */}
          {(room.hostMode === 'ai' || !isHost) && (
            <button
              onClick={requestHint}
              className="w-full py-2 rounded-xl bg-[#FBBF24]/10 text-[#FBBF24] text-xs font-medium hover:bg-[#FBBF24]/20 transition-colors"
            >
              请求提示
            </button>
          )}
        </div>
      )}

      <GiveUpDialog
        open={showGiveUp}
        onClose={() => setShowGiveUp(false)}
        onConfirm={handleGiveUp}
      />
    </div>
  );
}
