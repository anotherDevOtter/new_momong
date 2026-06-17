import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, AlertCircle } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';

type DamageLevel = 'healthy' | 'light' | 'medium' | 'heavy' | 'extreme' | 'severe';
type HairType = 'straight' | 'wavy' | 'curly';
type Thickness = 'thin' | 'normal' | 'thick';
type Density = 'low' | 'normal' | 'high';
type CurlCoverage = 'none' | 'partial' | 'full';

export interface HairTextureData {
  damageLevel: DamageLevel;
  hairType: HairType;
  thickness: Thickness;
  density: Density;
  curlCoverage: CurlCoverage;
}

interface HairTextureAnalysisProps {
  onBack: () => void;
  onNext: () => void;
  onChange?: (data: HairTextureData) => void;
}

export function HairTextureAnalysis({ onBack, onNext, onChange }: HairTextureAnalysisProps) {
  const [damageLevel, setDamageLevel] = useState<DamageLevel>('light');
  const [hairType, setHairType] = useState<HairType>('wavy');
  const [thickness, setThickness] = useState<Thickness>('normal');
  const [density, setDensity] = useState<Density>('normal');
  const [curlCoverage, setCurlCoverage] = useState<CurlCoverage>('partial');
  const [interpretation, setInterpretation] = useState<string[]>([]);

  // 선택 변경 시 상위로 보고 (저장용)
  useEffect(() => {
    onChange?.({ damageLevel, hairType, thickness, density, curlCoverage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damageLevel, hairType, thickness, density, curlCoverage]);

  // 손상도 옵션
  const damageLevels: { id: DamageLevel; label: string; description: string; warning?: boolean }[] = [
    { id: 'healthy', label: '건강모', description: '모든 시술 가능 / 유지력 우수', warning: false },
    { id: 'light', label: '약손상', description: '컬 유지 가능 / 과도한 탈색은 주의', warning: false },
    { id: 'medium', label: '중손상', description: '트리트먼트 병행 필수 / 고열 주의', warning: false },
    { id: 'heavy', label: '강손상', description: '컬러 단계 제한 / 케어 집중 필요', warning: true },
    { id: 'extreme', label: '극손상', description: '시술 최소화 / 재생 프로그램 권장', warning: true },
    { id: 'severe', label: '초극손상', description: '추가 시술 불가 / 커트만 가능', warning: true },
  ];

  // 모질 상태 옵션
  const hairTypes: { id: HairType; label: string; interpretation: string }[] = [
    { id: 'straight', label: '직모', interpretation: '스트레이트 유지력 우수 / 볼륨 설계 필요' },
    { id: 'wavy', label: '반곱슬', interpretation: '직선 유지력 낮음 / 자연스러운 S컬 적합' },
    { id: 'curly', label: '곱슬', interpretation: '웨이브 형태 적합 / 수분 관리 중요' },
  ];

  // 굵기 옵션
  const thicknessOptions: { id: Thickness; label: string; interpretation: string }[] = [
    { id: 'thin', label: '가늘다', interpretation: '볼륨 설계 중요 / 가벼운 질감 추천' },
    { id: 'normal', label: '보통', interpretation: '다양한 디자인 가능 / 균형형' },
    { id: 'thick', label: '굵다', interpretation: '무게감 필요 / 단단한 스타일 적합' },
  ];

  // 숱 옵션
  const densityOptions: { id: Density; label: string; interpretation: string }[] = [
    { id: 'low', label: '적다', interpretation: '풍성함 연출 필요 / 레이어 최소화' },
    { id: 'normal', label: '보통', interpretation: '다양한 레이어 가능 / 균형형' },
    { id: 'high', label: '많다', interpretation: '무게 제거 설계 필요 / 숱 조절 중요' },
  ];

  // 곱슬 정도 옵션
  const curlCoverageOptions: { id: CurlCoverage; label: string; interpretation: string }[] = [
    { id: 'none', label: '없음', interpretation: '스트레이트 유지 용이 / 자유로운 디자인' },
    { id: 'partial', label: '부분', interpretation: '앞머리/겉면 제어 설계 / 자연스러운 웨이브 추천' },
    { id: 'full', label: '전체', interpretation: '직선 디자인 어려움 / 곱슬 활용형 스타일 적합' },
  ];

  // 종합 해석 생성
  useEffect(() => {
    const interpretations: string[] = [];

    // 모질 타입 기반 해석
    if (hairType === 'wavy') {
      interpretations.push('자연스러운 질감 활용형');
      interpretations.push('과도한 직선 디자인은 유지력 낮음');
    } else if (hairType === 'curly') {
      interpretations.push('곱슬 활용형 디자인 권장');
      interpretations.push('수분 케어 필수');
    } else {
      interpretations.push('스트레이트 유지 우수');
      interpretations.push('다양한 스타일 가능');
    }

    // 손상도 기반 해석
    if (damageLevel === 'heavy' || damageLevel === 'extreme' || damageLevel === 'severe') {
      interpretations.push('트리트먼트 병행 필수');
      interpretations.push('컬러 시 명도 조절 위주 추천');
    } else if (damageLevel === 'light' || damageLevel === 'medium') {
      interpretations.push('컬러 시 명도 조절 위주 추천');
    }

    // 굵기/숱 기반 해석
    if (thickness === 'thin' || density === 'low') {
      interpretations.push('볼륨감 연출 디자인 추천');
    } else if (density === 'high') {
      interpretations.push('무게 제거 및 숱 조절 필요');
    }

    // 곱슬 정도 기반 해석
    if (curlCoverage === 'partial') {
      interpretations.push('앞머리 및 표면 제어 중요');
    } else if (curlCoverage === 'full') {
      interpretations.push('직선 스타일 유지 어려움');
    }

    setInterpretation(interpretations.slice(0, 4)); // 최대 4개
  }, [damageLevel, hairType, thickness, density, curlCoverage]);

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em] mb-3">
              모질 분석 및 스타일 해석
            </h2>
            <p className="text-sm text-[#999999]">
              현재 모발 상태를 기반으로 디자인 가능 범위를 설정합니다.
            </p>
          </motion.div>

          {/* 섹션 1 – 손상도 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                1
              </span>
              손상도
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {damageLevels.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDamageLevel(option.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    damageLevel === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {option.warning && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-red-500 text-white rounded-full p-1">
                        <AlertCircle className="w-3 h-3" strokeWidth={2} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center mb-2">
                    {damageLevel === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 설명 */}
            <div
              className={`rounded-xl p-4 border ${
                damageLevels.find((d) => d.id === damageLevel)?.warning
                  ? 'bg-red-50/50 border-red-100'
                  : 'bg-blue-50/50 border-blue-100'
              }`}
            >
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {damageLevels.find((d) => d.id === damageLevel)?.description}
              </p>
            </div>
          </motion.div>

          {/* 섹션 2 – 모질 상태 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                2
              </span>
              모질 상태
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {hairTypes.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setHairType(option.id)}
                  className={`rounded-xl p-4 border-2 transition-all ${
                    hairType === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {hairType === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {hairTypes.find((h) => h.id === hairType)?.interpretation}
              </p>
            </div>
          </motion.div>

          {/* 섹션 3 – 굵기 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                3
              </span>
              굵기
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {thicknessOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setThickness(option.id)}
                  className={`rounded-xl p-4 border-2 transition-all ${
                    thickness === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {thickness === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {thicknessOptions.find((t) => t.id === thickness)?.interpretation}
              </p>
            </div>
          </motion.div>

          {/* 섹션 4 – 숱 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                4
              </span>
              숱
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {densityOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDensity(option.id)}
                  className={`rounded-xl p-4 border-2 transition-all ${
                    density === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {density === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {densityOptions.find((d) => d.id === density)?.interpretation}
              </p>
            </div>
          </motion.div>

          {/* 섹션 5 – 곱슬 정도 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                5
              </span>
              곱슬 정도
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {curlCoverageOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setCurlCoverage(option.id)}
                  className={`rounded-xl p-4 border-2 transition-all ${
                    curlCoverage === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    {curlCoverage === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {curlCoverageOptions.find((c) => c.id === curlCoverage)?.interpretation}
              </p>
            </div>
          </motion.div>

          {/* 하단 자동 요약 박스 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-black text-white rounded-2xl p-6 mb-12"
          >
            <h3 className="text-xs tracking-[0.2em] uppercase font-light mb-4 opacity-70">
              모질 종합 해석
            </h3>

            <ul className="space-y-2">
              {interpretation.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                  <span className="text-sm font-light">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 하단 버튼 */}
          <NavigationButtons
            onBack={onBack}
            onNext={onNext}
            nextLabel="디자인 제안에 반영하기"
          />
        </div>
      </div>
    </div>
  );
}
