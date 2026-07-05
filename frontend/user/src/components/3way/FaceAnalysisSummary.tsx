// 저장된 3WAY 얼굴분석 결과(client_info.threeWay.faceAnalysis)를 읽기전용으로 표시.
// 컨설팅 상세 모달에서 사용 (P4/F3).

type GradeRow = { label: string; selectedType: string };

export interface SavedFaceAnalysis {
  imageType?: string;
  ratios?: { vertical?: string; face?: string; midSection?: string };
  warmCool?: GradeRow[];
  softHard?: GradeRow[];
  summaryItems?: string[];
}

const WNC_COLS = [
  { key: 'warm', label: 'Warm' },
  { key: 'neutral', label: 'N' },
  { key: 'cool', label: 'Cool' },
];
const SNH_COLS = [
  { key: 'soft', label: 'Soft' },
  { key: 'neutral', label: 'N' },
  { key: 'hard', label: 'Hard' },
];

function GradeTable({
  title,
  cols,
  rows,
}: {
  title: string;
  cols: { key: string; label: string }[];
  rows: GradeRow[];
}) {
  return (
    <div>
      <p className="text-[11px] text-[#999999] uppercase tracking-wider mb-2">{title}</p>
      <div className="border border-[#E5E5E5] bg-white">
        <div className="grid grid-cols-4 gap-1 px-3 py-1.5 border-b border-[#EEEEEE] text-[11px] text-[#999999]">
          <span />
          {cols.map((c) => (
            <span key={c.key} className="text-center">
              {c.label}
            </span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={`${r.label}-${i}`} className="grid grid-cols-4 gap-1 px-3 py-1.5 items-center text-xs">
            <span className="text-[#555555]">{r.label}</span>
            {cols.map((c) => (
              <span
                key={c.key}
                className={`text-center ${r.selectedType === c.key ? 'text-[#111111]' : 'text-[#DDDDDD]'}`}
              >
                {r.selectedType === c.key ? '●' : '·'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaceAnalysisSummary({ fa }: { fa: SavedFaceAnalysis }) {
  if (!fa || (!fa.imageType && !fa.warmCool?.length && !fa.softHard?.length)) return null;
  const r = fa.ratios;
  return (
    <div>
      <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">얼굴 분석 결과</p>
      <div className="border border-[#EAEAEA] p-4 bg-[#FAFAFA] space-y-4">
        {fa.imageType && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#999999] uppercase tracking-wider">Image Type</span>
            <span className="px-2 py-0.5 bg-[#111111] text-white text-xs tracking-wider">{fa.imageType}</span>
          </div>
        )}
        {!!fa.warmCool?.length && <GradeTable title="Warm / N / Cool" cols={WNC_COLS} rows={fa.warmCool} />}
        {!!fa.softHard?.length && <GradeTable title="Soft / N / Hard" cols={SNH_COLS} rows={fa.softHard} />}
        {r && (r.vertical || r.face || r.midSection) && (
          <div className="text-xs text-[#555555]">
            <span className="text-[11px] text-[#999999] uppercase tracking-wider mr-2">비율</span>
            상중하 {r.vertical || '-'} · 얼굴비율 {r.face || '-'} · 중안부 {r.midSection || '-'}
          </div>
        )}
      </div>
    </div>
  );
}
