import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Edit2 } from 'lucide-react';
import { BrandHeader } from './BrandHeader';
import { NavigationButtons } from './NavigationButtons';
import type { AnalyzeResponse } from '@/utils/face-analysis-api';
const faceImage = '/3way/face-image.png';

interface FaceAnalysisResultProps {
  onBack: () => void;
  onNext: () => void;
  analysisResult?: AnalyzeResponse | null;
}

// Python 응답의 results 키 (1~10, 1~12 문자열) ↔ UI 행 매핑
const WNC_KEY_BY_LABEL: Record<string, string> = {
  '피부톤': '1',
  '페이스라인': '2',
  '윤곽라인': '4',
  '눈썹': '5',
  '눈': '6',
  '코': '8',
  '입술': '9',
};

const SNH_KEY_BY_LABEL: Record<string, string> = {
  '피부톤': '1',
  '얼굴 밸런스': '9',
  '가로 비율': '5',
  '세로 비율': '2',
  '눈썹 밀도': '3',
  '코 폭': '8',
  '입술 폭': '11',
};

// Python 응답의 각 모듈은 `grade` (또는 `type`) 필드로 W/N/C, S/N/H 를 가짐
const moduleGrade = (m: { type?: string; grade?: string } | null | undefined) =>
  (m?.grade || m?.type || 'N').toUpperCase();

const wncTypeToSelected = (t: string): 'warm' | 'neutral' | 'cool' =>
  t === 'W' ? 'warm' : t === 'C' ? 'cool' : 'neutral';

const snhTypeToSelected = (t: string): 'soft' | 'neutral' | 'hard' =>
  t === 'S' ? 'soft' : t === 'H' ? 'hard' : 'neutral';

interface AnalysisRow {
  label: string;
  warm?: string;
  neutral: string;
  cool?: string;
  selectedType: 'warm' | 'neutral' | 'cool';
}

interface SoftHardRow {
  label: string;
  soft?: string;
  neutral: string;
  hard?: string;
  selectedType: 'soft' | 'neutral' | 'hard';
}

