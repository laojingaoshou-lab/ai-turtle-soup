import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Script } from '@/types';
import { DifficultyBadge } from './DifficultyBadge';

interface ScriptCardProps {
  script: Script;
  index?: number;
  onSelect?: (script: Script) => void;
}

export function ScriptCard({ script, index = 0, onSelect }: ScriptCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect ? onSelect(script) : navigate(`/script/${script.id}`)}
      className="glass rounded-xl p-4 text-left w-full hover:border-white/[0.12] transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-1 self-stretch rounded-full flex-shrink-0 ${
            script.source === 'builtin' ? 'bg-[#A78BFA]' : 'bg-[#5EEAD4]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <DifficultyBadge difficulty={script.difficulty} />
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                script.source === 'builtin'
                  ? 'bg-[#A78BFA]/15 text-[#A78BFA]'
                  : 'bg-[#5EEAD4]/15 text-[#5EEAD4]'
              }`}
            >
              {script.source === 'builtin' ? '内置' : '自定义'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#E8E6F0] truncate group-hover:text-[#A78BFA] transition-colors">
            {script.title}
          </h3>
          <p className="text-xs text-[#6B6680] mt-1 truncate">
            {script.category || '未分类'}
            {script.author && ` · ${script.author}`}
          </p>
        </div>
      </div>
    </motion.button>
  );
}
