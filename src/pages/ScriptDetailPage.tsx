import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Users, Trash2, AlertTriangle, Sparkles, Skull, RotateCcw } from 'lucide-react';
import { useScriptStore } from '@/stores/scriptStore';
import { useGameStore } from '@/stores/gameStore';
import { Modal } from '@/components/ui/Modal';
import { DifficultyBadge } from '@/components/script/DifficultyBadge';
import { ScenarioCard } from '@/components/game/ScenarioCard';
import { cn } from '@/utils/cn';

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const script = useScriptStore((s) => s.getScriptById(id || ''));
  const currentGame = useGameStore((s) => s.currentGame);
  const deleteScript = useScriptStore((s) => s.deleteScript);
  const [showDelete, setShowDelete] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);

  const hasActiveGame =
    currentGame &&
    currentGame.status === 'active' &&
    currentGame.scriptId === id;

  if (!script) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[#9D99B5]">剧本不存在</p>
        <button onClick={() => navigate('/scripts')} className="mt-3 text-sm text-[#A78BFA]">返回剧本库</button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteScript(script.id);
    setShowDelete(false);
    navigate('/scripts');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => navigate('/scripts')}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5]"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <h1 className="text-xl font-bold text-[#E8E6F0] truncate flex-1">{script.title}</h1>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <DifficultyBadge difficulty={script.difficulty} />
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            script.source === 'builtin' ? 'bg-[#A78BFA]/15 text-[#A78BFA]' : 'bg-[#5EEAD4]/15 text-[#5EEAD4]'
          }`}
        >
          {script.source === 'builtin' ? '内置' : '自定义'}
        </span>
        {script.category && (
          <span className="text-[10px] text-[#6B6680]">{script.category}</span>
        )}
      </div>

      <ScenarioCard scenario={script.scenario} />

      <div className="flex flex-col gap-2">
        {hasActiveGame ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                navigate(
                  `/game/resume?scriptId=${currentGame!.scriptId}&mode=${currentGame!.mode}`
                )
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5EEAD4] to-[#34D399] text-[#0F0B1A] font-bold text-sm flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              继续游戏（{currentGame!.questionCount}问 · 进度{currentGame!.progress}%）
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModeSelect(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              <Play size={18} />
              重新开始
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModeSelect(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#A78BFA] to-[#7C3AED] text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Play size={18} />
            开始游戏
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/lobby?scriptId=${script.id}`)}
          className="w-full py-3 rounded-xl bg-[#5EEAD4]/10 text-[#5EEAD4] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#5EEAD4]/20 transition-colors"
        >
          <Users size={18} />
          创建联机房
        </motion.button>

        {script.source === 'custom' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDelete(true)}
            className="w-full py-3 rounded-xl bg-[#FB7185]/10 text-[#FB7185] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#FB7185]/20 transition-colors"
          >
            <Trash2 size={16} />
            删除剧本
          </motion.button>
        )}
      </div>

      <Modal open={showModeSelect} onClose={() => setShowModeSelect(false)} title="选择游戏模式">
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowModeSelect(false);
              navigate(`/game/new?scriptId=${script.id}&mode=easy`);
            }}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-[#A78BFA]/15 to-[#7C3AED]/10 border border-[#A78BFA]/20 text-left hover:border-[#A78BFA]/40 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-[#A78BFA]" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#E8E6F0] group-hover:text-[#A78BFA] transition-colors">简单模式</span>
              </div>
            </div>
            <p className="text-xs text-[#9D99B5] ml-[52px]">AI 回答"是/不是/无关"并附带简短解释，帮助推理</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowModeSelect(false);
              navigate(`/game/new?scriptId=${script.id}&mode=hardcore`);
            }}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-[#FB7185]/10 to-[#F472B6]/5 border border-[#FB7185]/15 text-left hover:border-[#FB7185]/30 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#FB7185]/10 flex items-center justify-center flex-shrink-0">
                <Skull size={20} className="text-[#FB7185]" />
              </div>
              <span className="text-sm font-bold text-[#E8E6F0] group-hover:text-[#FB7185] transition-colors">硬核模式</span>
              <span className="text-[10px] font-medium text-[#FB7185] bg-[#FB7185]/10 px-2 py-0.5 rounded-full ml-2">推荐</span>
            </div>
            <p className="text-xs text-[#9D99B5] ml-[52px]">AI 只回答"是"、"不是"或"无关"，不提供任何解释</p>
          </motion.button>
        </div>
      </Modal>

      <Modal open={showDelete} onClose={() => setShowDelete(false)}>
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={40} className="text-[#FB7185] mb-4" />
          <h3 className="text-lg font-bold text-[#E8E6F0] mb-2">确认删除</h3>
          <p className="text-sm text-[#9D99B5] mb-6">删除后无法恢复，是否确认删除"{script.title}"？</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setShowDelete(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#9D99B5] hover:bg-white/[0.1] transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-[#FB7185]/20 text-[#FB7185] hover:bg-[#FB7185]/30 transition-colors text-sm font-medium"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
