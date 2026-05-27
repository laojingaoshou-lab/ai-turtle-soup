import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Crown } from 'lucide-react';
import { useRoomStore } from '@/stores/roomStore';
import { useMultiplayerResumeStore } from '@/stores/multiplayerResumeStore';
import { connectSocket, leaveRoom as emitLeaveRoom, startGame } from '@/services/socket';
import { GlassPanel } from '@/components/ui/GlassPanel';

let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { room, myId, reset } = useRoomStore();
  const fromGame = (location.state as any)?.fromGame;

  useEffect(() => {
    // Cancel pending cleanup from Strict Mode double-unmount
    if (cleanupTimer !== null) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    connectSocket();

    return () => {
      // Defer leave to macrotask so Strict Mode remount can cancel it.
      // Only leave if not transitioning to the game (status !== 'playing').
      cleanupTimer = setTimeout(() => {
        const currentRoom = useRoomStore.getState().room;
        if (currentRoom?.status !== 'playing') {
          emitLeaveRoom();
          reset();
          useMultiplayerResumeStore.getState().clear();
        }
        cleanupTimer = null;
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (room?.status === 'playing' && !fromGame) {
      navigate(`/game/multiplayer/${room.code}`);
    }
  }, [room?.status, navigate, fromGame]);

  const handleLeave = () => {
    // Cancel deferred cleanup since we're handling it explicitly
    if (cleanupTimer !== null) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
    emitLeaveRoom();
    reset();
    useMultiplayerResumeStore.getState().clear();
    navigate('/lobby');
  };

  const handleStart = () => {
    startGame();
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[#9D99B5]">加载房间中...</p>
        <button onClick={() => navigate('/lobby')} className="mt-3 text-sm text-[#A78BFA]">返回大厅</button>
      </div>
    );
  }

  const isHost = myId === room.hostId;

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ x: -2 }}
          onClick={handleLeave}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5]"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-xl font-bold text-[#E8E6F0]">等待房间</h1>
      </div>

      {/* Room Code */}
      <div className="text-center mb-6">
        <p className="text-3xl font-extrabold text-[#A78BFA] tracking-[0.2em] mb-2" style={{ textShadow: '0 0 20px rgba(167,139,250,0.5)' }}>
          {room.code}
        </p>
        <p className="text-xs text-[#6B6680]">将此码分享给好友</p>
      </div>

      {/* Room Info */}
      <GlassPanel className="mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6680]">剧本</span>
            <span className="text-sm font-medium text-[#E8E6F0]">{room.scriptTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6680]">主持模式</span>
            <span className="text-sm font-medium text-[#E8E6F0]">
              {room.hostMode === 'ai' ? 'AI 主持' : '玩家主持'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6680]">玩家</span>
            <span className="text-sm font-medium text-[#E8E6F0]">{room.players.length}/{room.maxPlayers}</span>
          </div>
        </div>
        {room.scenario && (
          <p className="text-xs text-[#6B6680] mt-3 line-clamp-2">{room.scenario}</p>
        )}
      </GlassPanel>

      {/* Player List */}
      <div className="space-y-2 mb-6">
        <h3 className="text-xs font-bold text-[#9D99B5] tracking-wider uppercase">玩家列表</h3>
        {room.players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-3 glass rounded-xl p-3"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-[#E8E6F0] flex-1">
              {player.name}
              {player.id === myId && <span className="text-[10px] text-[#6B6680] ml-1">(你)</span>}
            </span>
            {player.isHost && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-0.5 rounded-full">
                <Crown size={10} />
                房主
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Start Button */}
      {isHost && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={room.players.length < 2}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <Play size={18} />
          开始游戏
        </motion.button>
      )}

      {!isHost && (
        <p className="text-center text-xs text-[#6B6680]">等待房主开始游戏...</p>
      )}
    </div>
  );
}
