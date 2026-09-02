import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { BrandHeader } from './BrandHeader';
import { FORM, PROP, MONO, IMAP, computeScores, dominantOf, dominantIdx } from './faceAnalysisData';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

// 촬영 사진이 없을 때만 쓰는 예시 이미지 (개발 중 건너뛰기로 넘어온 경우)
const FALLBACK_PHOTO = '/new/face-photo.jpg';

interface Props {
  posMap: Record<string, number>;
  onNext: () => void;
  onBack?: () => void;
  /** 얼굴 촬영에서 S3 에 올린 실제 고객 사진. 없으면 예시 이미지로 떨어진다. */
  facePhotoUrl?: string | null;
}

/**
 * 레이더·순위에 쓰는 부위 묶음.
 *
 * 시안은 눈·코·입술·페이스라인·눈썹 5부위를 고정 점수(눈 92 · 코 76 …)로 그려서,
 * 누구를 촬영하든 같은 오각형이 나왔다. 여기서는 20항목을 이름 그대로 부위에 나눠 담고
 * 실제 위치값으로 계산한다. (부위 구분은 문서에 없다 — 항목 이름을 따른 것이다)
 */
const AREA_ITEMS: { area: string; ids: string[] }[] = [
  { area: '눈',        ids: ['eyeshape', 'eyetail', 'eyefront', 'broweye', 'intereye', 'eyeouter', 'eyelid'] },
  { area: '코',        ids: ['nosewidth', 'nosehigh', 'noselen'] },
  { area: '입술',      ids: ['lips', 'mouthwidth', 'philtrum'] },
  { area: '페이스라인', ids: ['faceline', 'cheek', 'facelen', 'thirds', 'chinlen'] },
  { area: '눈썹',      ids: ['browshape', 'browdir'] },
];

/**
 * 부위별 영향도 — 그 부위 항목들이 중립(0.5)에서 얼마나 벗어났는지의 평균.
 * 벗어날수록 그 부위가 인상을 끌고 간다는 뜻이다.
 * 계산식은 아래 '핵심 해석' 이 쓰는 strength 와 같다 (|pos − 0.5| × 200).
 */
function areaScores(posMap: Record<string, number>) {
  return AREA_ITEMS.map(({ area, ids }) => {
    const vals = ids.map(id => posMap[id]).filter((v): v is number => v != null);
    const value = vals.length
      ? Math.round(vals.reduce((sum, v) => sum + Math.abs(v - 0.5) * 200, 0) / vals.length)
      : 0;
    return { area, value };
  });
}

