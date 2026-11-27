'use client';

// 측정 기준 — 지금 사이트(고객 화면)가 쓰는 얼굴 분석 기준을 한 화면에.
// 기준 표는 lib/face-measure/criteria.ts. 사진을 올리면 사이트와 같은 측정 코드(lib/face-measure)를 돌려
// 항목마다 측정선 · 값 · 등급을 보여 준다. 로컬에서는 랜드마크 정답 폴더의 사진 1을 자동으로 불러온다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getAdminToken } from '@/utils/auth';
import { downscaledUrl, measureFaceFromFile } from '@/lib/face-measure/browser';
import type { FaceMeasureResult, MeasureResult, MeasurementShape } from '@/lib/face-measure';
import { FINAL_RULE, FORM_CRITERIA, PROP_CRITERIA, type Criterion } from '@/lib/face-measure/criteria';
import { fetchTruthPhotoBlob } from '@/utils/landmark-truth-api';

/** 항목별 그림용 축소본 가로 — 그림이 화면에서 176px, 부위만 잘라 보여 주니 이 정도면 충분하다 */
const PREVIEW_MAX_W = 1400;

const GRADE_COLOR: Record<string, string> = { W: '#C8693F', C: '#4F7BB5', S: '#C98AA0', H: '#4A4A4A', N: '#8A8A8A' };

function Chip({ g }: { g: string }) {
  return (
    <span className="inline-block min-w-[1.4rem] rounded px-1 text-center text-xs font-bold text-white" style={{ background: GRADE_COLOR[g] ?? '#999' }}>
      {g}
    </span>
  );
}

interface Photo {
  url: string;
  width: number;
  height: number;
  label: string;
}

export default function FaceCriteriaPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [result, setResult] = useState<FaceMeasureResult | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const measure = useCallback(async (blob: Blob, label: string) => {
    setBusy(true);
    try {
      // 측정은 원본으로 (고객 화면과 같게). 화면의 항목별 그림 23개는 축소본 하나를 같이 쓴다
      const m = await measureFaceFromFile(blob);
      if (!m) {
        toast.error('얼굴을 찾지 못했습니다');
        return;
      }
      const url = await downscaledUrl(m.image, PREVIEW_MAX_W);
      setPhoto((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url, width: m.image.naturalWidth, height: m.image.naturalHeight, label };
      });
      setResult(m.result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '측정 실패');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push('/login');
      return;
    }
    // 로컬 전용: 랜드마크 정답 폴더의 사진 1. 없거나 운영이면 조용히 넘어간다
    (async () => {
      try {
        await measure(await fetchTruthPhotoBlob('local_1.jpg'), '사진 1');
      } catch {
        /* 예시 사진 없음 — 직접 올리면 된다 */
      }
    })();
  }, [router, measure]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentPath="/face-criteria" />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">얼굴 분석 측정 기준</h1>
            <p className="mt-1 text-sm text-gray-500">고객 화면의 형태 · 비율 항목을 무엇으로, 어떤 숫자로 나누는지</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {photo && <span className="text-gray-500">예시: {photo.label}</span>}
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy ? '측정 중…' : photo ? '다른 사진으로 보기' : '사진 올려서 보기'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) measure(f, f.name);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        <CriteriaTable title="형태" sub="Warm / Neutral / Cool" items={FORM_CRITERIA} group={result?.wnc} />
        <CriteriaTable title="비율" sub="Soft / Natural / Hard" items={PROP_CRITERIA} group={result?.snh} />

        {photo && result && (
          <>
            <ItemPanels title="형태" items={FORM_CRITERIA} results={result.wnc.results} photo={photo} />
            <ItemPanels title="비율" items={PROP_CRITERIA} results={result.snh.results} photo={photo} />
          </>
        )}
        {!photo && !busy && (
          <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            사진을 올리면 항목마다 사이트가 실제로 그리는 측정선과 결과가 나옵니다.
          </p>
        )}
      </main>
    </div>
  );
}

