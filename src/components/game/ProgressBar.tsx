import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  const colorClass =
    clamped >= 80 ? 'bg-gradient-to-r from-[#5EEAD4] to-[#34D399]' :
    clamped >= 50 ? 'bg-gradient-to-r from-[#FBBF24] to-[#F59E0B]' :
    'bg-gradient-to-r from-[#6B6680] to-[#9D99B5]';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-1.5', className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#6B6680] tracking-wider">推理进度</span>
        <span className={cn(
          'text-xs font-bold tabular-nums',
          clamped >= 80 ? 'text-[#5EEAD4]' :
          clamped >= 50 ? 'text-[#FBBF24]' :
          'text-[#9D99B5]'
        )}>
          {clamped}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </motion.div>
  );
}
