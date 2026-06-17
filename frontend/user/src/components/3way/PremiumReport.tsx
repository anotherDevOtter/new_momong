import { useState, cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { CycleData } from './NextDirection';
import { saveConsult } from '@/utils/3way-api';

interface ReportImageType {
  warmCool: 'W' | 'N' | 'C';
  softHard: 'S' | 'N' | 'H';
}
interface ReportRatios {
  vertical: string;
  face: string;
  midSection: string;
}

interface PremiumReportProps {
  onClose: () => void;
  customerName: string;
  consultDate: string;
  designerName: string;
  cycleData: CycleData | null;
  selectedCourse?: string;
  customerPhone?: string;
  // 얼굴 분석에서 도출된 이미지 타입 / 비율 (디자이너 수정 반영)
  imageType?: ReportImageType;
  ratios?: ReportRatios;
}

const TONE_LABEL: Record<'W' | 'N' | 'C', string> = { W: 'Warm', N: 'Neutral', C: 'Cool' };
const BALANCE_LABEL: Record<'S' | 'N' | 'H', string> = { S: 'Soft', N: 'Neutral', H: 'Hard' };

export function PremiumReport({
  onClose,
  customerName,
  consultDate,
  designerName,
  cycleData,
  selectedCourse,
  customerPhone,
  imageType = { warmCool: 'N', softHard: 'N' },
  ratios,
}: PremiumReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [editedDesignerName, setEditedDesignerName] = useState(designerName);

  // Q2: 코스별 노출 페이지 분기. 퍼스널컬러 페이지는 퍼스널컬러를 분석하는 코스에서만.
  const showPersonalColor = selectedCourse === '3way' || selectedCourse === '2way-personal';

  // 노출할 페이지를 순서대로 빌드 → 페이지 번호 / 인디케이터 / 네비게이션이 일관되게 동작
  const pages: React.ReactNode[] = [
    <CoverPage key="cover" pageNumber={0} customerName={customerName} consultDate={consultDate} designerName={editedDesignerName} onDesignerNameChange={setEditedDesignerName} />,
    <FaceStructurePage key="face-structure" pageNumber={0} ratios={ratios} />,
    <ImageAxisPage key="image-axis" pageNumber={0} imageType={imageType} />,
    ...(showPersonalColor ? [<PersonalColorPage key="personal-color" pageNumber={0} />] : []),
    <HairTexturePage key="hair-texture" pageNumber={0} />,
    <TodayDesignPage key="today-design" pageNumber={0} />,
    <ImageMovementPage key="image-movement" pageNumber={0} />,
    <DesignCycleMasterPlanPage key="design-cycle" pageNumber={0} cycleData={cycleData} />,
    <NextDirectionSummaryPage key="next-direction" pageNumber={0} />,
    <PersonalNotePage key="personal-note" pageNumber={0} designerName={editedDesignerName} />,
    <ClosingPage key="closing" pageNumber={0} />,
  ];
  const totalPages = pages.length;
  // 현재 페이지가 범위를 벗어나면 마지막으로 보정 (코스 전환 등 방어)
  const safePage = Math.min(currentPage, totalPages - 1);
  const activePage = pages[safePage];
  // 실제 노출 순번으로 페이지 번호 주입
  const activePageWithNumber = isValidElement(activePage)
    ? cloneElement(activePage as ReactElement<{ pageNumber: number }>, { pageNumber: safePage + 1 })
    : activePage;

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* 상단 툴바 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-light text-black tracking-wide">MERCI MOMONG</h2>
            <span className="text-xs text-gray-500 font-light">
              {safePage + 1} / {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('PDF 다운로드 기능은 서버 연동이 필요합니다.')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="PDF 다운로드"
            >
              <Download className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 페이지 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-3xl mx-auto py-8 px-6">
            <AnimatePresence mode="wait">
              {activePageWithNumber}
            </AnimatePresence>
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            {/* 이전 버튼 */}
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              <span className="text-sm font-light">이전</span>
            </button>

            {/* 페이지 인디케이터 */}
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === safePage ? 'bg-black w-6' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* 다음 버튼 */}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === totalPages - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-light">다음</span>
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 페이지 컴포넌트들
function CoverPage({ pageNumber, customerName, consultDate, designerName, onDesignerNameChange }: { pageNumber: number; customerName: string; consultDate: string; designerName: string; onDesignerNameChange: (name: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px] flex flex-col justify-between"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <div>
        <h1 className="text-3xl md:text-4xl font-light tracking-wider text-black mb-12">
          3WAY
          <br />
          HAIR REPORT
        </h1>

        <div className="space-y-3 text-sm font-light text-gray-700">
          <p>
            <span className="text-gray-500">고객명</span>
            <span className="ml-8 text-black">{customerName}</span>
          </p>
          <p>
            <span className="text-gray-500">상담일</span>
            <span className="ml-8 text-black">{consultDate}</span>
          </p>
          <p>
            <span className="text-gray-500">디자이너</span>
            <input
              type="text"
              value={designerName}
              onChange={(e) => onDesignerNameChange(e.target.value)}
              className="ml-6 text-black border-b border-gray-300 focus:outline-none focus:border-black"
            />
          </p>
        </div>
      </div>

      <div className="text-center border-t border-gray-200 pt-8">
        <p className="text-lg font-light tracking-[0.1em] text-black mb-4">BE YOURSELF</p>
        <p className="text-sm font-light text-gray-600">
          사람들이 자신의 아름다움을 발견하고 스스로를 사랑할 수 있도록 돕습니다.
        </p>
      </div>
    </motion.div>
  );
}

function FaceStructurePage({ pageNumber, ratios }: { pageNumber: number; ratios?: ReportRatios }) {
  const faceRatio = ratios?.face ?? '1 : 1.6';
  const verticalRatio = ratios?.vertical ?? '1 : 1 : 1';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        FACE STRUCTURE DIAGNOSIS
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* 시각화 영역 */}
        <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-48 h-64 border-2 border-gray-300 rounded-full mx-auto mb-4 relative">
              {/* 가로세로 비율 표시 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <p className="text-xs font-light text-gray-600">{faceRatio}</p>
              </div>
              {/* 상중하 구분선 */}
              <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-300"></div>
              <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-300"></div>
            </div>
            <p className="text-xs text-gray-500 font-light">얼굴 구조 시각화</p>
          </div>
        </div>

        {/* 수치 데이터 */}
        <div className="space-y-4">
          <DataRow label="얼굴 가로세로 비율" value={faceRatio} status="균형" />
          <DataRow label="상중하 비율" value={verticalRatio} status="표준" />
          <DataRow label="중안부 길이" value="32.5mm" status="보통" />
          <DataRow label="좌우 대칭" value="95%" status="우수" />
          <DataRow label="윤곽 강도" value="중간" status="안정" />
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          고객님의 얼굴 구조는 균형형 기반으로 안정적인 비율을 가지고 있습니다. 과도한 보완보다
          방향 설정이 중요합니다.
        </p>
      </div>
    </motion.div>
  );
}

