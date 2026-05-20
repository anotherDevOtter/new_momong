import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface KeywordCardProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function KeywordCard({ label, selected, onToggle }: KeywordCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      className={`
        relative w-full h-14 px-4 flex items-center justify-center gap-3 text-sm font-medium border transition-all
        ${
          selected
            ? 'bg-[#111111] text-white border-[#111111]'
            : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
        }
      `}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 w-4 h-4 bg-white border border-white flex items-center justify-center"
        >
          <Check size={10} color="#111111" strokeWidth={3} />
        </motion.div>
      )}

      <span>{label}</span>
    </motion.button>
  );
}
