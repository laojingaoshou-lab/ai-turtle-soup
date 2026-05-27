import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  title: string;
  questionCount: number;
  status?: string;
  onBack?: () => void;
}

export function GameHeader({ title, questionCount, status, onBack }: GameHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-3">
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onBack ? onBack() : navigate(-1)}
        className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9D99B5] hover:text-[#E8E6F0] transition-colors flex-shrink-0"
      >
        <ArrowLeft size={20} />
      </motion.button>
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold text-[#E8E6F0] truncate max-w-[200px]">{title}</h1>
        <p className="text-xs text-[#6B6680]">
          {status === 'solved' ? '已解谜' : status === 'gave_up' ? '已放弃' : '进行中'}
          <span className="mx-1">·</span>
          {questionCount}问
        </p>
      </div>
    </div>
  );
}
