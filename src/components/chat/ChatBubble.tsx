import { motion } from 'framer-motion';
import type { ChatMessage } from '@/types';
import { cn } from '@/utils/cn';

const answerColors: Record<string, string> = {
  '是': 'border-l-[#5EEAD4]',
  '不是': 'border-l-[#F472B6]',
  '无关': 'border-l-[#FBBF24]',
  'welcome': 'border-l-[#A78BFA]',
  'correct': 'border-l-[#5EEAD4]',
  'hint': 'border-l-[#FBBF24]',
  'error': 'border-l-[#FB7185]',
};

const answerLabels: Record<string, string> = {
  '是': '是',
  '不是': '不是',
  '无关': '无关',
  'welcome': '欢迎',
  'correct': '正确',
  'hint': '提示',
  'error': '错误',
};

export function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center py-2"
      >
        <span className="text-xs text-[#6B6680] italic text-center max-w-xs">
          {message.content}
        </span>
      </motion.div>
    );
  }

  const isUser = message.role === 'user';
  const colorClass = message.answerType ? answerColors[message.answerType] : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-[#A78BFA]/20 text-[#E8E6F0] rounded-br-md'
            : 'bg-white/[0.06] backdrop-blur-md text-[#E8E6F0] rounded-bl-md border-l-2',
          colorClass
        )}
      >
        {message.playerName && (
          <p className="text-[10px] text-[#A78BFA] mb-1 font-medium">{message.playerName}</p>
        )}
        {message.answerType && !isUser && (
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: message.answerType === '是' ? '#5EEAD4' : message.answerType === '不是' ? '#F472B6' : message.answerType === '无关' ? '#FBBF24' : '#A78BFA' }}
          >
            {answerLabels[message.answerType] || message.answerType}
          </span>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </motion.div>
  );
}