function RankingBar({ item, index }: { item: { rank: string; area: string; pct: number }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] text-[#C8B89A]">{item.rank}</span>
          <span className="text-[11px] text-[#111111]">{item.area}</span>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: '#111111', fontWeight: 300 }}>{item.pct}%</span>
      </div>
      <div className="relative h-px bg-[#EBEBEB]">
        <motion.div className="absolute left-0 top-0 h-px bg-[#111111]"
          initial={{ width: 0 }}
          animate={inView ? { width: `${item.pct}%` } : { width: 0 }}
          transition={{ duration: 0.9, delay: index * 0.1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

const AXIS_LABELS = {
  form: ['Warm', 'Neutral', 'Cool'] as const,
  prop: ['Soft', 'Neutral', 'Hard'] as const,
};

function axisDist(score: number, labels: readonly string[]) {
  const B1 = 100 / 3;
  const B2 = 200 / 3;
  let neu: number;
  if (score <= 50) neu = score <= B1 ? (score / B1) * 50 : 50 + (score - B1) / (50 - B1) * 50;
  else             neu = score >= B2 ? (100 - score) / (100 - B2) * 50 : 50 + (B2 - score) / (B2 - 50) * 50;
  const outer = Math.max(Math.round(100 - neu), 0);
  const neutral = 100 - outer;
  return [
    { label: labels[0], pct: score < 50 ? outer : 0 },
    { label: labels[1], pct: neutral },
    { label: labels[2], pct: score > 50 ? outer : 0 },
  ];
}

export function AIFaceResultDerived({ posMap, onNext, onBack, facePhotoUrl }: Props) {
  const { formScore, propScore } = computeScores(posMap);
  const formDominant = dominantOf(FORM, posMap);
  const propDominant = dominantOf(PROP, posMap);

  const formDist = axisDist(formScore, AXIS_LABELS.form);
  const propDist = axisDist(propScore, AXIS_LABELS.prop);

  // 다수결 (7.14 Layer 1). 값이 없는 항목은 표를 던지지 않으므로, 분석이 하나도 없으면 null 이다.
  const colIdx = dominantIdx(FORM, posMap); // 0=Warm 1=Neutral 2=Cool
  const rowIdx = dominantIdx(PROP, posMap); // 0=Soft 1=Neutral 2=Hard
  const imageType = colIdx != null && rowIdx != null ? IMAP[rowIdx][colIdx] : null;


  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard Variable','Inter',-apple-system,sans-serif" }}>
      <BrandHeader />

      <div className="pt-20 pb-40 max-w-3xl mx-auto px-5">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.22em] text-[#AAAAAA] mb-1.5" style={{ fontFamily: MONO }}>STEP 02 · ZONE C</p>
          <div className="flex items-end justify-between">
            <h1 className="text-[1.5rem] font-light text-[#111111] tracking-tight">최종 이미지타입</h1>
            <div className="flex items-center gap-2 mb-0.5">
              {onBack && (
                <button onClick={onBack}
                  className="px-3 py-2 text-[11px] tracking-[0.04em] rounded-sm border border-[#E8E8E4] text-[#888888]"
                  style={{ background: 'transparent', cursor: 'pointer' }}>
                  ← 돌아가기
                </button>
              )}
              <button onClick={onNext}
                className="px-4 py-2.5 text-[11.5px] tracking-[0.06em] rounded-sm"
                style={{ background: '#1A1A1A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                다음 단계 →
              </button>
            </div>
          </div>
          <div className="mt-4 h-px bg-[#E8E8E4]" />
        </div>

        {/* ── Face photo (left) + Final Image Type card (right) ──── */}
        <div className="flex gap-4 items-stretch mb-6">

          {/* Face photo + C×N below */}
          <div className="flex flex-col shrink-0" style={{ width: 240 }}>
            <div className="relative overflow-hidden rounded-sm bg-[#F9F9F7] flex-1">
              <img src={facePhotoUrl || FALLBACK_PHOTO} alt="얼굴 분석" className="w-full h-full object-contain" />
              <svg viewBox="0 0 1414 2000" preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full pointer-events-none">
                <line stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 10" opacity="0.18" x1="707" y1="200" x2="707" y2="1900"/>
                <line stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 10" opacity="0.18" x1="80" y1="1000" x2="1334" y2="1000"/>
              </svg>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-sm"
                style={{ background: 'rgba(26,26,26,0.82)', backdropFilter: 'blur(6px)' }}>
                <p className="text-white text-[8px] tracking-[0.12em]" style={{ fontFamily: MONO }}>
                  {String(formScore).padStart(2, '0')} × {String(propScore).padStart(2, '0')}
                </p>
              </div>
            </div>
            {/* C × N below photo */}
            <div className="pt-3 pb-1 text-center">
              <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-1" style={{ fontFamily: MONO }}>
                최종 이미지타입
              </p>
              <span className="text-[20px] font-light tracking-tight text-[#1A1A1A] leading-none" style={{ fontFamily: MONO }}>
                {formDominant} × {propDominant}
              </span>
            </div>
          </div>

          {/* Final Image Type card */}
          <motion.div
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-w-0 border border-[#E8E8E4] rounded-sm overflow-hidden">

            {/* Type identity */}
            <div className="px-5 pt-5 pb-4 bg-[#F7F7F5]">
              <p className="text-[10px] tracking-[0.28em] text-[#888888] mb-1" style={{ fontFamily: MONO }}>
                {imageType ? `${imageType.en} TYPE` : 'NOT MEASURED'}
              </p>
              <p className="text-[32px] font-bold text-[#1A1A1A] tracking-tight leading-tight">
                {imageType ? imageType.ko : '미측정'}
              </p>
            </div>

            {/* Description + keywords */}
            <div className="px-5 py-4 border-t border-[#E8E8E4]">
              <p className="text-[12.5px] text-[#444444] leading-[1.85] mb-3">
                {imageType ? imageType.desc : '얼굴 분석 결과가 없어 이미지타입을 판정하지 않았습니다. 위 항목을 직접 조정하면 그 값으로 판정합니다.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(imageType?.kw ?? []).map((k: string) => (
                  <span key={k} className="text-[11px] px-2.5 py-1 rounded-sm"
                    style={{ background: '#EFEFED', color: '#555550' }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Distribution bars */}
            <div className="px-5 pt-4 pb-5 border-t border-[#E8E8E4]">
              <div className="mb-4">
                <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-2.5" style={{ fontFamily: MONO }}>
                  WARM · NEUTRAL · COOL
                </p>
                {formDist.map(d => {
                  const isLead = d.pct === Math.max(...formDist.map(x => x.pct));
                  return (
                    <div key={d.label} className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] w-14 shrink-0"
                        style={{ color: isLead ? '#1A1A1A' : '#BBBBBB', fontWeight: isLead ? 600 : 400 }}>
                        {d.label}
                      </span>
                      <div className="flex-1 h-[3px] bg-[#E8E8E4] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: isLead ? '#1A1A1A' : '#D8D8D4' }}
                          initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                      </div>
                      <span className="text-[10px] w-7 text-right tabular-nums"
                        style={{ color: isLead ? '#1A1A1A' : '#AAAAAA', fontFamily: MONO }}>
                        {d.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div>
                <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-2.5" style={{ fontFamily: MONO }}>
                  SOFT · NEUTRAL · HARD
                </p>
                {propDist.map(d => {
                  const isLead = d.pct === Math.max(...propDist.map(x => x.pct));
                  return (
                    <div key={d.label} className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] w-14 shrink-0"
                        style={{ color: isLead ? '#1A1A1A' : '#BBBBBB', fontWeight: isLead ? 600 : 400 }}>
                        {d.label}
                      </span>
                      <div className="flex-1 h-[3px] bg-[#E8E8E4] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: isLead ? '#1A1A1A' : '#D8D8D4' }}
                          initial={{ width: 0 }} animate={{ width: `${d.pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                      </div>
                      <span className="text-[10px] w-7 text-right tabular-nums"
                        style={{ color: isLead ? '#1A1A1A' : '#AAAAAA', fontFamily: MONO }}>
                        {d.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>


        {/* ── Section 2: 이미지를 결정짓는 요소 ─────────────────── */}
        {(() => {
          // Compute top contributors from actual posMap
          const FORM_AXIS = ['Warm', 'Neutral', 'Cool'];
          const PROP_AXIS = ['Soft', 'Neutral', 'Hard'];
          const allFeatures = [
            ...FORM.map(it => {
              const pos = posMap[it.id] ?? it.defaultPos;
              const type = pos < 0.33 ? FORM_AXIS[0] : pos < 0.67 ? FORM_AXIS[1] : FORM_AXIS[2];
              const strength = Math.round(Math.abs(pos - 0.5) * 200);
              const side = pos < 0.33 ? it.l : pos > 0.67 ? it.r : '균형';
              return { item: it, type, strength, side, axis: 'form' as const };
            }).filter(f => f.type === formDominant && f.type !== 'Neutral'),
            ...PROP.map(it => {
              const pos = posMap[it.id] ?? it.defaultPos;
              const type = pos < 0.33 ? PROP_AXIS[0] : pos < 0.67 ? PROP_AXIS[1] : PROP_AXIS[2];
              const strength = Math.round(Math.abs(pos - 0.5) * 200);
              const side = pos < 0.33 ? it.l : pos > 0.67 ? it.r : '균형';
              return { item: it, type, strength, side, axis: 'prop' as const };
            }).filter(f => f.type === propDominant && f.type !== 'Neutral'),
          ].sort((a, b) => b.strength - a.strength);

          const RANKS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

          // 부위별 영향도 — 실제 위치값에서 계산 (예전에는 눈 92 · 코 76 … 고정이었다)
          const radarData = areaScores(posMap);
          const areaRankings = radarData
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((d, i) => ({ rank: RANKS[i] ?? `${i + 1}`, area: d.area, pct: d.value }));

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-[9px] tracking-[0.22em] text-[#AAAAAA] mb-1" style={{ fontFamily: MONO }}>
                SECTION 02
              </p>
              <p className="text-[15px] font-light text-[#111111] tracking-tight mb-5">이미지를 결정짓는 요소</p>

              {/* Left: chart + rankings | Right: interpretations */}
              <div className="flex gap-0">

                {/* Left col */}
                <div className="shrink-0 pr-6" style={{ width: '44%' }}>
                  {/* Radar chart */}
                  <div style={{ height: 360, marginTop: 40 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="76%">
                        <PolarGrid gridType="polygon" stroke="#EBEBEB" strokeWidth={0.8} />
                        <PolarAngleAxis
                          dataKey="area"
                          tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                            const d = radarData.find(r => r.area === payload.value);
                            return (
                              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle">
                                <tspan key="label" x={x} dy="-0.5em" style={{ fontSize: 9, fill: '#AAAAAA', fontWeight: 300 }}>
                                  {payload.value}
                                </tspan>
                                <tspan key="pct" x={x} dy="1.3em" style={{ fontSize: 9, fill: '#111111', fontWeight: 500 }}>
                                  {d ? `${d.value}%` : ''}
                                </tspan>
                              </text>
                            );
                          }}
                        />
                        <Radar dataKey="value"
                          stroke="#111111" strokeWidth={1}
                          fill="#111111" fillOpacity={0.05}
                          dot={{ r: 2, fill: '#111111', strokeWidth: 0 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 핵심 영향도 bars */}
                  <div className="pt-4" style={{ borderTop: '1px solid #F2F2F2' }}>
                    <p className="text-[9px] tracking-[0.16em] text-[#CCCCCC] uppercase mb-4">핵심 영향도</p>
                    {areaRankings.map((item, i) => (
                      <RankingBar key={item.area} item={item} index={i} />
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-[#EBEBEB] shrink-0" />

                {/* Right col: 핵심 해석 */}
                <div className="flex-1 pl-6">
                  <p className="text-[9px] tracking-[0.16em] text-[#CCCCCC] uppercase mb-4">핵심 해석</p>
                  <div>
                    {allFeatures.map((f, i) => (
                      <motion.div key={f.item.id}
                        initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}>

                        {/* 이목구비 부위 */}
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-[9px] text-[#C8B89A]">{RANKS[i] ?? `${i+1}`}</span>
                          <span className="text-[10px] text-[#999999]">{f.item.title}</span>
                        </div>

                        {/* 특징값 — 타입 결정 요인 */}
                        <p className="text-[12px] text-[#111111] pl-4 mb-1" style={{ fontWeight: 500 }}>
                          {f.side}
                        </p>

                        {/* 타입 결정 이유 */}
                        <p className="text-[9px] pl-4 mb-1" style={{ color: '#C8B89A', fontWeight: 400 }}>
                          {imageType ? `${imageType.ko} 타입을 결정짓는 특징` : '타입 판정에 쓰이는 특징'}
                        </p>

                        {/* 매력 설명 */}
                        <p className="text-[10px] text-[#AAAAAA] leading-[1.7] pl-4 mb-2" style={{ fontWeight: 300 }}>
                          → {f.item.desc}
                        </p>

                        {/* 매력 태그 */}
                        <div className="flex items-center gap-1 pl-4">
                          <span className="text-[8px] text-[#CCCCCC] mr-0.5">매력</span>
                          {f.item.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[8px] px-1.5 py-0.5"
                              style={{ background: '#F5F5F3', color: '#888888' }}>
                              {t}
                            </span>
                          ))}
                        </div>

                        {i < allFeatures.length - 1 && (
                          <div className="w-full h-px bg-[#F5F5F5] my-4" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className="border-t border-[#E8E8E4] pt-5">
          <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-3" style={{ fontFamily: MONO }}>MEASUREMENT COMPLETE</p>
          <button onClick={onNext}
            className="w-full py-5 text-[12px] tracking-[0.08em] bg-[#111111] text-white flex items-center justify-center gap-3 hover:bg-[#2A2A2A] transition-colors"
            style={{ border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            다음 단계로 진행 →
          </button>
        </div>
      </div>
    </div>
  );
}
