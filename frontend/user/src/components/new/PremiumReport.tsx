import { useState, useRef, isValidElement, cloneElement, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { CycleData, DIRECTION_ITEMS, CHANGE_LEVELS } from './NextDirection';
import { TEXTURE_LABELS, TEXTURE_NOTES, type HairTextureData } from '@/components/3way/HairTextureAnalysis';
import { FORM, PROP, IMAP, dominantIdx, dominantOf } from './faceAnalysisData';
import {
  STYLE_AXES, styleOptionOf, type StyleAxis, type HairConsultingData,
  CONDITION_AXES, conditionOptionOf, DAMAGE_DETAIL, CONDITION_SECTIONS,
} from './HairConsulting';
// 저장은 상위 page.tsx 의 saveConsult() 가 담당한다. 시안의 Supabase 헬퍼는 쓰지 않는다.

interface PremiumReportProps {
  onClose: () => void;
  customerName: string;
  consultDate: string;
  designerName: string;
  cycleData: CycleData | null;
  selectedCourse?: string;
  customerPhone?: string;
  /** 헤어컨설팅에서 고른 스타일 5축. 없으면 리포트에 '—' 로 나온다. */
  hairStyle?: HairConsultingData['style'] | null;
  /** 헤어컨설팅에서 고른 모질 4축. (지금 리포트는 아래 hairTexture 를 쓴다) */
  hairCondition?: HairConsultingData['condition'] | null;
  /** 헤어질감 화면에서 고른 모질 5항목 — 시안 리포트의 모질 페이지가 이 값을 쓴다 */
  hairTexture?: HairTextureData | null;
  /** 얼굴 항목별 실측 표시값 (Python 이 준 값). 없는 항목은 리포트에 '미측정'. */
  faceValues?: Record<string, string>;
  /** 얼굴 항목별 최종 위치값 0~1 — 디자이너가 화면에서 조정한 결과가 반영된 값. */
  facePosMap?: Record<string, number>;
  /** 항목별 실측 숫자 (비율 등). 표기를 직접 만들 때 쓴다. */
  faceNumbers?: Record<string, number>;
  /** 헤어컨설팅 이미지맵에서 디자이너가 고른 목표 이미지타입(추구미). 안 골랐으면 null. */
  hairTargetType?: { en: string; ko: string } | null;
}

/** 표지에 인쇄할 코스 이름 */
const COURSE_TITLE: Record<string, string> = {
  '1way': '1WAY',
  'new': '1WAY',
  '2way-personal': '2WAY',
  '2way-skeleton': '2WAY',
  '3way': '3WAY',
};

export function PremiumReport({
  onClose,
  customerName,
  consultDate,
  designerName,
  cycleData,
  selectedCourse,
  hairStyle,
  hairCondition,
  hairTexture,
  faceValues,
  facePosMap,
  faceNumbers,
  hairTargetType,
  customerPhone,
}: PremiumReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [editedDesignerName, setEditedDesignerName] = useState(designerName);

  // 퍼스널컬러는 그 축을 진단하는 코스에서만 나온다.
  // 1WAY(이식용 'new' 포함) 는 얼굴 한 축만 보므로 이 페이지 자체가 없어야 한다 —
  // 예전에는 항상 껴 있어서, 진단하지 않은 피부톤·팔레트가 리포트에 인쇄됐다.
  const showPersonalColor = selectedCourse === '3way' || selectedCourse === '2way-personal';

  // 노출할 페이지를 순서대로 만든다 → 페이지 번호·인디케이터·네비게이션이 저절로 맞는다.
  const pages: React.ReactNode[] = [
    <CoverPage key="cover" pageNumber={0} totalPages={0} customerName={customerName} consultDate={consultDate} designerName={editedDesignerName} onDesignerNameChange={setEditedDesignerName} courseLabel={COURSE_TITLE[selectedCourse ?? ""] ?? "1WAY"} />,
    <FaceStructurePage key="face-structure" pageNumber={0} totalPages={0} values={faceValues ?? {}} posMap={facePosMap ?? {}} numbers={faceNumbers ?? {}} />,
    <ImageAxisPage key="image-axis" pageNumber={0} totalPages={0} posMap={facePosMap ?? {}} />,
    ...(showPersonalColor ? [<PersonalColorPage key="personal-color" pageNumber={0} totalPages={0} />] : []),
    <HairTexturePage key="hair-texture" pageNumber={0} totalPages={0} texture={hairTexture ?? null} />,
    <TodayDesignPage key="today-design" pageNumber={0} totalPages={0} style={hairStyle ?? null} />,
    <ImageMovementPage key="image-movement" pageNumber={0} totalPages={0} posMap={facePosMap ?? {}} target={hairTargetType ?? null} directions={cycleData?.directions ?? []} />,
    <DesignCycleMasterPlanPage key="design-cycle" pageNumber={0} totalPages={0} cycleData={cycleData} />,
    <NextDirectionSummaryPage key="next-direction" pageNumber={0} totalPages={0} cycleData={cycleData} />,
    <PersonalNotePage key="personal-note" pageNumber={0} totalPages={0} designerName={editedDesignerName} />,
    <ClosingPage key="closing" pageNumber={0} totalPages={0} />,
  ];
  const totalPages = pages.length;
  // 페이지 수가 줄어드는 경우를 대비한 방어
  const safePage = Math.min(currentPage, totalPages - 1);
  const active = pages[safePage];
  // 실제 노출 순번을 주입한다 (위 배열의 0 은 자리표시용)
  const activePage = isValidElement(active)
    ? cloneElement(active as ReactElement<{ pageNumber: number; totalPages: number }>, { pageNumber: safePage + 1, totalPages })
    : active;

  // ── PDF 저장 ──────────────────────────────────────────────────────
  // 화면 밖에 10장을 한 번에 그려 놓고 장마다 캡쳐해서 PDF 로 묶는다.
  // (한 장씩 넘기며 캡쳐하면 전환 애니메이션 때문에 반쯤 그려진 화면이 찍힌다)
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);

  const handleDownloadPdf = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      // 숨은 영역이 그려지고 애니메이션이 끝날 때까지 기다린다
      await new Promise((r) => setTimeout(r, 600));
      const root = printRef.current;
      if (!root) return;

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas-pro'),
      ]);

      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const nodes = Array.from(root.children) as HTMLElement[];

      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#FFFFFF', logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.92);
        // 가로를 페이지에 맞추고, 세로가 넘치면 세로 기준으로 다시 맞춘다
        let w = pw;
        let h = (canvas.height * w) / canvas.width;
        if (h > ph) { h = ph; w = (canvas.width * h) / canvas.height; }
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
      }

      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`${customerName || '고객'}_이미지설계리포트_${today}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF 를 만들지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPrinting(false);
    }
  };

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
              onClick={handleDownloadPdf}
              disabled={printing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
              title="PDF 다운로드"
            >
              <Download className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
            {printing && <span className="text-xs text-gray-500 font-light">PDF 만드는 중…</span>}
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
              {activePage}
            </AnimatePresence>

            {/* PDF 캡쳐용 — 화면 밖에서 10장을 한 번에 그린다 */}
            {printing && (
              <div
                ref={printRef}
                style={{
                  position: 'fixed', left: -10000, top: 0, width: 794,
                  // 캡쳐 전용 폰트 고정 — 가변폰트(Pretendard Variable)는 캔버스가 글자 폭을 다르게 재서
                  // '맵 에 서 4 칸' 처럼 글자 사이가 벌어진 채로 PDF 에 박힌다.
                  fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
                  letterSpacing: 'normal',
                }}
              >
                {pages.map((pg, i) =>
                  isValidElement(pg)
                    ? cloneElement(pg as ReactElement<{ pageNumber: number; totalPages: number }>, {
                        key: `print-${i}`, pageNumber: i + 1, totalPages,
                      })
                    : pg,
                )}
              </div>
            )}
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

            {/* 다음 / 마지막 장에서는 완료 — 누르면 리포트를 닫고 완료 화면으로 간다 */}
            {safePage === totalPages - 1 ? (
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#111111] text-white hover:bg-[#2A2A2A] transition-colors"
              >
                <span className="text-sm font-light">완료</span>
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            ) : (
              <button
                onClick={nextPage}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-black hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-light">다음</span>
                <ChevronRight className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 페이지 컴포넌트들
function CoverPage({ pageNumber, totalPages, customerName, consultDate, designerName, onDesignerNameChange, courseLabel }: { pageNumber: number; totalPages: number; customerName: string; consultDate: string; designerName: string; onDesignerNameChange: (name: string) => void; courseLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px] flex flex-col justify-between"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>
      
      <div>
        <h1 className="text-3xl md:text-4xl font-light tracking-wider text-black mb-12">
          {/* 시안 오타(HIAR)를 고쳤고, 코스 이름도 실제 값으로 (1WAY 인데 3WAY 라고 인쇄됐다) */}
          {courseLabel}
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

function FaceStructurePage({ pageNumber, totalPages, values, posMap, numbers }: { pageNumber: number; totalPages: number; values: Record<string, string>; posMap: Record<string, number>; numbers: Record<string, number> }) {
  // 시안이 정한 5항목을 그대로 쓴다. 값은 실측에서 가져오고, 우리 분석에 모듈이 없는 항목은 '미측정'.
  //   얼굴 가로세로 비율 ← SNH 2 (얼굴 길이 = 세로/가로)
  //   중안부 길이       ← SNH 11 (중안부)
  //   윤곽 강도         ← WNC 2 (페이스라인)
  //   상중하 비율 · 좌우 대칭 ← 대응 모듈 없음 (docs/QUESTIONS.md C2)
  const band = (id: string, l: string, mid: string, r: string) => {
    const pos = posMap[id];
    if (pos == null) return '—';
    return pos < 0.33 ? l : pos > 0.67 ? r : mid;
  };

  // 수치가 없는 항목은 범위(밴드)로 적는다 — 등급만 나오는 모듈이 있어서다.
  // 비율은 '1 : n' 으로 적는다 (분석이 주는 값은 세로/가로 배수다)
  const ratio = (id: string) => {
    const v = numbers[id];
    return v != null ? `1 : ${v.toFixed(2)}` : '미측정';
  };

  const rows = [
    {
      // SNH 2 '얼굴 길이' — 세로/가로 배수
      label: '얼굴 가로세로 비율',
      value: ratio('facelen'),
      status: band('facelen', '짧음', '표준', '김'),
    },
    {
      // 이목구비 화면의 '상중하안부 비율' 과 같은 값 (SNH 11) — 여기서는 범위로 적는다
      label: '상중하 비율',
      value: band('thirds', '상안부 우세', '균형', '하안부 우세'),
      status: '—',
    },
    {
      // 같은 SNH 11 의 실측 수치. 분석이 주는 건 길이(mm)가 아니라 비율이다 (QUESTIONS.md C4)
      label: '중안부 비율',
      value: ratio('thirds'),
      status: band('thirds', '짧음', '표준', '김'),
    },
    {
      label: '좌우 대칭',
      value: '미측정',
      status: '—',
    },
    {
      // WNC 2 '턱 각도' — 수치 없이 등급만 나온다. 강도로 옮겨 적는다 (둥글수록 약함, 각질수록 강함)
      label: '윤곽 강도',
      value: band('faceline', '약함', '중간', '강함'),
      status: posMap['faceline'] == null ? '—' : band('faceline', '부드러움', '안정', '뚜렷'),
    },
  ];

  const measured = rows.filter((r) => r.value !== '미측정').length;
  const faceRatio = values['facelen'] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>

      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        FACE STRUCTURE DIAGNOSIS
      </h2>

      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* 시각화 영역 */}
        <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-48 h-64 border-2 border-gray-300 rounded-full mx-auto mb-4 relative">
              {/* 세로/가로 비율 — 실측값 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <p className="text-xs font-light text-gray-600">{faceRatio ?? '—'}</p>
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
          {rows.map((r) => (
            <DataRow key={r.label} label={r.label} value={r.value} status={r.status} />
          ))}
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          {measured > 0
            ? '위 수치는 촬영한 사진에서 측정한 값입니다. 수치가 나오지 않는 항목은 범위로 적었고, 좌우 대칭은 현재 자동 측정 항목이 아닙니다.'
            : '이번 컨설팅에서는 얼굴 실측값이 기록되지 않았습니다. 촬영을 건너뛴 경우 이 페이지는 비어 있습니다.'}
        </p>
      </div>
    </motion.div>
  );
}

function ImageAxisPage({ pageNumber, totalPages, posMap }: { pageNumber: number; totalPages: number; posMap: Record<string, number> }) {
  // 이미지맵이 판정한 고유미 좌표를 그대로 옮긴다.
  // 예전에는 점이 늘 정중앙, 글자도 늘 'Neutral / Neutral' 이라 누구든 같은 그림이 인쇄됐다.
  const colIdx = dominantIdx(FORM, posMap);   // 0=Warm 1=Neutral 2=Cool
  const rowIdx = dominantIdx(PROP, posMap);   // 0=Soft 1=Neutral 2=Hard
  const measured = colIdx != null && rowIdx != null;
  const toneAxis = dominantOf(FORM, posMap);      // Warm | Neutral | Cool | 미측정
  const balanceAxis = dominantOf(PROP, posMap);   // Soft | Neutral | Hard | 미측정
  const typeCell = measured ? IMAP[rowIdx][colIdx] : null;

  // 가로축은 Soft(왼쪽) ↔ Hard(오른쪽) = 비율축, 세로축은 Cool(위) ↔ Warm(아래) = 형태축.
  const BAND_PCT = [16.7, 50, 83.3];
  const dotLeft = rowIdx != null ? BAND_PCT[rowIdx] : 50;
  const dotTop = colIdx != null ? BAND_PCT[2 - colIdx] : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
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

            {/* 현재 위치 — 판정된 칸의 좌표. 미측정이면 점을 찍지 않는다 */}
            {measured ? (
              <div className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${dotLeft}%`, top: `${dotTop}%` }}>
                <div className="w-4 h-4 bg-black rounded-full mx-auto"></div>
                <p className="text-xs font-light text-black mt-2 whitespace-nowrap">
                  {toneAxis} / {balanceAxis}
                </p>
                {typeCell && (
                  <p className="text-[11px] font-light text-gray-500 mt-0.5 whitespace-nowrap">{typeCell.en}</p>
                )}
              </div>
            ) : (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <p className="text-xs font-light text-gray-400 whitespace-nowrap">미측정</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-sm font-light text-gray-600">Tone Axis</span>
          <span className="text-sm font-light text-black">{toneAxis}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-sm font-light text-gray-600">Balance Axis</span>
          <span className="text-sm font-light text-black">{balanceAxis}</span>
        </div>
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          {typeCell
            ? typeCell.desc
            : '얼굴 실측값이 없어 이미지 좌표를 판정하지 않았습니다.'}
        </p>
      </div>
    </motion.div>
  );
}