function ImageAxisPage({ pageNumber, imageType = { warmCool: 'N', softHard: 'N' } }: { pageNumber: number; imageType?: ReportImageType }) {
  const toneLabel = TONE_LABEL[imageType.warmCool];
  const balanceLabel = BALANCE_LABEL[imageType.softHard];
  // 가로축 Soft(좌)~Hard(우), 세로축 Cool(상)~Warm(하)
  const posX = imageType.softHard === 'S' ? '25%' : imageType.softHard === 'H' ? '75%' : '50%';
  const posY = imageType.warmCool === 'C' ? '25%' : imageType.warmCool === 'W' ? '75%' : '50%';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        IMAGE AXIS POSITION
      </h2>

      {/* 좌표계 시각화 */}
      <div className="mb-10">
        <div className="bg-gray-50 rounded-xl p-8 flex items-center justify-center">
          <div className="relative w-80 h-80">
            {/* 가로축 */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300"></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-full pr-4">
              <p className="text-xs font-light text-gray-600">Soft</p>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-full pl-4">
              <p className="text-xs font-light text-gray-600">Hard</p>
            </div>

            {/* 세로축 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300"></div>
            <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full pb-4">
              <p className="text-xs font-light text-gray-600">Cool</p>
            </div>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full pt-4">
              <p className="text-xs font-light text-gray-600">Warm</p>
            </div>

            {/* 현재 위치 */}
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: posX, top: posY }}>
              <div className="w-4 h-4 bg-black rounded-full"></div>
              <p className="text-xs font-light text-black mt-2 whitespace-nowrap">
                {toneLabel} / {balanceLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-sm font-light text-gray-600">Tone Axis</span>
          <span className="text-sm font-light text-black">{toneLabel}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-sm font-light text-gray-600">Balance Axis</span>
          <span className="text-sm font-light text-black">{balanceLabel}</span>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          기본 이미지가 안정적이기 때문에 강한 이동보다 정교한 조율이 효과적입니다.
        </p>
      </div>
    </motion.div>
  );
}

