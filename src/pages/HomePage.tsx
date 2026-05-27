import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, TrendingUp, Hash, Play, ChevronRight, Dices, Users, RotateCcw } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { useGameStore } from '@/stores/gameStore';
import { useScriptStore } from '@/stores/scriptStore';
import { useMultiplayerResumeStore } from '@/stores/multiplayerResumeStore';

export default function HomePage() {
  const navigate = useNavigate();
  const currentGame = useGameStore((s) => s.currentGame);
  const gameHistory = useGameStore((s) => s.gameHistory);
  const getRandomScript = useScriptStore((s) => s.getRandomScript);
  const mpRoomCode = useMultiplayerResumeStore((s) => s.roomCode);
  const mpPlayerName = useMultiplayerResumeStore((s) => s.playerName);

  const totalGames = gameHistory.length;
  const solvedCount = gameHistory.filter((g) => g.result === 'solved').length;
  const solveRate = totalGames > 0 ? Math.round((solvedCount / totalGames) * 100) : 0;
  const totalQuestions = gameHistory.reduce((sum, g) => sum + g.questionCount, 0);
  const recentGames = gameHistory.slice(0, 20);
  const hasActiveGame = currentGame && currentGame.status === 'active';
  const hasActiveMultiplayer = !!mpRoomCode;

  const handleRandom = () => {
    const script = getRandomScript();
    if (script) navigate(`/script/${script.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-full">
      {/* Hero */}
      <div className="text-center pt-8 pb-6">
        <h1 className="text-2xl font-extrabold text-[#A78BFA] tracking-[0.15em] animate-title-glow">
          AI主持人海龟汤
        </h1>
        <p className="text-xs text-[#6B6680] tracking-[0.35em] mt-2">
          AI 主持 · 情境推理谜题
        </p>
      </div>

      {/* Resume active game */}
      {hasActiveGame && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/game/resume?scriptId=${currentGame!.scriptId}&mode=${currentGame!.mode}`)}
          className="w-full mb-3 p-4 rounded-2xl bg-gradient-to-r from-[#5EEAD4]/15 to-[#A78BFA]/10 border border-[#5EEAD4]/25 flex items-center gap-4 hover:shadow-[0_0_20px_rgba(94,234,212,0.15)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-full bg-[#5EEAD4]/15 flex items-center justify-center flex-shrink-0">
            <RotateCcw size={22} className="text-[#5EEAD4]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-[#E8E6F0]">继续游戏</p>
            <p className="text-xs text-[#9D99B5] truncate">
              {currentGame!.scriptTitle}
              <span className="mx-1.5">·</span>
              {currentGame!.questionCount}问
              <span className="mx-1.5">·</span>
              进度 {currentGame!.progress}%
            </p>
          </div>
          <ChevronRight size={20} className="text-[#5EEAD4] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </motion.button>
      )}

      {/* Resume active multiplayer game */}
      {hasActiveMultiplayer && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/game/multiplayer/${mpRoomCode}`)}
          className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-[#A78BFA]/15 to-[#5EEAD4]/10 border border-[#A78BFA]/25 flex items-center gap-4 hover:shadow-[0_0_20px_rgba(167,139,250,0.15)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-full bg-[#A78BFA]/15 flex items-center justify-center flex-shrink-0">
            <Users size={22} className="text-[#A78BFA]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-[#E8E6F0]">继续联机</p>
            <p className="text-xs text-[#9D99B5] truncate">
              房间 {mpRoomCode}
              {mpPlayerName && <><span className="mx-1.5">·</span>{mpPlayerName}</>}
            </p>
          </div>
          <ChevronRight size={20} className="text-[#A78BFA] group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </motion.button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Gamepad2, value: totalGames, label: '总局数', color: '#A78BFA' },
          { icon: TrendingUp, value: `${solveRate}%`, label: '解谜率', color: '#5EEAD4' },
          { icon: Hash, value: totalQuestions, label: '总提问', color: '#FBBF24' },
        ].map((stat, i) => (
          <GlassPanel key={stat.label} delay={i * 0.06}>
            <div className="flex flex-col items-center text-center gap-1">
              <stat.icon size={22} style={{ color: stat.color }} />
              <span className="text-xl font-extrabold text-[#E8E6F0]">{stat.value}</span>
              <span className="text-[10px] text-[#6B6680]">{stat.label}</span>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Main Actions */}
      <div className="space-y-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/scripts')}
          className="w-full glass p-4 rounded-2xl bg-gradient-to-r from-[#A78BFA]/20 to-transparent flex items-center gap-4 hover:shadow-[0_0_20px_rgba(167,139,250,0.2)] transition-shadow group"
        >
          <div className="w-12 h-12 rounded-full bg-[#A78BFA]/20 flex items-center justify-center flex-shrink-0">
            <Play size={22} className="text-[#A78BFA]" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-[#E8E6F0]">立即开始</p>
            <p className="text-xs text-[#6B6680] truncate">从剧本库中选择，由 AI 主持推理</p>
          </div>
          <ChevronRight size={20} className="text-[#6B6680] group-hover:text-[#A78BFA] transition-colors flex-shrink-0" />
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRandom}
            className="glass p-4 rounded-2xl bg-gradient-to-br from-[#A78BFA]/15 to-transparent flex flex-col items-center gap-2"
          >
            <Dices size={24} className="text-[#A78BFA]" />
            <span className="text-sm font-bold text-[#E8E6F0]">随机开局</span>
            <span className="text-[10px] text-[#6B6680]">随机挑选剧本</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/lobby')}
            className="glass p-4 rounded-2xl bg-gradient-to-br from-[#5EEAD4]/15 to-transparent flex flex-col items-center gap-2"
          >
            <Users size={24} className="text-[#5EEAD4]" />
            <span className="text-sm font-bold text-[#E8E6F0]">多人联机</span>
            <span className="text-[10px] text-[#6B6680]">和朋友一起玩</span>
          </motion.button>
        </div>
      </div>

      {/* Recent Games */}
      <div className="flex-1">
        <h2 className="text-sm font-bold text-[#9D99B5] tracking-wider uppercase mb-3">最近游戏</h2>
        {recentGames.length === 0 ? (
          <EmptyState
            icon={Gamepad2}
            title="尚未开始游戏"
            description={'点击上方"立即开始"来玩第一局'}
          />
        ) : (
          <div className="space-y-2">
            {recentGames.map((record) => (
              <motion.button
                key={record.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate(`/script/${record.scriptId}`)}
                className="glass rounded-xl p-3 flex items-center gap-3 w-full text-left hover:border-white/[0.12] transition-colors"
              >
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${record.result === 'solved' ? 'bg-[#5EEAD4]' : 'bg-[#F472B6]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#E8E6F0] truncate">{record.scriptTitle}</p>
                  <p className="text-[10px] text-[#6B6680]">
                    {new Date(record.startedAt).toLocaleDateString('zh-CN')} · {record.questionCount}问
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    record.result === 'solved'
                      ? 'bg-[#5EEAD4]/15 text-[#5EEAD4]'
                      : 'bg-[#F472B6]/15 text-[#F472B6]'
                  }`}
                >
                  {record.result === 'solved' ? '解谜成功' : '已放弃'}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
