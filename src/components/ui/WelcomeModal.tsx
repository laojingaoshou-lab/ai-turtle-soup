import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ExternalLink, Settings, Zap } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleGoSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] p-6"
            style={{ background: 'linear-gradient(135deg, rgba(15,15,30,0.98), rgba(20,10,40,0.98))' }}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-[#6B6680] hover:text-[#E8E6F0] transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A78BFA]/20 to-[#5EEAD4]/10 border border-[#A78BFA]/20 mb-4">
                <Sparkles size={28} className="text-[#A78BFA]" />
              </div>
              <h2 className="text-xl font-bold text-[#E8E6F0] mb-1">欢迎来到 AI主持人海龟汤</h2>
              <p className="text-sm text-[#9D99B5]">AI 驱动的沉浸式情境推理游戏</p>
            </div>

            {/* Non-profit notice */}
            <div className="rounded-xl bg-[#5EEAD4]/5 border border-[#5EEAD4]/10 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Zap size={18} className="text-[#5EEAD4] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[#E8E6F0] font-medium mb-1">本网站完全免费、非盈利</p>
                  <p className="text-xs text-[#9D99B5] leading-relaxed">
                    请自行配置大模型API密钥。
                    推荐使用 <span className="text-[#A78BFA] font-medium">DeepSeek</span>，性价比极高，新用户注册即赠免费额度。
                  </p>
                </div>
              </div>
            </div>

            {/* DeepSeek recommendation card */}
            <div className="rounded-xl bg-gradient-to-br from-[#A78BFA]/8 to-[#A78BFA]/2 border border-[#A78BFA]/15 p-4 mb-6">
              <h3 className="text-sm font-bold text-[#A78BFA] mb-2 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                推荐：DeepSeek
              </h3>
              <ul className="space-y-1.5 text-xs text-[#B8B5CC]">
                <li className="flex items-start gap-2">
                  <span className="text-[#A78BFA] mt-0.5">•</span>
                  没什么好说的，就是便宜
                </li>
              </ul>
              <a
                href="https://platform.deepseek.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#A78BFA]/80 hover:text-[#A78BFA] transition-colors"
              >
                前往 DeepSeek 开放平台 <ExternalLink size={12} />
              </a>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-[#9D99B5] text-sm font-medium hover:bg-white/[0.04] hover:text-[#E8E6F0] transition-colors"
              >
                稍后再说
              </button>
              <button
                onClick={handleGoSettings}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#A78BFA]/20 to-[#A78BFA]/15 text-[#A78BFA] text-sm font-medium flex items-center justify-center gap-2 hover:from-[#A78BFA]/30 hover:to-[#A78BFA]/25 transition-colors border border-[#A78BFA]/20"
              >
                <Settings size={16} />
                去配置 AI 模型
              </button>
            </div>

            <p className="text-center text-[10px] text-[#6B6680] mt-4">
              已配置过？点击"稍后再说"关闭，此提示不再显示
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