function PersonalColorPage({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
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

function HairTexturePage({ pageNumber, totalPages, texture }: { pageNumber: number; totalPages: number; texture: HairTextureData | null }) {
  // 시안 리포트와 같은 5항목. 값은 '헤어질감' 화면에서 디자이너가 고른 것을 그대로 쓴다.
  // (예전에는 약손상·반곱슬·보통·많다가 박혀 있어서 누구든 같은 모질이 인쇄됐다)
  const AXES: { key: keyof HairTextureData; label: string }[] = [
    { key: 'damageLevel',  label: '손상도' },
    { key: 'hairType',     label: '모질 상태' },
    { key: 'thickness',    label: '굵기' },
    { key: 'density',      label: '숱' },
    { key: 'curlCoverage', label: '곱슬 정도' },
  ];

  // 점 색은 손상도에서 나온다 — 헤어질감 화면이 강손상 이상을 '주의'로 표시하는 기준과 같다.
  const DAMAGE_TONE: Record<string, string> = {
    healthy: 'bg-green-500', light: 'bg-green-500',
    medium: 'bg-yellow-500',
    heavy: 'bg-red-500', extreme: 'bg-red-500', severe: 'bg-red-500',
  };

  const rows = AXES.map(({ key, label }) => {
    const id = texture?.[key];
    return {
      label,
      value: (id && TEXTURE_LABELS[key]?.[id]) || '—',
      note: (id && TEXTURE_NOTES[key]?.[id]) || '',
      tone: key === 'damageLevel' && id ? (DAMAGE_TONE[id] ?? 'bg-gray-400') : 'bg-gray-400',
    };
  });
  const noneSelected = rows.every((r) => r.value === '—');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>

      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        HAIR TEXTURE &amp; LIMITATION
      </h2>

      <div className="space-y-6 mb-10">
        <div>
          <h3 className="text-sm font-light text-black mb-4">모질 분석</h3>
          <div className="space-y-3">
            {rows.map((r) => (
              <DataRow key={r.label} label={r.label} value={r.value} status="—" />
            ))}
          </div>
          {noneSelected && (
            <p className="text-xs font-light text-gray-400 mt-4">
              이번 컨설팅에서 모질 진단을 입력하지 않았습니다.
            </p>
          )}
        </div>

        {!noneSelected && (
          <div>
            <h3 className="text-sm font-light text-black mb-4">시술 가능 범위</h3>
            <div className="space-y-3">
              {rows.filter((r) => r.note).map((r) => (
                <div key={r.label} className="flex items-start gap-3">
                  <div className={`w-2 h-2 ${r.tone} rounded-full mt-[6px] flex-shrink-0`}></div>
                  <p className="text-sm font-light text-gray-700 leading-relaxed">
                    <span className="text-gray-500">{r.label}</span> — {r.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TodayDesignPage({ pageNumber, totalPages, style }: { pageNumber: number; totalPages: number; style: HairConsultingData['style'] | null }) {
  // 헤어컨설팅에서 디자이너가 실제로 고른 값. 안 고른 축은 "—" 로 남긴다.
  // 예전에는 쇄골·시스루·C컬·톤다운이 그대로 박혀 있어서, 무엇을 고르든
  // 리포트에는 하지 않은 시술이 인쇄됐다.
  const AXES: { axis: StyleAxis; key: keyof NonNullable<HairConsultingData['style']> }[] = [
    // 시안 리포트에는 가르마가 없다 — 화면에서는 고르지만 리포트에는 싣지 않는다
    { axis: 'length',  key: 'length'  },
    { axis: 'bangs',   key: 'bangs'   },
    { axis: 'curl',    key: 'curl'    },
    { axis: 'color',   key: 'color'   },
  ];

  const picked = AXES.map(({ axis, key }) => {
    const opt = styleOptionOf(axis, style?.[key]);
    return {
      label: STYLE_AXES[axis].title,
      value: opt?.label ?? '—',
      // 설명은 그 옵션에 붙어 있는 이미지 태그를 그대로 쓴다 (시안 시트와 같은 문구).
      explanation: opt ? `${opt.tags.join(' · ')} 인상을 만드는 방향입니다.` : '이번 컨설팅에서 선택하지 않았습니다.',
    };
  });

  const noneSelected = picked.every((p) => p.value === '—');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>

      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        TODAY DESIGN ARCHITECTURE
      </h2>

      <div className="space-y-8">
        {picked.map((p) => (
          <DesignItem key={p.label} label={p.label} value={p.value} explanation={p.explanation} />
        ))}
      </div>

      {!noneSelected && (
        <div className="mt-10 bg-black text-white rounded-xl p-6">
          <p className="text-sm font-light leading-relaxed">
            오늘의 디자인은 과도한 변화가 아닌, 고객님의 본래 이미지를 명확하게 만드는 정교한
            조율입니다.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ImageMovementPage({ pageNumber, totalPages, posMap, target, directions }: {
  pageNumber: number; totalPages: number;
  posMap: Record<string, number>;
  target: { en: string; ko: string } | null;
  directions: string[];
}) {
  // 고유미(판정) → 추구미(디자이너가 이미지맵에서 고른 칸) 사이가 맵에서 몇 칸인지로 단계를 정한다.
  // 예전에는 Neutral → Chic 과 3단계 설명이 전부 박혀 있어서 누구에게나 같은 계획이 인쇄됐다.
  const colIdx = dominantIdx(FORM, posMap);
  const rowIdx = dominantIdx(PROP, posMap);
  const current = colIdx != null && rowIdx != null ? IMAP[rowIdx][colIdx] : null;

  // 목표 칸의 좌표는 이름으로 되찾는다 (저장값에는 이름만 있다).
  const findCell = (en: string) => {
    for (let r = 0; r < IMAP.length; r++) {
      for (let c = 0; c < IMAP[r].length; c++) {
        if (IMAP[r][c].en === en) return { row: r, col: c };
      }
    }
    return null;
  };
  const targetPos = target ? findCell(target.en) : null;

  // 맵 위 이동 칸수 (가로 + 세로). 고유미나 추구미가 없으면 계산하지 않는다.
  const distance = current && targetPos && colIdx != null && rowIdx != null
    ? Math.abs(targetPos.row - rowIdx) + Math.abs(targetPos.col - colIdx)
    : null;

  const STEPS = [
    { n: 1, dot: 'bg-green-500',  title: '안정 유지',   at: 0, desc: '현재 이미지타입을 유지하며 소폭 조율만 진행합니다.' },
    { n: 2, dot: 'bg-yellow-500', title: '소폭 확장',   at: 1, desc: '맵에서 한 칸 옆의 이미지타입으로, 인상을 크게 바꾸지 않고 넓힙니다.' },
    { n: 3, dot: 'bg-red-500',    title: '이미지 전환', at: 2, desc: '맵에서 두 칸 이상 떨어진 이미지타입으로, 단계적인 이동이 필요합니다.' },
  ];
  const activeStep = distance == null ? null : distance === 0 ? 1 : distance === 1 ? 2 : 3;

  // 이동 방법은 '다음 방향' 화면에서 디자이너가 고른 항목을 그대로 쓴다.
  const DIRECTION_LABELS: Record<string, string> = {
    length: '길이 변화', color: '컬러 변화', bangs: '앞머리 디자인 변경',
    perm: '펌 · 볼륨 추가', recovery: '손상도 회복 후 확장', image: '이미지 이동 컨설팅',
  };
  const pickedDirections = directions.map((d) => DIRECTION_LABELS[d]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>

      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        IMAGE SHIFT PLAN
      </h2>

      {/* 이동 범위 시각화 */}
      <div className="mb-10">
        <div className="bg-gray-50 rounded-xl p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-center w-28">
              <div className="w-16 h-16 bg-black rounded-full mx-auto mb-2"></div>
              <p className="text-xs font-light text-gray-600">고유</p>
              <p className="text-xs font-light text-black">{current ? current.ko : '미측정'}</p>
            </div>

            <div className="flex-1 mx-4">
              <div className="relative h-px bg-gray-300">
                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2">
                  <div className="w-full h-1 bg-gradient-to-r from-black via-gray-400 to-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="text-center w-28">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2"></div>
              <p className="text-xs font-light text-gray-600">추구</p>
              <p className="text-xs font-light text-black">{target ? target.ko : '선택 안 함'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {STEPS.map((st) => {
          const on = activeStep === st.n;
          return (
            <div key={st.n} className={on ? '' : 'opacity-35'}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-6 h-6 rounded-full ${st.dot} text-white text-xs flex items-center justify-center font-light`}>
                  {st.n}
                </div>
                <h3 className="text-sm font-light text-black">{st.title}</h3>
              </div>
              <p className="text-sm font-light text-gray-700 ml-9">{st.desc}</p>
              {on && pickedDirections.length > 0 && (
                <p className="text-sm font-light text-gray-500 ml-9 mt-1">
                  이동 방법 — {pickedDirections.join(' · ')}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
        <p className="text-sm font-light text-gray-700 leading-relaxed">
          {activeStep == null
            ? (current
                ? '목표 이미지타입을 선택하지 않아 이동 계획을 세우지 않았습니다.'
                : '얼굴 실측값이 없어 이동 계획을 세우지 않았습니다.')
            : '이미지 이동은 단계적으로 진행하는 것이 안정적입니다. 급격한 변화보다 방향성을 유지한 확장이 효과적입니다.'}
        </p>
      </div>
    </motion.div>
  );
}

function PersonalNotePage({ pageNumber, totalPages, designerName }: { pageNumber: number; totalPages: number; designerName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
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

function ClosingPage({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px] flex flex-col items-center justify-center text-center"
    >
      {/* 페이지 번호 */}
      <div className="absolute top-12 right-12">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>
      
      <h1 className="text-4xl font-light tracking-[0.15em] text-black mb-12">MERCI MOMONG</h1>

      <p className="text-sm font-light text-gray-700 leading-relaxed max-w-md">
        모든 사람들이 자신의 아름다움을 발견하고
        <br />
        스스로 사랑할 수 있도록 돕습니다.
      </p>

      <div className="mt-16 pt-8 border-t border-gray-200 w-full max-w-md">
        <p className="text-xs text-gray-400 font-light">
          © {new Date().getFullYear()} MERCI MOMONG. All rights reserved.
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
function DesignCycleMasterPlanPage({ pageNumber, totalPages, cycleData }: { pageNumber: number; totalPages: number; cycleData: CycleData | null }) {
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
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
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
function NextDirectionSummaryPage({ pageNumber, totalPages, cycleData }: { pageNumber: number; totalPages: number; cycleData: CycleData | null }) {
  // '다음 방향' 화면에서 디자이너가 고른 이동 방향과 변화 강도.
  // 예전에는 길이 유지·볼륨 조정·손상 회복 세 줄이 박혀 있어서, 무엇을 고르든 같은 문장이 인쇄됐다.
  const picked = DIRECTION_ITEMS.filter((d) => cycleData?.directions?.includes(d.id));
  const level = CHANGE_LEVELS.find((l) => l.level === cycleData?.changeLevel) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-sm p-12 min-h-[600px]"
    >
      {/* 페이지 번호 */}
      <div className="text-right mb-4">
        <span className="text-xs text-gray-400 font-light">Page {pageNumber} of {totalPages}</span>
      </div>

      <h2 className="text-2xl font-light tracking-[0.05em] text-black mb-8 pb-4 border-b border-gray-200">
        NEXT DIRECTION SUMMARY
      </h2>

      <div className="space-y-6 mb-10">
        <div>
          <h3 className="text-base font-light text-black mb-3">다음 방문 시 권장 방향</h3>
          {picked.length > 0 ? (
            <ul className="space-y-3">
              {picked.map((d) => (
                <li key={d.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm font-light text-gray-700">
                    {d.label}
                    {d.sublabel && <span className="text-gray-500"> {d.sublabel}</span>}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-light text-gray-400">
              이번 컨설팅에서 다음 방향을 선택하지 않았습니다.
            </p>
          )}
        </div>

        {level && (
          <div>
            <h3 className="text-base font-light text-black mb-3">변화 강도</h3>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${level.color}`}></span>
              <p className="text-sm font-light text-gray-700">
                {level.label}
                <span className="text-gray-500"> · 고른 방향들의 평균 변화 폭입니다</span>
              </p>
            </div>
          </div>
        )}
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
