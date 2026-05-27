import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ApiKeyInput({ value, onChange, placeholder }: ApiKeyInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'sk-...'}
        className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-sm text-[#E8E6F0] placeholder-[#6B6680] focus:outline-none focus:border-[#A78BFA]/40 font-mono"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6680] hover:text-[#9D99B5] transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
