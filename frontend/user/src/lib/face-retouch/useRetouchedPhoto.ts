'use client';

import { useEffect, useState } from 'react';
import { retouchFaceImage } from './browser';

/**
 * 화면에 보여 줄 보정본 주소를 만든다. 저장·분석에는 받은 주소(원본)를 그대로 쓸 것.
 * 보정이 끝나기 전이거나 실패하면 원본을 돌려준다.
 */
export function useRetouchedPhoto(url: string | null): string | null {
  const [retouched, setRetouched] = useState<{ source: string; url: string } | null>(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const res = await fetch(url, /^https?:/.test(url) ? { mode: 'cors', cache: 'no-store' } : undefined);
      if (!res.ok) throw new Error('이미지를 불러오지 못했습니다');
      const { blob, applied } = await retouchFaceImage(await res.blob());
      if (cancelled || !applied) return;
      objectUrl = URL.createObjectURL(blob);
      setRetouched({ source: url, url: objectUrl });
    })().catch((e) => console.warn('[retouch] 보정 실패 — 원본을 보여 줍니다', e));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return retouched?.source === url ? retouched.url : url;
}
