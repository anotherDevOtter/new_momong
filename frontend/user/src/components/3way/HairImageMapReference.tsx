import { motion } from 'motion/react';
import { X } from 'lucide-react';
const hairImageMapImg = '/3way/hair-image-map.png';

interface HairImageMapReferenceProps {
  onClose: () => void;
}

export function HairImageMapReference({ onClose }: HairImageMapReferenceProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-light text-black tracking-wide">헤어 이미지맵 참고</h2>
            <p className="text-xs text-gray-600 font-light mt-1">
              실제 스타일 예시를 확인하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>

        {/* 이미지 */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          <img
            src={hairImageMapImg}
            alt="헤어 이미지맵"
            className="w-full h-auto rounded-xl border border-gray-200"
          />

          {/* 하단 설명 */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-light text-gray-500 mb-2">가로축 (Warm ←→ Cool)</p>
              <ul className="space-y-1 text-xs text-gray-700 font-light">
                <li>• W: 웨이브, 부드러움, 둥근 실루엣</li>
                <li>• C: 스트레이트, 선명함, 직선적 라인</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-light text-gray-500 mb-2">세로축 (Soft ↑↓ Hard)</p>
              <ul className="space-y-1 text-xs text-gray-700 font-light">
                <li>• S: 가벼움, 짧아짐, 앞머리, 질감</li>
                <li>• H: 길어짐, 무게감, 이마 노출, 단단함</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
