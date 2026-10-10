'use client';

/**
 * 'test' 코스 전용 — 웹(브라우저) 얼굴 측정과 Python 서버 측정을 같은 사진으로 비교한다.
 *
 * 촬영 화면이 이미 브라우저 측정 + 저장까지 끝낸 결과(webResult)를 넘겨준다.
 * 여기서 같은 사진을 로컬 Python 서버(localhost:3201)에 직접 보내 항목별 등급 · 값 · 측정선을 나란히 보여준다.
 * 백엔드는 더 이상 Python 을 부르지 않으므로(2026-10-10) 비교용 Python 호출은 이 화면만 한다 — 개발 전용.
 * 다음 화면(이목구비)은 고른 쪽 결과로 진행한다. 저장된 분석 기록은 웹 결과 그대로다.
 */

import { useEffect, useMemo, useState } from 'react';
import type { AnalyzeResponse, AnalysisModule, MeasurementShape } from '@/utils/face-analysis-api';
import { LEGACY_KEY, fromLegacyGroup } from '@/lib/face-measure/legacy';
import { FORM, PROP } from './faceAnalysisData';

const PY_COLOR = '#FF8A00';
const WEB_COLOR = '#00A8E8';
const PYTHON_URL = 'http://localhost:3201';

const TITLE: Record<string, string> = Object.fromEntries([...FORM, ...PROP].map((m) => [m.id, m.title]));

interface Row {
  group: 'wnc' | 'snh';
  id: string;
  py: AnalysisModule | undefined;
  web: AnalysisModule | undefined;
}

type Groups = Pick<AnalyzeResponse, 'wnc' | 'snh'>;

interface Props {
  imageUrl: string | null;
  /** 촬영 화면이 브라우저 측정 · 저장한 결과 (키 = 화면 항목 id) */
  webResult: AnalyzeResponse | null;
  onBack: () => void;
  /** 고른 쪽 결과로 다음 화면에 간다. 사진이 없으면 null */
  onNext: (result: AnalyzeResponse | null) => void;
}

/** 같은 사진을 로컬 Python 서버에 보내고 결과 키를 화면 항목 id 로 바꾼다 */
async function analyzeWithLocalPython(imageUrl: string): Promise<Groups> {
  const blob = await (await fetch(imageUrl)).blob();
  const fd = new FormData();
  fd.append('file', blob, 'face.jpg');
  fd.append('image_id', 'test_compare');
  fd.append('save_images', 'false');
  fd.append('s3_bucket', 'momong-dev');
  const res = await fetch(`${PYTHON_URL}/analyze`, { method: 'POST', body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.error || json.detail?.error || `Python ${res.status}`);
  return { wnc: fromLegacyGroup('wnc', json.data.wnc), snh: fromLegacyGroup('snh', json.data.snh) };
}

const fmtVal = (v: number | null | undefined) =>
  v == null ? '-' : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3);

