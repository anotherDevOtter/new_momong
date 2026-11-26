'use client';

// 랜드마크 정답 입력의 '예시 보기' 팝업 — 받은 기준 그림('기준시각화 다시.pdf' 페이지)을 보여 준다.
// 그림은 저장소 바깥 landmark-bench/examples/pageN.jpg 에 있고 로컬 백엔드가 넘겨 준다.

import { useEffect, useState } from 'react';
import { POINT_BY_ID, descOf, type TruthStep } from '@/lib/landmark-truth/points';
import { fetchExample } from '@/utils/landmark-truth-api';

export default function LandmarkExample({ step, onClose }: { step: TruthStep; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ex = step.examples[tab];

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    setSrc(null);
    setError(null);
    fetchExample(`page${ex.page}.jpg`)
      .then((u) => {
        url = u;
        if (!cancelled) setSrc(u);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : '예시 그림을 불러오지 못했습니다'));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [ex.page]);

  // 좌우 점은 이름 하나로 묶어 설명한다
  const names = [...new Set(step.points.map((id) => id.replace(/_[lr]$/, '')))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl gap-6 overflow-hidden rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 flex-1 flex-col">
          {step.examples.length > 1 && (
            <div className="mb-3 flex gap-1">
              {step.examples.map((e, i) => (
                <button
                  key={e.page}
                  onClick={() => setTab(i)}
                  className={`rounded-full px-3 py-1 text-sm ${i === tab ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {e.title}
                </button>
              ))}
            </div>
          )}
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl bg-[#8E8680]">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={ex.title} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-sm text-white/80">{error ?? '불러오는 중…'}</span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-400">출처: 기준시각화 다시.pdf {ex.page}쪽</div>
        </div>

        <div className="flex w-72 shrink-0 flex-col overflow-y-auto">
          <div className="text-xs text-gray-400">{step.judgments.join(' · ')}</div>
          <h3 className="mt-1 text-xl font-bold">{step.title} — 찍을 점</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {names.map((base) => {
              const id = step.points.find((p) => p.replace(/_[lr]$/, '') === base)!;
              return (
                <li key={base}>
                  <div className="font-semibold">{POINT_BY_ID[id].short}</div>
                  <div className="mt-0.5 leading-5 text-gray-600">{descOf(id)}</div>
                </li>
              );
            })}
          </ul>
          <button onClick={onClose} className="mt-auto rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white">
            닫기 <span className="ml-1 text-xs font-normal text-gray-400">Esc</span>
          </button>
        </div>
      </div>
    </div>
  );
}
