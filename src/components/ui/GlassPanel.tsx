import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export function GlassPanel({ strong, className, children, delay = 0, ...props }: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(strong ? 'glass-strong' : 'glass', 'rounded-2xl p-4 sm:p-5', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
