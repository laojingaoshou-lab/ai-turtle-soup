import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { useScriptStore } from '@/stores/scriptStore';
import { ScriptList } from '@/components/script/ScriptList';
import type { Script } from '@/types';
import { cn } from '@/utils/cn';

const DIFFICULTIES = [
  { key: 'easy', label: '简单', activeClass: 'bg-[#5EEAD4]/20 text-[#5EEAD4]' },
  { key: 'medium', label: '中等', activeClass: 'bg-[#FBBF24]/20 text-[#FBBF24]' },
  { key: 'hard', label: '困难', activeClass: 'bg-[#F472B6]/20 text-[#F472B6]' },
] as const;

export default function ScriptsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSelectMode = searchParams.get('select') === '1';
  // Carry lobby form state back when returning from select mode
  const lobbyName = searchParams.get('name') || '';
  const lobbyHost = searchParams.get('host') || '';
  const lobbyMode = searchParams.get('mode') || '';
  const builtInScripts = useScriptStore((s) => s.builtInScripts);
  const serverApproved = useScriptStore((s) => s.serverApprovedScripts);
  const customScripts = useScriptStore((s) => s.customScripts);
  const [category, setCategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const allBuiltIn = useMemo(() => [...builtInScripts, ...serverApproved], [builtInScripts, serverApproved]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of allBuiltIn) { if (s.category) set.add(s.category); }
    for (const s of customScripts) { if (s.category) set.add(s.category); }
    return Array.from(set).sort();
  }, [allBuiltIn, customScripts]);

  const filter = (scripts: typeof builtInScripts) =>
    scripts.filter((s) => {
      if (category && s.category !== category) return false;
      if (difficulty && s.difficulty !== difficulty) return false;
      return true;
    });

  const filteredBuiltIn = filter(allBuiltIn);
  const filteredCustom = filter(customScripts);

  const handleSelect = (script: Script) => {
    const p = new URLSearchParams();
    p.set('scriptId', script.id);
    if (lobbyName) p.set('name', lobbyName);
    if (lobbyHost) p.set('host', lobbyHost);
    if (lobbyMode) p.set('mode', lobbyMode);
    navigate(`/lobby?${p.toString()}`);
  };

  // Build return URL that preserves lobby form state
  const lobbyReturnUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (lobbyName) p.set('name', lobbyName);
    if (lobbyHost) p.set('host', lobbyHost);
    if (lobbyMode) p.set('mode', lobbyMode);
    const qs = p.toString();
    return qs ? `/lobby?${qs}` : '/lobby';
  }, [lobbyName, lobbyHost, lobbyMode]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isSelectMode && (
            <motion.button
              whileHover={{ x: -2 }}
              onClick={() => navigate(lobbyReturnUrl)}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5]"
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}
          <h1 className="text-xl font-bold text-[#E8E6F0]">
            {isSelectMode ? '选择剧本' : '剧本库'}
          </h1>
          {!isSelectMode && (
            <span className="text-xs font-medium bg-[#A78BFA]/15 text-[#A78BFA] px-2 py-0.5 rounded-full">
              {filteredBuiltIn.length + filteredCustom.length}
            </span>
          )}
        </div>
        {isSelectMode ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(lobbyReturnUrl)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.06] text-[#9D99B5] hover:bg-white/[0.1] transition-colors text-sm font-medium"
          >
            取消
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/script/import')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A78BFA]/15 text-[#A78BFA] hover:bg-[#A78BFA]/25 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            导入
          </motion.button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            !category
              ? 'bg-[#A78BFA]/20 text-[#A78BFA]'
              : 'bg-white/[0.04] text-[#9D99B5] hover:bg-white/[0.08]'
          )}
        >
          全部分类
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              category === c
                ? 'bg-[#A78BFA]/20 text-[#A78BFA]'
                : 'bg-white/[0.04] text-[#9D99B5] hover:bg-white/[0.08]'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Difficulty filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setDifficulty(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            !difficulty
              ? 'bg-white/[0.08] text-[#E8E6F0]'
              : 'bg-white/[0.04] text-[#9D99B5] hover:bg-white/[0.08]'
          )}
        >
          全部难度
        </button>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => setDifficulty(d.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              difficulty === d.key
                ? d.activeClass
                : 'bg-white/[0.04] text-[#9D99B5] hover:bg-white/[0.08]'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <ScriptList
        scripts={filteredBuiltIn}
        title="内置剧本"
        emptyText="暂无匹配剧本"
        onSelect={isSelectMode ? handleSelect : undefined}
      />
      <ScriptList
        scripts={filteredCustom}
        title="自定义剧本"
        emptyText="暂无匹配剧本，可以麻烦上传云端吗？"
        onSelect={isSelectMode ? handleSelect : undefined}
      />
    </div>
  );
}
