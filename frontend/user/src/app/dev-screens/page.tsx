'use client';

// 개발 전용 — 화면 확인용 임시 페이지. 확인이 끝나면 지운다. (2026-09-12)
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AIFaceFeature } from '@/components/new/AIFaceFeature';
import { HairConsulting } from '@/components/new/HairConsulting';
import { FaceMeasureCompare } from '@/components/new/FaceMeasureCompare';
import type { AnalyzeResponse } from '@/utils/face-analysis-api';
import { measureFaceFromUrl } from '@/lib/face-measure/browser';

const POS = {
  faceline: 0.3, cheek: 0.45, browshape: 0.4, browdir: 0.5, eyeshape: 0.24,
  eyetail: 0.35, eyefront: 0.4, nosewidth: 0.4, nosehigh: 0.5, lips: 0.35,
  facelen: 0.45, thirds: 0.5, broweye: 0.4, eyelid: 0.45, intereye: 0.5,
  eyeouter: 0.4, noselen: 0.45, philtrum: 0.5, mouthwidth: 0.4, chinlen: 0.45,
};

// ?v=compare — 웹/Python 측정 비교 화면. 로그인 · S3 · 저장 없이 브라우저에서 측정하고,
// Python 쪽은 비교 화면이 로컬 Python(3201)에 직접 보낸다.
//   &img=/new/face-photo.jpg (public 경로, 기본값)
function CompareDev({ img }: { img: string }) {
  const [web, setWeb] = useState<AnalyzeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    measureFaceFromUrl(img)
      .then((m) => {
        if (!m) throw new Error('얼굴을 찾지 못했습니다');
        setWeb({
          ...m.result,
          metadata: { image_id: 'dev', total_modules: 17 },
          wncId: 'dev',
          snhId: 'dev',
          clientTiming: { landmarkMs: m.landmarkMs, measureMs: m.measureMs },
        } as unknown as AnalyzeResponse);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [img]);
  if (err) return <p className="p-10 text-sm text-red-600">웹 측정 실패: {err}</p>;
  if (!web) return <p className="p-10 text-sm text-gray-500">웹 측정 중…</p>;
  return <FaceMeasureCompare imageUrl={img} webResult={web} onBack={() => {}} onNext={() => {}} />;
}

function Body() {
  const params = useSearchParams();
  const v = params.get('v') ?? 'consult';
  if (v === 'compare') return <CompareDev img={params.get('img') ?? '/new/face-photo.jpg'} />;
  if (v === 'face') return <AIFaceFeature onNext={() => {}} facePhotoUrl="/new/face-photo.jpg" initialPosMap={POS} />;
  return <HairConsulting posMap={POS} onNext={() => {}} />;
}

export default function DevScreens() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <Suspense><Body /></Suspense>;
}