function Shapes({ shapes, color }: { shapes: MeasurementShape[]; color: string }) {
  return (
    <g>
      {shapes.map((s, i) => {
        if (s.type === 'text') return null;
        const dash = 'dashed' in s && s.dashed ? '6 4' : undefined;
        if (s.type === 'point' || s.type === 'circle') {
          const p = s.type === 'point' ? s.point : (s.point ?? s.center)!;
          return <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#000" strokeWidth={1} vectorEffect="non-scaling-stroke" />;
        }
        if (s.type === 'rectangle') {
          const [a, b] = s.points;
          return (
            <rect key={i} x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)}
              fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
          );
        }
        const pts = s.points.map((p) => `${p.x},${p.y}`).join(' ');
        return (
          <g key={i}>
            <polyline points={pts} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={4.5} vectorEffect="non-scaling-stroke" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </g>
  );
}

export function FaceMeasureCompare({ imageUrl, webResult, onBack, onNext }: Props) {
  const [py, setPy] = useState<Groups | null>(null);
  // Python 비교 상태. 사진이 없으면 비교하지 않는다
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>(imageUrl ? 'running' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [show, setShow] = useState<'both' | 'py' | 'web'>('both');

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    // 상태는 처음부터 'running' 이다 (사진 URL 은 이 화면에 있는 동안 바뀌지 않는다)
    analyzeWithLocalPython(imageUrl)
      .then((g) => {
        if (cancelled) return;
        setPy(g);
        setStatus('done');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [imageUrl]);

  const rows: Row[] = useMemo(
    () =>
      (['wnc', 'snh'] as const).flatMap((group) =>
        Object.keys(LEGACY_KEY[group]).map((id) => ({
          group,
          id,
          py: py?.[group].results[id],
          web: webResult?.[group]?.results?.[id],
        })),
      ),
    [py, webResult],
  );

  const same = rows.filter((r) => r.web?.grade && r.py?.grade === r.web.grade).length;
  const firstDiff = rows.find((r) => r.py && r.py.grade !== r.web?.grade)?.id ?? rows[0]?.id ?? null;
  const sel = rows.find((r) => r.id === (selected ?? firstDiff));
  const size = sel?.web?.measurement?.image_size ?? sel?.py?.measurement?.image_size ?? null;
  const timing = webResult?.clientTiming;

  const continueWith = (which: 'web' | 'py') => {
    if (which === 'py' && py && webResult) {
      // 화면만 Python 결과로 진행한다. id · 사진 URL 은 저장된 웹 결과 것을 그대로 쓴다
      onNext({ ...webResult, wnc: py.wnc, snh: py.snh });
    } else {
      onNext(webResult);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 md:px-10 pt-20 pb-36">
      <div className="max-w-6xl mx-auto">
        <p className="text-xs tracking-[0.25em] text-gray-500 uppercase mb-2">Test · Web vs Python</p>
        <h1 className="text-xl md:text-2xl font-semibold text-[#111] mb-1">웹 측정 · Python 측정 비교</h1>
        <p className="text-sm text-[#888] mb-6">
          같은 사진을 브라우저(웹)와 Python 서버에서 각각 측정했습니다. 항목을 누르면 사진 위 측정선이 바뀝니다.
        </p>

        {!imageUrl && (
          <div className="rounded-xl border border-[#EEE] p-6 text-sm text-[#666]">
            촬영한 사진이 없습니다 (얼굴 분석을 건너뛰었습니다). 비교 없이 다음으로 진행합니다.
          </div>
        )}

        {imageUrl && (
          <>
            {/* 요약 */}
            <div className="flex flex-wrap gap-2 mb-6 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-[#F4F4F4] text-[#111]">
                {status === 'running' ? 'Python 측정 중…' : status === 'done' ? `등급 일치 ${same}/${rows.length}` : `Python 비교 실패 (로컬 3201 켜져 있는지 확인): ${error}`}
              </span>
              {status === 'done' && py && webResult && (
                <>
                  <span className="px-3 py-1.5 rounded-full bg-[#F4F4F4] text-[#111]">
                    형태 최종 <b style={{ color: PY_COLOR }}>{py.wnc.final}</b> / <b style={{ color: WEB_COLOR }}>{webResult.wnc.final}</b>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#F4F4F4] text-[#111]">
                    비율 최종 <b style={{ color: PY_COLOR }}>{py.snh.final}</b> / <b style={{ color: WEB_COLOR }}>{webResult.snh.final}</b>
                  </span>
                  {timing && (
                    <span className="px-3 py-1.5 rounded-full bg-[#F4F4F4] text-[#666]">
                      웹 소요: 랜드마크 {Math.round(timing.landmarkMs)}ms · 판정 {Math.round(timing.measureMs)}ms
                    </span>
                  )}
                </>
              )}
            </div>
            {status === 'done' && (
              <p className="-mt-4 mb-6 text-[11px] text-[#999]">
                최종(다수결)은 Python 이 화면에 안 쓰는 7개 모듈(피부톤 2개 · 윤곽라인 · 입술산 · 눈썹 두께 · 눈 밑 지방 · 코 폭)까지 포함해서 내므로,
                항목 등급이 모두 같아도 다를 수 있습니다. 이목구비 화면의 이미지타입은 이 최종값이 아니라 항목별 위치값으로 계산합니다.
              </p>
            )}

            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8">
              {/* 사진 + 측정선 */}
              <div>
                <div className="flex gap-2 mb-3 text-xs">
                  {([['both', '둘 다'], ['py', 'Python'], ['web', '웹']] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setShow(k)}
                      className={`px-3 py-1.5 rounded-full border ${show === k ? 'bg-[#111] text-white border-[#111]' : 'border-[#DDD] text-[#555]'}`}>
                      {label}
                    </button>
                  ))}
                  <span className="ml-auto self-center text-[#888]">
                    <span style={{ color: PY_COLOR }}>■</span> Python <span className="ml-2" style={{ color: WEB_COLOR }}>■</span> 웹
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-[#F6F6F6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="촬영 사진" crossOrigin="anonymous" className="block w-full h-auto" />
                  {size && sel && (
                    <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none">
                      {show !== 'web' && <Shapes shapes={sel.py?.measurement?.shapes ?? []} color={PY_COLOR} />}
                      {show !== 'py' && <Shapes shapes={sel.web?.measurement?.shapes ?? []} color={WEB_COLOR} />}
                    </svg>
                  )}
                </div>
                {sel && (
                  <div className="mt-3 space-y-1 text-xs text-[#555]">
                    <p><b style={{ color: PY_COLOR }}>Python</b> {sel.py?.description ?? (status === 'done' ? '결과 없음' : '-')}</p>
                    <p><b style={{ color: WEB_COLOR }}>웹</b> {sel.web?.description ?? '결과 없음'}</p>
                  </div>
                )}
              </div>

              {/* 항목 표 */}
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#999] border-b border-[#EEE]">
                      <th className="py-2 font-normal">항목</th>
                      <th className="py-2 font-normal" style={{ color: PY_COLOR }}>Python</th>
                      <th className="py-2 font-normal" style={{ color: WEB_COLOR }}>웹</th>
                      <th className="py-2 font-normal text-right">값 차이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const diff = status === 'done' && r.py?.grade !== r.web?.grade;
                      const active = r.id === sel?.id;
                      const dv = r.py?.value != null && r.web?.value != null ? r.web.value - r.py.value : null;
                      return (
                        <tr key={r.id} onClick={() => setSelected(r.id)}
                          className={`cursor-pointer border-b border-[#F2F2F2] ${active ? 'bg-[#F7F7F7]' : ''} ${i === 7 ? 'border-t-2 border-t-[#E5E5E5]' : ''}`}>
                          <td className={`py-2 pr-2 ${diff ? 'text-[#D62828] font-semibold' : 'text-[#111]'}`}>
                            {TITLE[r.id] ?? r.id}
                            <span className="ml-1 text-[10px] text-[#AAA]">{r.group === 'wnc' ? '형태' : '비율'}</span>
                          </td>
                          <td className="py-2 pr-2 tabular-nums"><b>{r.py?.grade ?? '-'}</b> <span className="text-[#888]">{fmtVal(r.py?.value)}</span></td>
                          <td className="py-2 pr-2 tabular-nums"><b className={diff ? 'text-[#D62828]' : ''}>{r.web?.grade ?? '-'}</b> <span className="text-[#888]">{fmtVal(r.web?.value)}</span></td>
                          <td className="py-2 text-right tabular-nums text-[#888]">{dv == null ? '-' : (dv > 0 ? '+' : '') + fmtVal(dv)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-[11px] text-[#AAA] leading-relaxed">
                  눈썹 방향 · 눈 앞머리 · 코 높이는 자동 측정 모듈이 없어 표에 없습니다.
                  얼굴 길이 · 턱 길이는 웹에서 Haar 얼굴 상자를 랜드마크로 추정하므로 값이 조금 다릅니다.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 border-t border-[#EEE] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={onBack} className="px-5 py-3 rounded-full border border-[#DDD] text-sm text-[#555]">이전</button>
          <div className="ml-auto flex gap-3">
            {imageUrl && (
              <button onClick={() => continueWith('py')} disabled={!py}
                className="px-5 py-3 rounded-full border text-sm disabled:opacity-40" style={{ borderColor: PY_COLOR, color: PY_COLOR }}>
                Python 결과로 계속
              </button>
            )}
            <button
              onClick={() => (imageUrl ? continueWith('web') : onNext(null))}
              disabled={!!imageUrl && !webResult}
              className="px-6 py-3 rounded-full bg-[#111] text-white text-sm disabled:opacity-40"
            >
              {imageUrl ? '웹 결과로 계속' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
