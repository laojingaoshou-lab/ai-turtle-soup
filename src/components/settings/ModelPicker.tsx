import { ChevronDown } from 'lucide-react';
import { getProviderById } from '@/data/providers';
import { useSettingsStore } from '@/stores/settingsStore';

export function ModelPicker() {
  const { settings, setModel } = useSettingsStore();
  const preset = getProviderById(settings.provider);

  if (preset && preset.id !== 'custom' && preset.models.length > 0) {
    return (
      <div>
        <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">模型</label>
        <div className="relative">
          <select
            value={settings.model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] focus:outline-none focus:border-[#A78BFA]/40 appearance-none cursor-pointer"
          >
            {preset.models.map((m) => (
              <option key={m} value={m} className="bg-[#16142D] text-[#E8E6F0]">
                {m}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6680] pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[#9D99B5] mb-1.5">模型</label>
      <input
        value={settings.model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="输入模型名称..."
        className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40"
      />
    </div>
  );
}
