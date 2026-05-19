import { motion } from 'motion/react';

export function BrandHeader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200"
    >
      <div className="px-6 py-4 flex justify-end">
        <span className="text-xs tracking-[0.3em] font-light text-black">
          MERCI MOMONG
        </span>
      </div>
    </motion.div>
  );
}
