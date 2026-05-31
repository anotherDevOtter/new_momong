import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, TrendingUp, Info } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';

interface NextDirectionProps {
  onBack: () => void;
  onNext: () => void;
  onCycleDataChange?: (data: CycleData) => void;
}

type DirectionOption = 'length' | 'color' | 'bangs' | 'perm' | 'recovery' | 'image';

interface DirectionItem {
  id: DirectionOption;
  label: string;
  sublabel: string;
  impact: number; // 변화 강도 (1-4)
}

export type ServiceType = 'cut' | 'perm' | 'color' | 'clinic';

export interface MonthCycleData {
  month: number;
  services: ServiceType[];
  memo: string;
}

export interface CycleData {
  selectedMonths: MonthCycleData[];
}

export function NextDirection({ onBack, onNext, onCycleDataChange }: NextDirectionProps) {
  const [selectedDirections, setSelectedDirections] = useState<DirectionOption[]>([]);
  const [changeLevel, setChangeLevel] = useState<number>(0);
  const [cycleData, setCycleData] = useState<MonthCycleData[]>([]);

  const directions: DirectionItem[] = [
    { id: 'length', label: '길이 변화', sublabel: '(롱 / 미디움 / 단발 / 숏)', impact: 3 },
    { id: 'color', label: '컬러 변화', sublabel: '(톤업 / 톤다운 / 탈색 / 특수컬러)', impact: 2 },
    { id: 'bangs', label: '앞머리 디자인 변경', sublabel: '', impact: 2 },
    { id: 'perm', label: '펌 / 볼륨 추가', sublabel: '', impact: 3 },
    { id: 'recovery', label: '손상도 회복 후 디자인 확장', sublabel: '', impact: 1 },
    { id: 'image', label: '이미지 이동 컨설팅', sublabel: '', impact: 4 },
  ];

  // 선택 토글
  const toggleDirection = (id: DirectionOption) => {
    if (selectedDirections.includes(id)) {
      setSelectedDirections(selectedDirections.filter((item) => item !== id));
    } else {
      setSelectedDirections([...selectedDirections, id]);
    }
  };

  // 변화 강도 계산
  useEffect(() => {
    if (selectedDirections.length === 0) {
      setChangeLevel(0);
    } else {
      const totalImpact = selectedDirections.reduce((sum, id) => {
        const direction = directions.find((d) => d.id === id);
        return sum + (direction?.impact || 0);
      }, 0);
      const avgImpact = totalImpact / selectedDirections.length;
      setChangeLevel(Math.min(4, Math.ceil(avgImpact)));
    }
  }, [selectedDirections]);

  // 변화 강도 레벨
  const changeLevels = [
    { level: 1, label: '안정 유지', color: 'bg-blue-500' },
    { level: 2, label: '소폭 변화', color: 'bg-green-500' },
    { level: 3, label: '중간 변화', color: 'bg-yellow-500' },
    { level: 4, label: '이미지 전환', color: 'bg-red-500' },
  ];

  // 월별 서비스 토글
  const toggleMonthService = (month: number, service: ServiceType) => {
    const existingMonth = cycleData.find(m => m.month === month);
    
    if (existingMonth) {
      if (existingMonth.services.includes(service)) {
        // 서비스 제거
        const updatedServices = existingMonth.services.filter(s => s !== service);
        if (updatedServices.length === 0 && !existingMonth.memo) {
          // 서비스도 없고 메모도 없으면 월 전체 제거
          const newData = cycleData.filter(m => m.month !== month);
          setCycleData(newData);
          onCycleDataChange?.({ selectedMonths: newData });
        } else {
          // 서비스만 업데이트
          const newData = cycleData.map(m => 
            m.month === month ? { ...m, services: updatedServices } : m
          );
          setCycleData(newData);
          onCycleDataChange?.({ selectedMonths: newData });
        }
      } else {
        // 서비스 추가
        const newData = cycleData.map(m => 
          m.month === month ? { ...m, services: [...m.services, service] } : m
        );
        setCycleData(newData);
        onCycleDataChange?.({ selectedMonths: newData });
      }
    } else {
      // 새 월 추가
      const newData = [...cycleData, { month, services: [service], memo: '' }].sort((a, b) => a.month - b.month);
      setCycleData(newData);
      onCycleDataChange?.({ selectedMonths: newData });
    }
  };

  // 월별 메모 업데이트
  const updateMonthMemo = (month: number, memo: string) => {
    const existingMonth = cycleData.find(m => m.month === month);
    
    if (existingMonth) {
      // 기존 월 메모 업데이트
      const newData = cycleData.map(m => 
        m.month === month ? { ...m, memo } : m
      ).filter(m => m.services.length > 0 || m.memo.trim() !== '');
      setCycleData(newData);
      onCycleDataChange?.({ selectedMonths: newData });
    } else if (memo.trim() !== '') {
      // 새 월 추가 (메모만 있는 경우)
      const newData = [...cycleData, { month, services: [], memo }].sort((a, b) => a.month - b.month);
      setCycleData(newData);
      onCycleDataChange?.({ selectedMonths: newData });
    }
  };

  // 사이클 요약 생성
  const generateCycleSummary = () => {
    if (cycleData.length === 0) {
      return '아직 설계된 사이클이 없습니다.';
    }

    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const serviceNames: Record<ServiceType, string> = {
      cut: 'Cut',
      perm: 'Perm',
      color: 'Color',
      clinic: 'Clinic',
    };

    const cycles = cycleData.map((m, idx) => {
      const services = m.services.map(s => serviceNames[s]).join(' + ');
      return `${idx + 1}회차 (${monthNames[m.month - 1]}): ${services}`;
    }).join('\n');

    // 전략 해석
    let strategy = '';
    const hasClinic = cycleData.some(m => m.services.includes('clinic'));
    const hasColor = cycleData.some(m => m.services.includes('color'));
    const hasPerm = cycleData.some(m => m.services.includes('perm'));

    if (hasClinic && hasColor) {
      strategy = '손상 회복 후 컬러 확장 전략으로 설계되었습니다.';
    } else if (hasPerm && hasColor) {
      strategy = '형태 조정 후 컬러 변화 전략으로 계획되었습니다.';
    } else if (hasClinic) {
      strategy = '회복 중심 설계로 안정적인 전략입니다.';
    } else {
      strategy = '단계적 이미지 설계 전략으로 진행됩니다.';
    }

    return `${cycleData.length}개월 설계 플랜이 설정되었습니다.\n\n${cycles}\n\n${strategy}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em] mb-3">
              다음 디자인 방향
            </h2>
            <p className="text-sm text-[#999999] leading-relaxed">
              다음 디자인 이동 방향을 선택해주세요.
              <br />
              (복수 선택 가능)
            </p>
          </motion.div>

          {/* SECTION 1 – 방향 선택 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-3 mb-10"
          >
            {directions.map((direction, index) => (
              <motion.button
                key={direction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                onClick={() => toggleDirection(direction.id)}
                className={`w-full rounded-2xl p-5 border-2 transition-all duration-300 ${
                  selectedDirections.includes(direction.id)
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* 체크박스 영역 */}
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedDirections.includes(direction.id)
                        ? 'border-black bg-black'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selectedDirections.includes(direction.id) && (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="flex-1 text-left">
                    <p className="text-base font-light text-black mb-0.5">{direction.label}</p>
                    {direction.sublabel && (
                      <p className="text-xs text-gray-500 font-light">{direction.sublabel}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* SECTION 2 – 자동 제안 방향 요약 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <h3 className="text-sm font-light tracking-wide text-black">추천 이동 전략</h3>
            </div>

            <div className="space-y-3 text-sm font-light text-gray-700 leading-relaxed">
              <p>현재 이미지 성향은 Natural 중심입니다.</p>
              <p>
                다음 방문 시 길이 조정 또는 볼륨 추가를 통해 Soft 방향 확장이 가능합니다.
              </p>
              <p>손상 회복 후 컬러 확장도 고려할 수 있습니다.</p>
            </div>
          </motion.div>

          {/* SECTION 3 – 이동 난이도 가이드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 mb-8"
          >
            <h3 className="text-sm font-light tracking-wide text-black mb-4">이동 난이도 가이드</h3>

            {/* 인디케이터 바 */}
            <div className="space-y-3 mb-4">
              {changeLevels.map((level) => (
                <div key={level.level} className="flex items-center gap-3">
                  {/* 바 */}
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${level.color} ${
                        changeLevel >= level.level ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>

                  {/* 레이블 */}
                  <span
                    className={`text-xs font-light w-20 transition-colors ${
                      changeLevel >= level.level ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    {level.label}
                  </span>
                </div>
              ))}
            </div>

            {/* 현재 선택 상태 표시 */}
            {selectedDirections.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 font-light">
                  선택한 방향: <span className="text-black">{selectedDirections.length}개 항목</span>
                </p>
                <p className="text-xs text-gray-600 font-light mt-1">
                  예상 변화 강도:{' '}
                  <span className="text-black">
                    {changeLevels.find((l) => l.level === changeLevel)?.label || '안정 유지'}
                  </span>
                </p>
              </div>
            )}
          </motion.div>

          {/* SECTION 4 – DESIGN CYCLE GUIDE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-lg font-light tracking-wide text-black mb-4">DESIGN CYCLE GUIDE</h2>
            <p className="text-sm text-gray-600 font-light mb-6">
              월별 시술 계획을 설정하세요. (다중 선택 가능)
            </p>

            {/* 월별 카드 그리드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                const monthData = cycleData.find(m => m.month === month);
                const isSelected = !!monthData;
                
                return (
                  <div
                    key={month}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isSelected ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-light text-black mb-3">{month}월</p>
                    
                    <div className="space-y-2 mb-3">
                      {(['cut', 'perm', 'color', 'clinic'] as ServiceType[]).map((service) => (
                        <button
                          key={service}
                          onClick={() => toggleMonthService(month, service)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-light transition-all ${
                            monthData?.services.includes(service)
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {service === 'cut' && 'Cut'}
                          {service === 'perm' && 'Perm'}
                          {service === 'color' && 'Color'}
                          {service === 'clinic' && 'Clinic'}
                        </button>
                      ))}
                    </div>

                    {/* 메모 입력 필드 */}
                    <textarea
                      value={monthData?.memo || ''}
                      onChange={(e) => updateMonthMemo(month, e.target.value)}
                      placeholder="메모..."
                      className="w-full px-3 py-2 text-xs font-light border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 resize-none"
                      rows={2}
                    />
                  </div>
                );
              })}
            </div>

            {/* CYCLE PLAN SUMMARY */}
            {cycleData.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-light tracking-wide text-black mb-3">
                  CYCLE PLAN SUMMARY
                </h3>
                <div className="text-sm font-light text-gray-700 leading-relaxed whitespace-pre-line">
                  {generateCycleSummary()}
                </div>
              </div>
            )}
          </motion.div>

          {/* SECTION 5 – 상담 멘트 안내 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-8"
          >
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <div>
                <p className="text-xs text-gray-500 font-light mb-1">디자이너 참고용</p>
                <p className="text-sm text-gray-700 font-light leading-relaxed">
                  현재 방향을 유지하면서 조금씩 이동하는 전략이 적합합니다. 과도한 변화보다는
                  단계적 확장을 권장합니다.
                </p>
              </div>
            </div>
          </motion.div>

          {/* 하단 버튼 */}
          <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="다음" />
        </div>
      </div>

      {/* 하단 고정 안내 문구 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4"
      >
        <p className="text-xs text-center text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
          디자인은 고정되지 않으며 얼굴 · 이미지 · 컨디션에 따라
          <br />
          매 방문마다 FIT은 달라질 수 있습니다.
        </p>
      </motion.div>
    </div>
  );
}
