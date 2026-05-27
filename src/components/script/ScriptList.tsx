import type { Script } from '@/types';
import { ScriptCard } from './ScriptCard';
import { EmptyState } from '@/components/common/EmptyState';
import { BookOpen } from 'lucide-react';

interface ScriptListProps {
  scripts: Script[];
  title: string;
  emptyText?: string;
  onSelect?: (script: Script) => void;
}

export function ScriptList({ scripts, title, emptyText, onSelect }: ScriptListProps) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-bold text-[#9D99B5] tracking-wider uppercase mb-3">{title}</h2>
      {scripts.length === 0 ? (
        <EmptyState icon={BookOpen} title={emptyText || '暂无剧本'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scripts.map((script, i) => (
            <ScriptCard key={script.id} script={script} index={i} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