function PersonalColorPage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        PERSONAL COLOR ANALYSIS
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <DataRow label="피부톤" value="Neutral Warm" status="—" />
          <DataRow label="명도" value="중간" status="—" />
          <DataRow label="채도" value="중저" status="—" />
          <DataRow label="대비" value="낮음" status="—" />
        </div>

        {/* 컬러 팔레트 */}
        <div>
          <p className="text-xs text-gray-500 font-light mb-3">추천 컬러 팔레트</p>
          <div className="grid grid-cols-5 gap-2">
            <div className="aspect-square bg-gray-700 rounded-lg"></div>
            <div className="aspect-square bg-gray-600 rounded-lg"></div>
            <div className="aspect-square bg-gray-500 rounded-lg"></div>
            <div className="aspect-square bg-gray-400 rounded-lg"></div>
            <div className="aspect-square bg-gray-300 rounded-lg"></div>
            <div className="aspect-square bg-amber-800 rounded-lg"></div>
            <div className="aspect-square bg-amber-700 rounded-lg"></div>
            <div className="aspect-square bg-amber-600 rounded-lg"></div>
            <div className="aspect-square bg-amber-500 rounded-lg"></div>
            <div className="aspect-square bg-amber-400 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <h3 className="text-sm font-light text-black mb-4">추천 컬러 전략</h3>
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>
          <p className="text-sm font-light text-gray-700">명도 중심 조절</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>
          <p className="text-sm font-light text-gray-700">과한 채도 변화 지양</p>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          명도 조절을 통한 이미지 조율이 가장 효과적입니다. 과도한 채도 변화는 피부톤과 부조화를
          일으킬 수 있습니다.
        </p>
      </div>
    </motion.div>
  );
}

function HairTexturePage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        HAIR TEXTURE & LIMITATION
      </h2>

      <div className="space-y-6 mb-10">
        <div>
          <h3 className="text-sm font-light text-black mb-4">모질 분석</h3>
          <div className="space-y-3">
            <DataRow label="손상도" value="약손상" status="안정" />
            <DataRow label="모질 상태" value="반곱슬" status="—" />
            <DataRow label="굵기" value="보통" status="—" />
            <DataRow label="숱" value="많다" status="주의" />
            <DataRow label="곱슬 정도" value="부분" status="—" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-light text-black mb-4">시술 가능 범위</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-light text-gray-700">자연스러운 웨이브 펌</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-light text-gray-700">명도 조절 컬러</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm font-light text-gray-700">스트레이트 펌 (유지력 낮음)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm font-light text-gray-700">강한 탈색 (손상 위험)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          직선 유지력은 낮으나 자연스러운 S계열 디자인은 안정적입니다. 숱이 많은 편이므로 무게
          제거 설계가 중요합니다.
        </p>
      </div>
    </motion.div>
  );
}

function TodayDesignPage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        TODAY DESIGN ARCHITECTURE
      </h2>

      <div className="space-y-8">
        <DesignItem
          label="길이"
          value="쇄골"
          explanation="쇄골 길이는 현재 균형을 무너뜨리지 않으면서 이미지를 선명하게 만드는 지점입니다."
        />
        <DesignItem
          label="앞머리"
          value="시스루"
          explanation="Soft 요소를 추가하면서도 과하지 않은 자연스러운 부드러움을 만듭니다."
        />
        <DesignItem
          label="컬"
          value="C컬"
          explanation="안정감과 단정함을 유지하면서 자연스러운 볼륨을 만들어냅니다."
        />
        <DesignItem
          label="컬러"
          value="톤다운"
          explanation="명도 조절을 통해 이미지를 정리하고 세련됨을 강화합니다."
        />
      </div>

      <div className="mt-10 bg-black text-white rounded-xl p-6">
        <p className="text-sm font-light leading-relaxed">
          오늘의 디자인은 과도한 변화가 아닌, 고객님의 본래 이미지를 명확하게 만드는 정교한
          조율입니다.
        </p>
      </div>
    </motion.div>
  );
}

