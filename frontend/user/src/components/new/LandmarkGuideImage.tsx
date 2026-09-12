'use client';

/**
 * 촬영본 위에 랜드마크 기반 가이드선을 얹어 보여준다.
 *
 * 이미지의 실제 픽셀 크기로 viewBox 를 잡아 좌표가 그대로 맞는다.
 * (FaceOverlay 가 파이썬 실측 도형에 쓰는 방식과 같다) (2026-09-11)
 */

import { useEffect, useRef, useState } from 'react';
import type { LandmarkPoint } from './useFaceLandmarks';
import { guideFor } from './faceGuides';

/** 밝은 피부 위에서 흰 선이 묻히지 않게 깔아 주는 옅은 그림자 */
const HALO_CSS = `
.mm-guide-halo line, .mm-guide-halo path {
  stroke: #000000;
  stroke-width: 2.2px;
  stroke-opacity: 0.22;
  fill: none;
  opacity: 1;
}
`;

/** 선이 사진을 덮지 않게 전체를 반투명으로 얹는다 (2026-09-12) */
const GUIDE_OPACITY = 0.6;

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

  // 캐시된 이미지는 마운트 시점에 이미 로드가 끝나 onLoad 가 안 불린다.
  // 그 경우 크기를 못 받아 오버레이가 통째로 안 그려졌다. (2026-09-11)
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth) {
      setSize({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [imageUrl]);
  const guide = points && size && itemId ? guideFor(itemId, points, size.w, size.h) : null;

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
      {guide && size && (
        <svg
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/*
            같은 도형을 옅은 검정으로 한 번 먼저 깔아 그림자를 만든다.
            이마처럼 밝은 데서도 흰 선이 보이게 하려고. (2026-09-11)
          */}
          <style>{HALO_CSS}</style>
          <g opacity={GUIDE_OPACITY}>
            <g className="mm-guide-halo">{guide}</g>
            {guide}
          </g>
        </svg>
      )}
    </div>
  );
}
