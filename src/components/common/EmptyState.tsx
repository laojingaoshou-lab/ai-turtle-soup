import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      {Icon && <Icon size={48} className="text-[#6B6680] mb-4" strokeWidth={1.5} />}
      <p className="text-[#9D99B5] text-sm font-medium">{title}</p>
      {description && <p className="text-[#6B6680] text-xs mt-1">{description}</p>}
    </motion.div>
  );
}
