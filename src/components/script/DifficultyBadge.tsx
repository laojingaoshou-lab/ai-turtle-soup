import { cn } from '@/utils/cn';

const config: Record<string, { label: string; className: string }> = {
  easy: { label: '简单', className: 'bg-[#5EEAD4]/15 text-[#5EEAD4]' },
  medium: { label: '中等', className: 'bg-[#FBBF24]/15 text-[#FBBF24]' },
  hard: { label: '困难', className: 'bg-[#F472B6]/15 text-[#F472B6]' },
};

interface DifficultyBadgeProps {
  difficulty: string;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const c = config[difficulty] || config.medium;
  return (
    <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase', c.className)}>
      {c.label}
    </span>
  );
}
