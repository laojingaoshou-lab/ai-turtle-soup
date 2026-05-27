import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const thinkingTexts = ['AI 正在思考', 'AI 正在推理', 'AI 正在分析'];

export function TypingIndicator() {
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIdx((i) => (i + 1) % thinkingTexts.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex justify-start"
    >
      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.06] backdrop-blur-md border-l-2 border-l-[#A78BFA]">
        <div className="flex items-center gap-2">
          <motion.span
            key={textIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#9D99B5]"
          >
            {thinkingTexts[textIdx]}
          </motion.span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  y: { duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' },
                  opacity: { duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' },
                }}
              />
            ))}
          </div>
          <motion.span
            className="w-0.5 h-4 bg-[#A78BFA]/60 rounded-full"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