function ImageMovementPage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        IMAGE SHIFT PLAN
      </h2>

      {/* 이동 범위 시각화 */}
      <div className="mb-10">
        <div className="bg-gray-50 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full mx-auto mb-2"></div>
              <p className="text-xs font-light text-gray-600">현재</p>
              <p className="text-xs font-light text-black">Neutral</p>
            </div>

            <div className="flex-1 mx-4">
              <div className="relative h-px bg-gray-300">
                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                  <div className="w-full h-1 bg-gradient-to-r from-black via-gray-400 to-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <p className="text-xs font-light text-gray-600">가능 범위</p>
              <p className="text-xs font-light text-black">Chic</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-light">
              1
            </div>
            <h3 className="text-sm font-light text-black">안정 유지</h3>
          </div>
          <p className="text-sm font-light text-gray-700 ml-9">
            현재 디자인 유지 / 소폭 조율만 진행
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-light">
              2
            </div>
            <h3 className="text-sm font-light text-black">소폭 확장</h3>
          </div>
          <p className="text-sm font-light text-gray-700 ml-9">
            길이 조정 또는 컬러 명도 변화로 Fresh 요소 추가
          </p>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-light">
              3
            </div>
            <h3 className="text-sm font-light text-black">이미지 전환</h3>
          </div>
          <p className="text-sm font-light text-gray-700 ml-9">
            Neutral → Chic 방향 이동 시 직선 기반 + 명도 대비 필요
          </p>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          이미지 이동은 단계적으로 진행하는 것이 안정적입니다. 급격한 변화보다 방향성을 유지한
          확장이 효과적입니다.
        </p>
      </div>
    </motion.div>
  );
}

function PersonalNotePage({ pageNumber, designerName }: { pageNumber: number; designerName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        PERSONAL BRAND NOTE
      </h2>

      <div className="space-y-6 mb-10">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          고객님은 구조적으로 균형이 좋은 타입입니다.
        </p>

        <p className="text-sm font-light text-gray-700 leading-relaxed">
          강한 변화를 주기보다 정교한 방향 설정이 더 큰 차이를 만듭니다.
        </p>

        <p className="text-sm font-light text-gray-700 leading-relaxed">
          이 설계는 단기 트렌드가 아니라 고객님의 고유 이미지를 기준으로 합니다.
        </p>

        <p className="text-sm font-light text-gray-700 leading-relaxed">
          모발 건강과 이미지 방향을 함께 고려한 장기 플랜으로, 매 방문마다 상태를 점검하며
          조율해나갈 것입니다.
        </p>
      </div>

      {/* AFTER NOTE 추가 문구 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
        <p className="text-sm font-light text-gray-700 leading-relaxed mb-3">
          본 디자인은 단발적 시술이 아닌 단계적 이미지 설계 플랜에 따라 진행됩니다.
        </p>
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          설계된 방문 사이클에 따라 이미지 완성도가 높아집니다.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <p className="text-xs text-gray-500 font-light mb-2">Designer</p>
        <p className="text-base font-light text-black">{designerName}</p>
      </div>
    </motion.div>
  );
}

function ClosingPage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px] flex flex-col items-center justify-center text-center"
    >
      {/* 페이지 번호 */}
      <div className="absolute top-12 right-12">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h1 className="text-4xl font-light tracking-[0.15em] text-black mb-12">MERCI MOMONG</h1>

      <p className="text-sm font-light text-gray-700 leading-relaxed max-w-md">
        모든 사람들이 자신의 아름다움을 발견하고
        <br />
        스스로 사랑할 수 있도록 돕습니다.
      </p>

      <div className="mt-16 pt-8 border-t border-gray-200 w-full max-w-md">
        <p className="text-xs text-gray-400 font-light">
          © 2024 MERCI MOMONG. All rights reserved.
        </p>
      </div>
    </motion.div>
  );
}