export function FaceAnalysisResult({ onBack, onNext, analysisResult }: FaceAnalysisResultProps) {
  // 분석 결과의 type 값으로 초기 selectedType 채우기 (없으면 neutral)
  const initWarmCool = (): AnalysisRow[] => {
    const base: AnalysisRow[] = [
      { label: '피부톤', warm: '', neutral: 'Neutral', cool: '', selectedType: 'neutral' },
      { label: '페이스라인', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
      { label: '윤곽라인', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
      { label: '눈썹', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
      { label: '눈', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
      { label: '코', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
      { label: '입술', warm: '', neutral: '중간', cool: '', selectedType: 'neutral' },
    ];
    const results = analysisResult?.wnc?.results;
    if (!results) return base;
    return base.map((row) => {
      const key = WNC_KEY_BY_LABEL[row.label];
      const module = key ? results[key] : null;
      return module ? { ...row, selectedType: wncTypeToSelected(moduleGrade(module)) } : row;
    });
  };

  const initSoftHard = (): SoftHardRow[] => {
    const base: SoftHardRow[] = [
      { label: '피부톤', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
      { label: '얼굴 밸런스', soft: '', neutral: '균형형', hard: '', selectedType: 'neutral' },
      { label: '가로 비율', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
      { label: '세로 비율', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
      { label: '눈썹 밀도', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
      { label: '코 폭', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
      { label: '입술 폭', soft: '', neutral: '중간', hard: '', selectedType: 'neutral' },
    ];
    const results = analysisResult?.snh?.results;
    if (!results) return base;
    return base.map((row) => {
      const key = SNH_KEY_BY_LABEL[row.label];
      const module = key ? results[key] : null;
      return module ? { ...row, selectedType: snhTypeToSelected(moduleGrade(module)) } : row;
    });
  };

  const [warmCoolAnalysis, setWarmCoolAnalysis] = useState<AnalysisRow[]>(initWarmCool);
  const [softHardAnalysis, setSoftHardAnalysis] = useState<SoftHardRow[]>(initSoftHard);

  const [ratios, setRatios] = useState({
    vertical: '1:1:1',
    face: '1:1.4',
    midSection: '1:2'
  });

  const [summaryItems, setSummaryItems] = useState([
    '비율 균형형',
    'Soft/Hard 중립형',
    'Warm/Cool 중립형',
    '왜곡 없이 안정된 구조'
  ]);

  const [isEditingRatios, setIsEditingRatios] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  // 최종 도출 계산 — 가장 많이 선택된 타입을 반환 (동률 시 W > N > C / S > N > H 우선)
  const calculateFinalWarmCool = (): 'W' | 'N' | 'C' => {
    const counts = { warm: 0, neutral: 0, cool: 0 };
    warmCoolAnalysis.forEach((row) => counts[row.selectedType]++);
    const entries: { type: 'W' | 'N' | 'C'; count: number }[] = [
      { type: 'W', count: counts.warm },
      { type: 'N', count: counts.neutral },
      { type: 'C', count: counts.cool },
    ];
    entries.sort((a, b) => b.count - a.count);
    return entries[0].type;
  };

  const calculateFinalSoftHard = (): 'S' | 'N' | 'H' => {
    const counts = { soft: 0, neutral: 0, hard: 0 };
    softHardAnalysis.forEach((row) => counts[row.selectedType]++);
    const entries: { type: 'S' | 'N' | 'H'; count: number }[] = [
      { type: 'S', count: counts.soft },
      { type: 'N', count: counts.neutral },
      { type: 'H', count: counts.hard },
    ];
    entries.sort((a, b) => b.count - a.count);
    return entries[0].type;
  };

  const finalWarmCool = calculateFinalWarmCool();
  const finalSoftHard = calculateFinalSoftHard();

  // Warm/Cool 행 선택 변경
  const handleWarmCoolChange = (index: number, type: 'warm' | 'neutral' | 'cool') => {
    const updated = [...warmCoolAnalysis];
    updated[index].selectedType = type;
    setWarmCoolAnalysis(updated);
  };

  // Soft/Hard 행 선택 변경
  const handleSoftHardChange = (index: number, type: 'soft' | 'neutral' | 'hard') => {
    const updated = [...softHardAnalysis];
    updated[index].selectedType = type;
    setSoftHardAnalysis(updated);
  };

  // 요약 항목 변경
  const handleSummaryItemChange = (index: number, value: string) => {
    const updated = [...summaryItems];
    updated[index] = value;
    setSummaryItems(updated);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}
      <BrandHeader />

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs text-gray-500 font-medium tracking-wider mb-2">Step 8 of 12</p>
            <h2 className="text-2xl font-bold text-[#111111] tracking-[-0.01em] mb-3">
              Face Precision Result
            </h2>
            <p className="text-sm text-[#111111] font-medium">
              얼굴 비율 및 이미지 타입 분석 결과입니다.
            </p>
          </motion.div>

          {/* 메인 레이아웃: 좌우 2열 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* 좌측 영역 – 분석 결과 표 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-8"
            >
              {/* 1. Warm/Neutral/Cool 분석 */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-base font-normal tracking-wide text-black mb-4">
                  Warm / Neutral / Cool 분석
                </h2>

                {/* 테이블 헤더 */}
                <div className="grid grid-cols-4 gap-2 mb-3 pb-2 border-b border-gray-300">
                  <div className="text-xs font-normal text-gray-500"></div>
                  <div className="text-xs font-normal text-gray-700 text-center">Warm</div>
                  <div className="text-xs font-normal text-gray-700 text-center">N</div>
                  <div className="text-xs font-normal text-gray-700 text-center">Cool</div>
                </div>

                {/* 테이블 본문 */}
                <div className="space-y-2">
                  {warmCoolAnalysis.map((row, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-xs font-normal text-gray-700">{row.label}</div>
                      <button
                        onClick={() => handleWarmCoolChange(index, 'warm')}
                        className="text-center hover:bg-gray-100 py-1 transition-colors"
                      >
                        {row.selectedType === 'warm' && (
                          <Check className="w-4 h-4 text-black mx-auto" strokeWidth={2} />
                        )}
                      </button>
                      <button
                        onClick={() => handleWarmCoolChange(index, 'neutral')}
                        className={`text-center text-xs font-normal hover:opacity-80 transition-opacity py-1 ${ row.selectedType === 'neutral'
                            ? 'bg-black text-white rounded px-2'
                            : 'text-gray-500'
                        }`}
                      >
                        {row.neutral}
                      </button>
                      <button
                        onClick={() => handleWarmCoolChange(index, 'cool')}
                        className="text-center hover:bg-gray-100 py-1 transition-colors"
                      >
                        {row.selectedType === 'cool' && (
                          <Check className="w-4 h-4 text-black mx-auto" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 최종 도출 */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-black">최종 도출:</span>
                    <span className="text-base font-medium text-black">
                      {finalWarmCool === 'W' ? 'Warm' : finalWarmCool === 'C' ? 'Cool' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Soft/Neutral/Hard 분석 */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-base font-normal tracking-wide text-black mb-4">
                  Soft / Neutral / Hard 분석
                </h2>

                {/* 테이블 헤더 */}
                <div className="grid grid-cols-4 gap-2 mb-3 pb-2 border-b border-gray-300">
                  <div className="text-xs font-normal text-gray-500"></div>
                  <div className="text-xs font-normal text-gray-700 text-center">Soft</div>
                  <div className="text-xs font-normal text-gray-700 text-center">N</div>
                  <div className="text-xs font-normal text-gray-700 text-center">Hard</div>
                </div>

                {/* 테이블 본문 */}
                <div className="space-y-2">
                  {softHardAnalysis.map((row, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-xs font-normal text-gray-700">{row.label}</div>
                      <button
                        onClick={() => handleSoftHardChange(index, 'soft')}
                        className="text-center hover:bg-gray-100 py-1 transition-colors"
                      >
                        {row.selectedType === 'soft' && (
                          <Check className="w-4 h-4 text-black mx-auto" strokeWidth={2} />
                        )}
                      </button>
                      <button
                        onClick={() => handleSoftHardChange(index, 'neutral')}
                        className={`text-center text-xs font-normal hover:opacity-80 transition-opacity py-1 ${
                          row.selectedType === 'neutral'
                            ? 'bg-black text-white rounded px-2'
                            : 'text-gray-500'
                        }`}
                      >
                        {row.neutral}
                      </button>
                      <button
                        onClick={() => handleSoftHardChange(index, 'hard')}
                        className="text-center hover:bg-gray-100 py-1 transition-colors"
                      >
                        {row.selectedType === 'hard' && (
                          <Check className="w-4 h-4 text-black mx-auto" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 최종 도출 */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-black">최종 도출:</span>
                    <span className="text-base font-medium text-black">
                      {finalSoftHard === 'S' ? 'Soft' : finalSoftHard === 'H' ? 'Hard' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 최종 이미지 타입 */}
              <div className="bg-black text-white rounded-2xl p-6">
                <p className="text-xs font-normal tracking-wider uppercase mb-2">Image Type</p>
                <p className="text-3xl font-normal tracking-wider">
                  {finalWarmCool} / {finalSoftHard}
                </p>
              </div>
            </motion.div>

            {/* 우측 영역 – 얼굴 이미지 + 오버레이 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-6"
            >
              {/* 얼굴 분석 이미지 */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-200">
                  {/* 배경 이미지 */}
                  <img
                    src={faceImage}
                    alt="Face Analysis"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* 오버레이 가이드 */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 400 500"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    {/* 얼굴 타원 가이드 */}
                    <ellipse
                      cx="200"
                      cy="220"
                      rx="120"
                      ry="160"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1"
                    />

                    {/* 세로 중심선 */}
                    <line
                      x1="200"
                      y1="100"
                      x2="200"
                      y2="340"
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="0.5"
                    />

                    {/* 상중하 3등분 라인 - 상단 */}
                    <line
                      x1="80"
                      y1="140"
                      x2="320"
                      y2="140"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="85"
                      y="135"
                      fill="rgba(255, 255, 255, 0.7)"
                      fontSize="10"
                      fontWeight="300"
                    >
                      1
                    </text>

                    {/* 눈 수평 라인 (강조) */}
                    <line
                      x1="80"
                      y1="200"
                      x2="320"
                      y2="200"
                      stroke="rgba(255, 255, 255, 0.5)"
                      strokeWidth="1"
                    />

                    {/* 상중하 3등분 라인 - 중단 */}
                    <line
                      x1="80"
                      y1="260"
                      x2="320"
                      y2="260"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="85"
                      y="230"
                      fill="rgba(255, 255, 255, 0.7)"
                      fontSize="10"
                      fontWeight="300"
                    >
                      1
                    </text>

                    {/* 하단 */}
                    <line
                      x1="80"
                      y1="320"
                      x2="320"
                      y2="320"
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="0.5"
                    />
                    <text
                      x="85"
                      y="290"
                      fill="rgba(255, 255, 255, 0.7)"
                      fontSize="10"
                      fontWeight="300"
                    >
                      1
                    </text>

                    {/* 코끝 위치 포인트 */}
                    <circle
                      cx="200"
                      cy="245"
                      r="2"
                      fill="rgba(255, 255, 255, 0.6)"
                    />

                    {/* 턱 중심점 */}
                    <circle
                      cx="200"
                      cy="330"
                      r="2"
                      fill="rgba(255, 255, 255, 0.6)"
                    />
                  </svg>

                  {/* 수치 표시 */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 space-y-1">
                    {isEditingRatios ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-normal">상중하:</span>
                          <input
                            type="text"
                            value={ratios.vertical}
                            onChange={(e) => setRatios({ ...ratios, vertical: e.target.value })}
                            className="bg-white/20 text-white text-xs px-1 py-0.5 w-16 border-none outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-normal">얼굴비율:</span>
                          <input
                            type="text"
                            value={ratios.face}
                            onChange={(e) => setRatios({ ...ratios, face: e.target.value })}
                            className="bg-white/20 text-white text-xs px-1 py-0.5 w-16 border-none outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-normal">중안부:</span>
                          <input
                            type="text"
                            value={ratios.midSection}
                            onChange={(e) => setRatios({ ...ratios, midSection: e.target.value })}
                            className="bg-white/20 text-white text-xs px-1 py-0.5 w-16 border-none outline-none"
                          />
                        </div>
                        <button
                          onClick={() => setIsEditingRatios(false)}
                          className="text-xs text-white/80 hover:text-white mt-1 underline"
                        >
                          완료
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-white font-normal">상중하: {ratios.vertical}</p>
                        <p className="text-xs text-white font-normal">얼굴비율: {ratios.face}</p>
                        <p className="text-xs text-white font-normal">중안부: {ratios.midSection}</p>
                        <button
                          onClick={() => setIsEditingRatios(true)}
                          className="mt-1"
                        >
                          <Edit2 className="w-3 h-3 text-white/60 hover:text-white" strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 하단 요약 박스 */}
              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-normal text-black">이미지 밸런스 분석 요약</h3>
                  {!isEditingSummary && (
                    <button onClick={() => setIsEditingSummary(true)}>
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-black" strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                {isEditingSummary ? (
                  <div className="space-y-2">
                    {summaryItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleSummaryItemChange(index, e.target.value)}
                          className="flex-1 text-xs text-gray-700 font-normal bg-white border border-gray-200 px-2 py-1 outline-none focus:border-black"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => setIsEditingSummary(false)}
                      className="text-xs text-gray-600 hover:text-black mt-2 underline"
                    >
                      완료
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs text-gray-700 font-normal">
                    {summaryItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </div>

          {/* 하단 버튼 */}
          <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="다음" />
        </div>
      </div>
    </div>
  );
}