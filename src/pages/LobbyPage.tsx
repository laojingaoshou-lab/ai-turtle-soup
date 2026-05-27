import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, WifiOff, Plus, LogIn, BookOpen } from 'lucide-react';
import { useScriptStore } from '@/stores/scriptStore';
import { useRoomStore } from '@/stores/roomStore';
import { connectSocket, createRoom, joinRoom, disconnectSocket } from '@/services/socket';
import { cn } from '@/utils/cn';

export default function LobbyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedScriptId = searchParams.get('scriptId') || '';
  const urlPlayerName = searchParams.get('name') || '';
  const urlHostMode = (searchParams.get('host') as 'ai' | 'player') || 'ai';
  const urlGameMode = (searchParams.get('mode') as 'easy' | 'hardcore') || 'easy';

  const builtInScripts = useScriptStore((s) => s.builtInScripts);
  const serverApproved = useScriptStore((s) => s.serverApprovedScripts);
  const customScripts = useScriptStore((s) => s.customScripts);
  const allScripts = useMemo(
    () => [...builtInScripts, ...serverApproved, ...customScripts],
    [builtInScripts, serverApproved, customScripts]
  );

  const { room, isConnected, error } = useRoomStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(urlPlayerName);
  const [hostMode, setHostMode] = useState<'ai' | 'player'>(urlHostMode);
  const [gameMode, setGameMode] = useState<'easy' | 'hardcore'>(urlGameMode);
  const [selectedScriptId, setSelectedScriptId] = useState(preselectedScriptId);

  // Sync from URL when returning from script selection page
  useEffect(() => {
    if (preselectedScriptId) {
      setSelectedScriptId(preselectedScriptId);
    }
  }, [preselectedScriptId]);
  useEffect(() => {
    if (urlPlayerName) setPlayerName(urlPlayerName);
  }, [urlPlayerName]);
  useEffect(() => {
    if (urlHostMode) setHostMode(urlHostMode);
  }, [urlHostMode]);
  useEffect(() => {
    if (urlGameMode) setGameMode(urlGameMode);
  }, [urlGameMode]);

  const [roomCode, setRoomCode] = useState('');

  // Build URL params to carry lobby state to scripts page and back
  const lobbyParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('select', '1');
    if (playerName.trim()) p.set('name', playerName.trim());
    if (hostMode !== 'ai') p.set('host', hostMode);
    if (gameMode !== 'easy') p.set('mode', gameMode);
    return p.toString();
  }, [playerName, hostMode, gameMode]);

  const selectedScript = useMemo(
    () => allScripts.find((s) => s.id === selectedScriptId),
    [allScripts, selectedScriptId]
  );

  useEffect(() => {
    connectSocket();
  }, []);

  useEffect(() => {
    if (room) {
      navigate(`/room/${room.code}`);
    }
  }, [room, navigate]);

  const handleCreate = () => {
    if (!playerName.trim() || !selectedScript) return;

    createRoom({
      playerName: playerName.trim(),
      hostMode,
      gameMode,
      scriptId: selectedScript.id,
      scriptTitle: selectedScript.title,
      scenario: selectedScript.scenario,
      truth: selectedScript.truth,
      hints: selectedScript.hints,
    });
  };

  const handleJoin = () => {
    if (!playerName.trim() || roomCode.length < 4) return;
    joinRoom(roomCode.toUpperCase(), playerName.trim());
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => {
            disconnectSocket();
            navigate('/home');
          }}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5]"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-xl font-bold text-[#E8E6F0]">多人联机</h1>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#5EEAD4]' : 'bg-[#F472B6]'}`} />
          <span className="text-xs text-[#6B6680]">{isConnected ? '已连接' : '连接中...'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20">
          <p className="text-xs text-[#FB7185]">{error}</p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-white/[0.04] rounded-xl p-1 mb-6 relative">
        <motion.div
          layoutId="lobby-tab"
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#A78BFA]/20"
          style={{ left: tab === 'create' ? '4px' : 'calc(50% + 0px)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
        {(['create', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium rounded-lg relative z-10 transition-colors',
              tab === t ? 'text-[#A78BFA]' : 'text-[#6B6680]'
            )}
          >
            {t === 'create' ? '创建房间' : '加入房间'}
          </button>
        ))}
      </div>

      {/* Player Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">玩家名称</label>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
          placeholder="你的名字"
          maxLength={12}
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
        />
        <p className="text-[10px] text-[#6B6680] mt-1 text-right">{playerName.length}/12</p>
      </div>

      {tab === 'create' ? (
        <>
          {/* Host Mode */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">主持模式</label>
            <div className="flex gap-2">
              {(['ai', 'player'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHostMode(mode)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    hostMode === mode
                      ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30'
                      : 'bg-white/[0.04] text-[#6B6680] border border-white/[0.06]'
                  )}
                >
                  {mode === 'ai' ? 'AI 主持' : '玩家主持'}
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">游戏难度</label>
            <div className="flex gap-2">
              {(['easy', 'hardcore'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setGameMode(mode)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    gameMode === mode
                      ? mode === 'easy'
                        ? 'bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30'
                        : 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30'
                      : 'bg-white/[0.04] text-[#6B6680] border border-white/[0.06]'
                  )}
                >
                  {mode === 'easy' ? '简单模式' : '硬核模式'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#6B6680] mt-1">
              {gameMode === 'hardcore' ? 'AI 仅回答"是""不是"或"无关"，不提供解释' : 'AI 会给出简短解释'}
            </p>
          </div>

          {/* Script Select */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">选择剧本</label>
            {selectedScript ? (
              <div className="p-3 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#E8E6F0]">{selectedScript.title}</span>
                    <span className="text-[10px] ml-2 text-[#6B6680]">
                      {selectedScript.difficulty === 'easy' ? '简单' : selectedScript.difficulty === 'medium' ? '中等' : '困难'}
                      {selectedScript.category && ` · ${selectedScript.category}`}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/scripts?${lobbyParams}`)}
                    className="text-xs text-[#A78BFA] hover:text-[#C4B5FD] transition-colors"
                  >
                    更换
                  </button>
                </div>
                <p className="text-xs text-[#6B6680] mt-1 line-clamp-1">{selectedScript.scenario}</p>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/scripts?${lobbyParams}`)}
                className="w-full p-4 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.1] flex flex-col items-center gap-2 hover:border-[#A78BFA]/30 hover:bg-white/[0.06] transition-colors"
              >
                <BookOpen size={24} className="text-[#6B6680]" />
                <span className="text-sm text-[#9D99B5]">点击浏览剧本库选择</span>
              </motion.button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={!isConnected || !playerName.trim() || !selectedScriptId}
            onClick={handleCreate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            <Plus size={18} />
            创建房间
          </motion.button>
        </>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">房间码</label>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.slice(0, 6).toUpperCase())}
              placeholder="输入6位房间码"
              maxLength={6}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-lg font-mono tracking-[0.3em] text-center text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 uppercase"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={!isConnected || !playerName.trim() || roomCode.length < 4}
            onClick={handleJoin}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5EEAD4] to-[#A78BFA] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            <LogIn size={18} />
            加入房间
          </motion.button>
        </>
      )}
    </div>
  );
}
