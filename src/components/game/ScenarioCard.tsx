import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ScenarioCardProps {
  scenario: string;
  threshold?: number;
}

export function ScenarioCard({ scenario, threshold = 120 }: ScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = scenario.length > threshold;

  return (
    <div className="glass rounded-2xl p-4 animate-border-pulse mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-[#A78BFA] tracking-wider uppercase">汤面</span>
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#9D99B5] hover:text-[#A78BFA] transition-colors flex-shrink-0"
          >
            {expanded ? '收起' : '展开'}
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      <motion.p
        animate={{
          maxHeight: expanded || !isLong ? '20rem' : '4.3rem',
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'text-sm text-[#E8E6F0] leading-relaxed overflow-hidden',
          !expanded && isLong && 'line-clamp-3'
        )}
      >
        {scenario}
      </motion.p>
    </div>
  );
}