// 헬퍼 컴포넌트
function DataRow({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-200">
      <span className="text-sm font-light text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-light text-black">{value}</span>
        {status !== '—' && (
          <span className="text-xs font-light text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}

function DesignItem({ label, value, explanation }: { label: string; value: string; explanation: string }) {
  return (
    <div className="pb-6 border-b border-gray-200 last:border-0">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-light text-gray-600">{label}</span>
        <span className="text-base font-light text-black">{value}</span>
      </div>
      <p className="text-sm font-light text-gray-700 leading-relaxed">{explanation}</p>
    </div>
  );
}

// DESIGN CYCLE MASTER PLAN 페이지
function DesignCycleMasterPlanPage({ pageNumber, cycleData }: { pageNumber: number; cycleData: CycleData | null }) {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const serviceNames: Record<string, string> = {
    cut: 'Cut',
    perm: 'Perm',
    color: 'Color',
    clinic: 'Clinic',
  };

  // 전략 해석 생성
  const generateStrategy = () => {
    if (!cycleData || cycleData.selectedMonths.length === 0) {
      return '단계적 이미지 설계를 통해 안정적인 변화를 진행합니다.';
    }

    const hasClinic = cycleData.selectedMonths.some(m => m.services.includes('clinic'));
    const hasColor = cycleData.selectedMonths.some(m => m.services.includes('color'));
    const hasPerm = cycleData.selectedMonths.some(m => m.services.includes('perm'));

    if (hasClinic && hasColor) {
      return '현재 손상도를 고려하여 1회차는 회복 중심 설계, 이후 단계는 형태 조정, 최종적으로 컬러 확장 전략으로 계획되었습니다.';
    } else if (hasPerm && hasColor) {
      return '안정 유지 전략 후 볼륨 확장 → 이미지 이동 순서로 단계적 설계를 진행합니다.';
    } else if (hasClinic) {
      return '회복 중심 전략으로 모발 건강을 최우선으로 설계되었습니다.';
    } else {
      return '단계적 이미지 설계 플랜에 따라 점진적인 변화를 진행합니다.';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-3 pb-4 border-b border-gray-200">
        DESIGN CYCLE MASTER PLAN
      </h2>
      <p className="text-sm text-gray-600 font-light mb-10">단계적 이미지 설계를 위한 방문 전략</p>

      {/* 타임라인 */}
      <div className="space-y-6 mb-10">
        {cycleData && cycleData.selectedMonths.length > 0 ? (
          cycleData.selectedMonths.map((month, index) => {
            const services = month.services.length > 0 
              ? month.services.map(s => serviceNames[s]).join(' + ')
              : '미정';
            return (
              <div key={month.month} className={`border-l-2 pl-6 ${index === 0 ? 'border-black' : 'border-gray-300'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-gray-500 font-light">{index + 1}회차</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-500 font-light">{monthNames[month.month - 1]}</span>
                </div>
                <h3 className="text-base font-light text-black mb-2">{services}</h3>
                {month.memo && (
                  <p className="text-sm font-light text-gray-600 mt-2 italic">
                    {month.memo}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="border-l-2 border-gray-300 pl-6">
            <p className="text-sm text-gray-500 font-light">
              사이클 계획이 설정되지 않았습니다. 상담을 통해 맞춤 플랜을 설계합니다.
            </p>
          </div>
        )}
      </div>

      <div className="bg-black text-white rounded-xl p-6">
        <p className="text-sm font-light leading-relaxed">
          {generateStrategy()}
        </p>
      </div>
    </motion.div>
  );
}

// NEXT DIRECTION SUMMARY 페이지
function NextDirectionSummaryPage({ pageNumber }: { pageNumber: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber}</span>
      </div>
      
      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        NEXT DIRECTION SUMMARY
      </h2>

      <div className="space-y-6 mb-10">
        <div>
          <h3 className="text-base font-light text-black mb-3">다음 방문 시 권장 방향</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>
              <p className="text-sm font-light text-gray-700">길이 유지 또는 소폭 조정</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>
              <p className="text-sm font-light text-gray-700">볼륨 조정을 통한 Soft 방향 확장 가능</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-black rounded-full mt-2"></div>
              <p className="text-sm font-light text-gray-700">손상 회복 후 컬러 변화 고려</p>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-base font-light text-black mb-3">이미지 이동 가능 범위</h3>
          <p className="text-sm font-light text-gray-700 leading-relaxed">
            현재 Neutral 기반에서 Soft 또는 Chic 방향으로 확장 가능합니다. 급격한 변화보다는
            단계적 조율이 안정적입니다.
          </p>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          디자인은 고정되지 않으며 얼굴, 이미지, 컨디션에 따라 매 방문마다 최적의 방향으로
          조율됩니다.
        </p>
      </div>
    </motion.div>
  );
}