function CriteriaTable({
  title,
  sub,
  items,
  group,
}: {
  title: string;
  sub: string;
  items: Criterion[];
  group?: FaceMeasureResult['wnc'] | FaceMeasureResult['snh'];
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">
        {title} <span className="ml-1 text-sm font-normal text-gray-400">{sub}</span>
      </h2>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="w-10 px-4 py-2">#</th>
              <th className="px-2 py-2">항목</th>
              <th className="px-2 py-2">재는 방법</th>
              <th className="px-2 py-2">등급 기준</th>
              {group && <th className="px-4 py-2 text-center">예시 결과</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const r = group?.results[c.id];
              return (
                <tr key={c.id} className={`border-t border-gray-100 align-top ${c.how ? '' : 'text-gray-400'}`}>
                  <td className="px-4 py-3 text-gray-400">{c.num}</td>
                  <td className="whitespace-nowrap px-2 py-3 font-semibold">{c.name}</td>
                  {c.how ? (
                    <>
                      <td className="px-2 py-3 leading-6 text-gray-700">
                        {c.how}
                        {c.note && <div className="mt-1 text-xs text-gray-400">{c.note}</div>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 leading-7">
                        {c.grades.map(([g, t]) => (
                          <div key={g}>
                            <Chip g={g} /> <span className="ml-1">{t}</span>
                          </div>
                        ))}
                      </td>
                    </>
                  ) : (
                    <td colSpan={2} className="px-2 py-3">
                      측정 없음 — 화면에 기본값이 보입니다
                    </td>
                  )}
                  {group && (
                    <td className="px-4 py-3 text-center">
                      {r ? (
                        <>
                          <Chip g={r.grade} />
                          <div className="mt-1 text-xs text-gray-400">{r.value}</div>
                        </>
                      ) : (
                        '–'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-3 text-xs leading-5 text-gray-500">
          {group && (
            <span className="mr-3 font-semibold text-gray-700">
              예시 최종: <Chip g={group.final} />{' '}
              {Object.entries(group.counts)
                .map(([g, n]) => `${g} ${n}`)
                .join(' · ')}
            </span>
          )}
          <b>최종 판정</b> — {FINAL_RULE}
        </div>
      </div>
    </section>
  );
}

function ItemPanels({ title, items, results, photo }: { title: string; items: Criterion[]; results: Record<string, MeasureResult>; photo: Photo }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title} — 항목별 측정선</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items
          .filter((c) => c.how)
          .map((c) => {
            const r = results[c.id];
            return (
              <div key={c.id} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                <CropView photo={photo} shapes={r?.measurement?.shapes ?? []} />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-bold">
                    <span className="mr-1 text-gray-400">{c.num}</span> {c.name}
                  </div>
                  <p className="mt-2 leading-6 text-gray-600">{c.how}</p>
                  <div className="mt-2 leading-7">
                    {c.grades.map(([g, t]) => (
                      <div key={g}>
                        <Chip g={g} /> <span className="ml-1">{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                    {r ? (
                      <>
                        {r.description} → <Chip g={r.grade} />
                      </>
                    ) : (
                      '측정 실패'
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

/** 측정선이 있는 부위만 잘라서 보여 준다 (사이트가 그리는 measurement.shapes 그대로, 글자는 뺌) */
function CropView({ photo, shapes }: { photo: Photo; shapes: MeasurementShape[] }) {
  const pts = shapes.flatMap((s) =>
    s.type === 'text' ? [] : s.type === 'point' ? [s.point] : s.type === 'circle' ? [s.point ?? s.center!] : s.points,
  );
  const W = photo.width;
  const H = photo.height;
  let box = { x: 0, y: 0, side: Math.min(W, H) };
  if (pts.length) {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const side = Math.min(Math.max(Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.45, W * 0.3), Math.min(W, H));
    box = { x: Math.min(Math.max(cx - side / 2, 0), W - side), y: Math.min(Math.max(cy - side / 2, 0), H - side), side };
  }
  const k = box.side / 300;
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.side} ${box.side}`} className="h-44 w-44 shrink-0 rounded-lg bg-gray-200">
      <image href={photo.url} width={W} height={H} />
      {shapes.map((s, i) => {
        if (s.type === 'text') return null;
        if (s.type === 'point' || s.type === 'circle') {
          const c = s.type === 'point' ? s.point : (s.point ?? s.center!);
          return <circle key={i} cx={c.x} cy={c.y} r={4 * k} fill="#E53935" stroke="#fff" strokeWidth={1.2 * k} />;
        }
        const stroke = s.stroke ?? '#FFFFFF';
        const dash = s.dashed ? `${6 * k} ${4 * k}` : undefined;
        if (s.type === 'rectangle') {
          const [a, b] = s.points;
          return (
            <rect key={i} x={Math.min(a.x, b.x)} y={Math.min(a.y, b.y)} width={Math.abs(b.x - a.x)} height={Math.abs(b.y - a.y)} fill="none" stroke={stroke} strokeWidth={2.2 * k} strokeDasharray={dash} />
          );
        }
        return (
          <polyline key={i} points={s.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke} strokeWidth={2.2 * k} strokeDasharray={dash} strokeLinecap="round" />
        );
      })}
    </svg>
  );
}
