import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

interface TruthRevealProps {
  truth: string;
}

export function TruthReveal({ truth }: TruthRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-strong rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-[#FBBF24]" />
        <span className="text-sm font-bold text-[#FBBF24] tracking-wider">汤底</span>
      </div>
      <p className="text-sm text-[#E8E6F0] leading-relaxed">{truth}</p>
    </motion.div>
  );
}
