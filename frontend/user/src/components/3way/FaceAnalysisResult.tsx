import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Edit2 } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';
import { getModuleConfigs, type AnalyzeResponse, type ModuleConfig } from '@/utils/face-analysis-api';
const faceImage = '/3way/face-image.png';

// 디자이너가 (필요 시 수정한) 최종 얼굴 분석 결과 — 다운스트림 step 으로 전달 + 저장
export interface FaceResultData {
  wncFinal: 'W' | 'N' | 'C';
  snhFinal: 'S' | 'N' | 'H';
  ratios: { vertical: string; face: string; midSection: string };
  summaryItems: string[];
  warmCool: { label: string; selectedType: 'warm' | 'neutral' | 'cool' }[];
  softHard: { label: string; selectedType: 'soft' | 'neutral' | 'hard' }[];
}

interface FaceAnalysisResultProps {
  onBack: () => void;
  onNext: (data: FaceResultData) => void;
  analysisResult?: AnalyzeResponse | null;
}

type RowCfg = { key: string; label: string };

// 표시는 서버 module-configs(SSOT)가 결정. 아래는 조회 실패 시 안전망(폴백).
// 바인딩은 모듈번호(key)로 직접 → 라벨 역조회로 인한 "죽은 모듈" 버그 구조적으로 불가능.
const WNC_FALLBACK: RowCfg[] = [
  { key: '1', label: '피부톤' },
  { key: '2', label: '페이스라인' },
  { key: '3', label: '광대 발달 정도' },
  { key: '5', label: '눈썹 형태' },
  { key: '6', label: '눈 형태' },
  { key: '8', label: '코 형태' },
  { key: '9', label: '입술 형태' },
];

const SNH_FALLBACK: RowCfg[] = [
  { key: '2', label: '얼굴 길이' },
  { key: '4', label: '눈썹과 눈 거리' },
  { key: '5', label: '눈과 눈사이 거리' },
  { key: '11', label: '중안부' },
  { key: '10', label: '코 폭' },
  { key: '13', label: '입 폭' },
];

// module-configs[] → 축별 표시행 (display 필터 + order 정렬)
const rowCfgsFromConfigs = (configs: ModuleConfig[], axis: 'WNC' | 'SNH'): RowCfg[] =>
  configs
    .filter((c) => c.axis === axis && c.display)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ key: c.moduleKey, label: c.label }));

// Python 응답의 각 모듈은 `grade` (또는 `type`) 필드로 W/N/C, S/N/H 를 가짐
const moduleGrade = (m: { type?: string; grade?: string } | null | undefined) =>
  (m?.grade || m?.type || 'N').toUpperCase();

const wncTypeToSelected = (t: string): 'warm' | 'neutral' | 'cool' =>
  t === 'W' ? 'warm' : t === 'C' ? 'cool' : 'neutral';

const snhTypeToSelected = (t: string): 'soft' | 'neutral' | 'hard' =>
  t === 'S' ? 'soft' : t === 'H' ? 'hard' : 'neutral';

interface AnalysisRow {
  key: string;
  label: string;
  neutral: string;
  selectedType: 'warm' | 'neutral' | 'cool';
}

interface SoftHardRow {
  key: string;
  label: string;
  neutral: string;
  selectedType: 'soft' | 'neutral' | 'hard';
}

// rowCfgs + 분석 results → 표 행 (selectedType 초기값 = 서버 grade, 모듈번호로 직접 조회)
type GradeModule = { grade?: string; type?: string };
function buildWarmCool(rowCfgs: RowCfg[], results?: Record<string, GradeModule>): AnalysisRow[] {
  return rowCfgs.map(({ key, label }) => {
    const m = results?.[key];
    return { key, label, neutral: '중간', selectedType: m ? wncTypeToSelected(moduleGrade(m)) : 'neutral' };
  });
}

function buildSoftHard(rowCfgs: RowCfg[], results?: Record<string, GradeModule>): SoftHardRow[] {
  return rowCfgs.map(({ key, label }) => {
    const m = results?.[key];
    return { key, label, neutral: '중간', selectedType: m ? snhTypeToSelected(moduleGrade(m)) : 'neutral' };
  });
}

export function FaceAnalysisResult({ onBack, onNext, analysisResult }: FaceAnalysisResultProps) {
  const wncResults = analysisResult?.wnc?.results;
  const snhResults = analysisResult?.snh?.results;

  // 초기엔 폴백으로 그리고, module-configs 로드되면 서버 설정 기준으로 교체
  const [warmCoolAnalysis, setWarmCoolAnalysis] = useState<AnalysisRow[]>(
    () => buildWarmCool(WNC_FALLBACK, wncResults),
  );
  const [softHardAnalysis, setSoftHardAnalysis] = useState<SoftHardRow[]>(
    () => buildSoftHard(SNH_FALLBACK, snhResults),
  );

  // module-configs 조회 → 표시/순서/라벨을 서버 설정 기준으로 재구성. 실패 시 폴백 유지.
  useEffect(() => {
    let cancelled = false;
    getModuleConfigs()
      .then((configs) => {
        if (cancelled || !configs.length) return;
        setWarmCoolAnalysis(buildWarmCool(rowCfgsFromConfigs(configs, 'WNC'), wncResults));
        setSoftHardAnalysis(buildSoftHard(rowCfgsFromConfigs(configs, 'SNH'), snhResults));
      })
      .catch(() => {
        /* 폴백 유지 */
      });
    return () => {
      cancelled = true;
    };
    // 분석 결과는 마운트 시 고정(재분석 시 재마운트) → 1회만 로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 비율: 얼굴비율=SNH_2(세로/가로), 중안부=SNH_11 의 서버 value 를 표기(X : 1).
  // 상중하는 서버 측정 모듈이 없어 수동 입력 유지. 값이 없으면 '- : 1'.
  const [ratios, setRatios] = useState(() => {
    const fmt = (v?: number | null) => (v != null ? `${v.toFixed(2)} : 1` : '- : 1');
    return {
      vertical: '1 : 1 : 1',
      face: fmt(snhResults?.['2']?.value),
      midSection: fmt(snhResults?.['11']?.value),
    };
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
                    <div key={row.key} className="grid grid-cols-4 gap-2 items-center">
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
                    <div key={row.key} className="grid grid-cols-4 gap-2 items-center">
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
          <NavigationButtons
            onBack={onBack}
            onNext={() =>
              onNext({
                wncFinal: finalWarmCool,
                snhFinal: finalSoftHard,
                ratios,
                summaryItems,
                warmCool: warmCoolAnalysis.map((r) => ({ label: r.label, selectedType: r.selectedType })),
                softHard: softHardAnalysis.map((r) => ({ label: r.label, selectedType: r.selectedType })),
              })
            }
            nextLabel="다음"
          />
        </div>
      </div>
    </div>
  );
}