import { motion } from 'motion/react';
import { Check, Download, Share2, Home } from 'lucide-react';

interface CompletionPageProps {
  onDownloadPDF: () => void;
  onShareLink: () => void;
  onGoHome: () => void;
}

export function CompletionPage({ onDownloadPDF, onShareLink, onGoHome }: CompletionPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-md w-full"
      >
        {/* 상단 로고 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-[14px] tracking-[0.3em] text-[#111111] mb-3 uppercase" style={{ fontWeight: 400 }}>
            MERCI MOMONG
          </h1>
          <div className="w-12 h-px bg-[#111111] mx-auto"></div>
        </motion.div>

        {/* PAGE TITLE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-[20px] tracking-[0.08em] text-[#111111] mb-8" style={{ fontWeight: 400 }}>
            REPORT COMPLETE
          </h2>
          <p className="text-[13px] leading-[1.8] text-[#777777]" style={{ fontWeight: 300 }}>
            고객님의
            <br />
            3WAY 프리미엄 이미지 설계 리포트가
            <br />
            완성되었습니다
          </p>
          <p className="text-[13px] leading-[1.8] text-[#777777] mt-8" style={{ fontWeight: 300 }}>
            오늘의 디자인은 단순한 시술이 아닌
            <br />
            구조 기반 이미지 설계입니다
          </p>
        </motion.div>

        {/* SECTION 1 – 리포트 안내 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="bg-white p-8 border border-[#E5E5E5] mb-10"
        >
          <div className="space-y-5 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-1 bg-[#111111] flex-shrink-0"></div>
              <p className="text-[13px] text-[#111111]" style={{ fontWeight: 300 }}>얼굴 구조 분석</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1 h-1 bg-[#111111] flex-shrink-0"></div>
              <p className="text-[13px] text-[#111111]" style={{ fontWeight: 300 }}>이미지 좌표 진단</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1 h-1 bg-[#111111] flex-shrink-0"></div>
              <p className="text-[13px] text-[#111111]" style={{ fontWeight: 300 }}>TODAY DESIGN 전략</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1 h-1 bg-[#111111] flex-shrink-0"></div>
              <p className="text-[13px] text-[#111111]" style={{ fontWeight: 300 }}>DESIGN CYCLE MASTER PLAN</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1 h-1 bg-[#111111] flex-shrink-0"></div>
              <p className="text-[13px] text-[#111111]" style={{ fontWeight: 300 }}>3WAY HAIR CONSULTING REPORT</p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E5E5]">
            <p className="text-[11px] text-[#AAAAAA] text-center tracking-[0.02em]" style={{ fontWeight: 300 }}>
              PDF로 저장하거나
              <br />
              링크로 공유할 수 있습니다
            </p>
          </div>
        </motion.div>

        {/* SECTION 2 – 버튼 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="space-y-4 mb-16"
        >
          {/* PDF 다운로드 버튼 */}
          <button
            onClick={onDownloadPDF}
            className="w-full bg-[#111111] text-white py-4 text-[13px] tracking-[0.05em] transition-all hover:bg-[#222222] flex items-center justify-center gap-3"
            style={{ fontWeight: 400 }}
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            PDF 다운로드
          </button>

          {/* 링크 공유 버튼 */}
          <button
            onClick={onShareLink}
            className="w-full bg-white text-[#111111] py-4 text-[13px] tracking-[0.05em] border border-[#111111] transition-all hover:bg-[#FAFAFA] flex items-center justify-center gap-3"
            style={{ fontWeight: 300 }}
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            링크 공유
          </button>

          {/* 홈으로 이동 버튼 */}
          <button
            onClick={onGoHome}
            className="w-full bg-white text-[#777777] py-4 text-[13px] tracking-[0.05em] border border-[#E5E5E5] transition-all hover:bg-[#FAFAFA] flex items-center justify-center gap-3"
            style={{ fontWeight: 300 }}
          >
            <Home className="w-4 h-4" strokeWidth={1.5} />
            홈으로 이동
          </button>
        </motion.div>

        {/* SECTION 3 – 브랜드 마무리 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center pt-10 border-t border-[#E5E5E5]"
        >
          <p className="text-[11px] tracking-[0.25em] text-[#111111] mb-5 uppercase" style={{ fontWeight: 400 }}>
            BE YOURSELF
          </p>
          <p className="text-[12px] leading-[1.8] text-[#777777]" style={{ fontWeight: 300 }}>
            모든 사람들이 자신의 아름다움을 발견하고 스스로 사랑할 수 있도록 돕습니다.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}