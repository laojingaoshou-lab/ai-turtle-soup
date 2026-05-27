import { useState, useRef, useEffect } from 'react';
import { Send, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ChatInputProps {
  onSend: (text: string) => void;
  onGiveUp: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 200;

export function ChatInput({ onSend, onGiveUp, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGiveUp}
        className="flex-shrink-0 p-2.5 rounded-xl bg-[#F472B6]/10 text-[#F472B6] hover:bg-[#F472B6]/20 transition-colors"
        title="放弃"
      >
        <Flag size={18} />
      </motion.button>

      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) setText(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '输入你的问题...'}
          rows={1}
          disabled={disabled}
          className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 pr-14 text-sm text-[#E8E6F0] placeholder-[#6B6680] resize-none focus:outline-none focus:border-[#A78BFA]/40 transition-colors disabled:opacity-50"
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-1">
          <span
            className={cn(
              'text-[10px]',
              text.length >= MAX_LENGTH * 0.9 ? 'text-[#FB7185]' : 'text-[#6B6680]'
            )}
          >
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="flex-shrink-0 p-3 rounded-xl bg-[#A78BFA] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
      >
        <Send size={18} />
      </motion.button>
    </div>
  );
}
