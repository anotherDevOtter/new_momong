'use client';

/**
 * 촬영본 위에 랜드마크 기반 가이드선을 얹어 보여준다.
 *
 * 이미지의 실제 픽셀 크기로 viewBox 를 잡아 좌표가 그대로 맞는다.
 * (FaceOverlay 가 파이썬 실측 도형에 쓰는 방식과 같다) (2026-09-11)
 */

import { useEffect, useRef, useState } from 'react';
import type { LandmarkPoint } from './useFaceLandmarks';
import { guideFor, baseGuide, GuideScale } from './faceGuides';

/** 밝은 피부 위에서 골드 선이 묻히지 않게 깔아 주는 아주 옅은 그림자 */
const HALO_CSS = `
.mm-guide-halo line, .mm-guide-halo path {
  stroke: #000000;
  stroke-width: 1.8px;
  stroke-opacity: 0.08;
  fill: none;
  opacity: 1;
}
`;

/** 전체 구조층은 더 옅게 — 얼굴 특징을 가리지 않는다 */
const BASE_OPACITY = 0.95;
/** 얇은 선이 밝은 배경에서도 떠 보이게 하는 펄 빛 */
const BASE_GLOW = 'drop-shadow(0 0 1.5px rgba(255,255,255,0.75))';
/** 분석 중인 부위는 또렷하되 반투명 */
const ACTIVE_OPACITY = 1;
/** 분석 중인 부위에만 은은한 골드 빛 */
const GLOW = 'drop-shadow(0 0 1.2px rgba(60,40,25,0.75))';

interface Props {
  imageUrl: string;
  points: LandmarkPoint[] | null;
  /** 그릴 항목 id. null 이면 선 없이 사진만 */
  itemId: string | null;
  maxWidth?: number;
  alt?: string;
}

export function LandmarkGuideImage({ imageUrl, points, itemId, maxWidth = 480, alt = '얼굴 분석' }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  // 표시 폭에 비례해 선·노드 크기를 줄인다 (640px = 1)
  const [scale, setScale] = useState(1);
  const [dispW, setDispW] = useState(640);
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const update = () => {
      setScale(Math.min(Math.max(el.clientWidth / 640, 0.35), 1.4));
      setDispW(el.clientWidth || 640);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageUrl]);

  // 캐시된 이미지는 마운트 시점에 이미 로드가 끝나 onLoad 가 안 불린다.
  // 그 경우 크기를 못 받아 오버레이가 통째로 안 그려졌다. (2026-09-11)
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth) {
      setSize({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [imageUrl]);
  const guide = points && size && itemId ? guideFor(itemId, points, size.w, size.h) : null;
  const base = points && size && itemId ? baseGuide(points, size.w, size.h) : null;

  return (
    // alignSelf:flex-start — flex 부모 안에서 늘어나면 SVG 오버레이가 어긋난다
    <div className="relative inline-block" style={{ maxWidth, alignSelf: 'flex-start' }}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        className="block w-full h-auto"
        onLoad={(e) => {
          const el = e.currentTarget;
          setSize({ w: el.naturalWidth, h: el.naturalHeight });
        }}
      />
      {(base || guide) && size && (
        <svg
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <style>{HALO_CSS}</style>
          <GuideScale.Provider value={{ u: scale, k: size.w / dispW }}>
          {/* 1층: 얼굴 전체 구조 — 샴페인 골드 · 펄 아이보리 */}
          {base && (
            <g opacity={BASE_OPACITY} style={{ filter: BASE_GLOW }}>
              <g className="mm-guide-halo">{base}</g>
              {base}
            </g>
          )}
          {/* 2층: 지금 분석 중인 부위 — 진한 골드 + 은은한 골드 빛 */}
          {guide && (
            <g opacity={ACTIVE_OPACITY} style={{ filter: GLOW }}>
              {guide}
            </g>
          )}
          </GuideScale.Provider>
        </svg>
      )}
    </div>
  );
}
