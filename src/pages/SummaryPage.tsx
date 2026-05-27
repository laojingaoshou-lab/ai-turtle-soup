import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Hash, Clock, RotateCcw, Home } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useScriptStore } from '@/stores/scriptStore';
import { useRoomStore } from '@/stores/roomStore';
import { TruthReveal } from '@/components/game/TruthReveal';

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameHistory = useGameStore((s) => s.gameHistory);
  const currentGame = useGameStore((s) => s.currentGame);
  const getRandomScript = useScriptStore((s) => s.getRandomScript);
  const roomGameResult = useRoomStore((s) => s.room?.gameResult);

  // Determine source: single player game or multiplayer game
  const isMultiplayer = id?.startsWith('multi-');
  const multiResult = roomGameResult;

  let record;
  let truth = '';

  if (isMultiplayer && multiResult) {
    record = {
      id: id || '',
      questionCount: multiResult.questionCount,
      startedAt: Date.now(),
      result: multiResult.result as 'solved' | 'gave_up',
    };
    truth = multiResult.truth;
  } else if (currentGame && currentGame.id === id) {
    record = {
      id: currentGame.id,
      questionCount: currentGame.questionCount,
      startedAt: currentGame.startedAt,
      endedAt: currentGame.endedAt,
      result: currentGame.result,
    };
    truth = currentGame.truth;
  } else {
    const found = gameHistory.find((g) => g.id === id);
    if (found) {
      record = { ...found };
    }
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[#9D99B5]">记录不存在</p>
        <button onClick={() => navigate('/home')} className="mt-3 text-sm text-[#A78BFA]">返回首页</button>
      </div>
    );
  }

  const isSolved = record.result === 'solved';
  const duration = record.endedAt
    ? Math.floor((record.endedAt - record.startedAt) / 1000)
    : 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const handleRandom = () => {
    const script = getRandomScript();
    if (script) navigate(`/script/${script.id}`);
  };

  return (
    <div className="max-w-md mx-auto flex flex-col items-center text-center pt-8">
      {/* Result Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6"
      >
        {isSolved ? (
          <CheckCircle
            size={80}
            className="text-[#5EEAD4]"
            style={{ filter: 'drop-shadow(0 0 20px rgba(94, 234, 212, 0.4))' }}
          />
        ) : (
          <XCircle
            size={80}
            className="text-[#F472B6]"
            style={{ filter: 'drop-shadow(0 0 20px rgba(244, 114, 182, 0.4))' }}
          />
        )}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-2xl font-extrabold mb-6 ${isSolved ? 'text-[#5EEAD4]' : 'text-[#F472B6]'}`}
      >
        {isSolved ? '恭喜解谜！' : '已放弃'}
      </motion.h1>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 w-full mb-6"
      >
        <div className="flex justify-around">
          <div className="text-center">
            <Hash size={20} className="text-[#A78BFA] mx-auto mb-1" />
            <p className="text-xl font-extrabold text-[#E8E6F0]">{record.questionCount}</p>
            <p className="text-[10px] text-[#6B6680]">提问数</p>
          </div>
          <div className="text-center">
            <Clock size={20} className="text-[#5EEAD4] mx-auto mb-1" />
            <p className="text-xl font-extrabold text-[#E8E6F0]">{minutes}分{seconds}秒</p>
            <p className="text-[10px] text-[#6B6680]">用时</p>
          </div>
          <div className="text-center">
            <div
              className={`w-6 h-6 rounded-full mx-auto mb-1 ${isSolved ? 'bg-[#5EEAD4]/20' : 'bg-[#F472B6]/20'}`}
            >
              {isSolved ? (
                <CheckCircle size={20} className="text-[#5EEAD4]" />
              ) : (
                <XCircle size={20} className="text-[#F472B6]" />
              )}
            </div>
            <p className="text-xl font-extrabold text-[#E8E6F0]">{isSolved ? '成功' : '失败'}</p>
            <p className="text-[10px] text-[#6B6680]">结果</p>
          </div>
        </div>
      </motion.div>

      {/* Truth */}
      {truth && <TruthReveal truth={truth} />}

      {/* Actions */}
      <div className="flex gap-3 w-full mt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRandom}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          再来一局
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/home')}
          className="flex-1 py-3 rounded-xl bg-white/[0.06] text-[#E8E6F0] font-medium text-sm flex items-center justify-center gap-2"
        >
          <Home size={16} />
          返回首页
        </motion.button>
      </div>
    </div>
  );
}
