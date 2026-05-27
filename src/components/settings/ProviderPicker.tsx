import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { providerPresets, getProviderById } from '@/data/providers';
import { useSettingsStore } from '@/stores/settingsStore';
import { cn } from '@/utils/cn';

export function ProviderPicker() {
  const { settings, setProvider } = useSettingsStore();
  const current = getProviderById(settings.provider);

  return (
    <div>
      <label className="block text-xs font-medium text-[#9D99B5] mb-2">供应商</label>
      <div className="grid grid-cols-2 gap-2">
        {providerPresets.map((p) => {
          const isActive = settings.provider === p.id;
          return (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setProvider(p.id)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-[#A78BFA]/15 border border-[#A78BFA]/30 text-[#A78BFA]'
                  : 'bg-white/[0.04] border border-white/[0.06] text-[#9D99B5] hover:border-white/[0.12]'
              )}
            >
              <span className="truncate">{p.name}</span>
              {isActive && <Check size={14} className="flex-shrink-0 ml-1" />}
            </motion.button>
          );
        })}
      </div>
      {current && current.id !== 'custom' && (
        <p className="text-[10px] text-[#6B6680] mt-1.5">
          {current.apiBaseUrl}
        </p>
      )}
    </div>
  );
}
