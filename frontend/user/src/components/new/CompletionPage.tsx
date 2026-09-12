import { motion } from 'motion/react';
import { Download, Share2, Home } from 'lucide-react';
import { CHAPTERS } from './PremiumReportV2';

interface CompletionPageProps {
  onDownloadPDF: () => void;
  onShareLink: () => void;
  onGoHome: () => void;
  /** 화면에 쓸 코스 이름. 시안이 '3WAY' 로 박아둬서 1WAY 에도 3WAY 라고 떴다. */
  courseLabel?: string;
}

export function CompletionPage({ onDownloadPDF, onShareLink, onGoHome, courseLabel = '1WAY' }: CompletionPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-8 py-20">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-lg w-full"
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
          <p className="text-[30px] leading-[1.3] text-[#111111] mt-6 mb-4" style={{ fontWeight: 200 }}>
            &apos;BE yourself&apos;
          </p>
          <p className="text-[12px] leading-[1.8] text-[#999995]" style={{ fontWeight: 300 }}>
            모든 사람들이 자신의 아름다움을 발견하고
            <br />
            스스로를 사랑할 수 있도록 돕습니다.
          </p>
          <p className="text-[13px] leading-[1.9] text-[#777777] mt-10" style={{ fontWeight: 300 }}>
            오늘의 분석부터 원하는 이미지, 세부 디자인
            <br />
            앞으로의 관리 주기까지 하나의 리포트로 완성했습니다.
          </p>
        </motion.div>

        {/* SECTION 1 – 이 리포트에 담긴 것.
            리포트의 CHAPTERS 를 그대로 쓴다 — 리포트 마지막 장을 이 화면으로
            옮겼으므로 내용이 갈라지면 안 된다. (2026-09-12) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="bg-[#FAFAF8] px-8 py-10 mb-10"
        >
          {CHAPTERS.map((ch, i) => (
            <div
              key={ch.num}
              className={i === 0 ? 'text-center' : 'text-center pt-8 mt-8 border-t border-[#E5E5E3]'}
            >
              <p className="text-[11px] text-[#BBBBB6] mb-1" style={{ fontWeight: 300 }}>{ch.num}</p>
              <p className="text-[13px] tracking-[0.12em] text-[#111111] mb-1" style={{ fontWeight: 500 }}>{ch.title}</p>
              <p className="text-[12px] text-[#999995] mb-4" style={{ fontWeight: 300 }}>{ch.ko}</p>
              {ch.items.map(it => (
                <p key={it} className="text-[13px] leading-[2] text-[#333330]" style={{ fontWeight: 300 }}>{it}</p>
              ))}
            </div>
          ))}
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

      </motion.div>
    </div>
  );
}