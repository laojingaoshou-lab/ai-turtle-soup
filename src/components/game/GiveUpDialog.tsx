import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';

interface GiveUpDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function GiveUpDialog({ open, onClose, onConfirm }: GiveUpDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AlertTriangle size={40} className="text-[#FBBF24] mb-4" />
        </motion.div>
        <h3 className="text-lg font-bold text-[#E8E6F0] mb-2">确认放弃？</h3>
        <p className="text-sm text-[#9D99B5] mb-6">
          放弃后将揭示汤底，是否确认？
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-[#9D99B5] hover:bg-white/[0.1] transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#F472B6]/20 text-[#F472B6] hover:bg-[#F472B6]/30 transition-colors text-sm font-medium"
          >
            确认放弃
          </button>
        </div>
      </div>
    </Modal>
  );
}
