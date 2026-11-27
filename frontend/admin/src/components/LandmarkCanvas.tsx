'use client';

// 사진 위에 측정에 쓰는 랜드마크만 그린다 (랜드마크 검수 화면용).
// 478개 전체가 아니라 lib/face-measure 의 form.ts · prop.ts 가 실제로 읽는 61개 점만, 부위별 색으로.
// 측정 모듈에서 점을 더 쓰게 되면 MEASURE_GROUPS 에도 넣는다.

import { useEffect, useRef } from 'react';
import type { LandmarkPoint } from '@/lib/face-measure';

export interface Layers {
  /** 점 번호 표시 */
  labels: boolean;
}

/** 측정 모듈이 읽는 점 — 부위별 */
export const MEASURE_GROUPS: { id: string; label: string; color: string; points: number[] }[] = [
  {
    id: 'contour',
    label: '얼굴 윤곽·턱',
    color: '#FFFFFF',
    // 이마 10 · 턱끝 152 · 얼굴 폭 127/356 · 광대 234/454 · 턱 172/397 · 얼굴 길이 옆선 · 중안부 150/379/177/401 · 볼 205/425
    points: [10, 9, 338, 337, 152, 127, 356, 123, 352, 234, 454, 172, 397, 150, 379, 177, 401, 205, 425],
  },
  {
    id: 'brow',
    label: '눈썹',
    color: '#FFD60A',
    points: [70, 63, 105, 66, 107, 300, 293, 334, 296, 336],
  },
  {
    id: 'eye',
    label: '눈',
    color: '#32D2FF',
    points: [33, 160, 159, 158, 133, 153, 144, 145, 226, 263, 387, 386, 385, 362, 398, 384, 374, 446],
  },
  {
    id: 'nose',
    label: '코',
    color: '#B98CFF',
    points: [8, 168, 6, 1, 4, 2, 48, 278],
  },
  {
    id: 'lips',
    label: '입',
    color: '#FF6B81',
    points: [0, 13, 14, 17, 61, 291],
  },
];

export default function LandmarkCanvas({
  img,
  landmarks,
  width,
  layers,
}: {
  img: HTMLImageElement;
  landmarks: LandmarkPoint[] | null;
  /** 표시 폭(px). 높이는 사진 비율대로 */
  width: number;
  layers: Layers;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round((width * img.naturalHeight) / img.naturalWidth);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // 그림판 해상도는 사진보다 크게 잡지 않는다 (3배 확대 · 레티나에서 사진보다 몇 배 큰 그림판이 되면 메모리만 쓴다).
    // 사진이 화면보다 작을 때도 1배 밑으로는 내리지 않는다 — 점 · 글자가 흐려지지 않게
    const k = Math.max(1, Math.min(window.devicePixelRatio || 1, img.naturalWidth / width));
    canvas.width = Math.round(width * k);
    canvas.height = Math.round(height * k);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.drawImage(img, 0, 0, width, height);
    if (!landmarks) return;

    const r = Math.max(1.8, Math.min(4, width / 220));
    const fontPx = Math.round(Math.max(10, Math.min(14, width / 60)));
    ctx.font = `600 ${fontPx}px -apple-system, sans-serif`;

    for (const g of MEASURE_GROUPS) {
      for (const i of g.points) {
        const p = landmarks[i];
        if (!p) continue;
        const x = p.x * width;
        const y = p.y * height;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.stroke();
        if (layers.labels) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.strokeText(String(i), x + r + 2, y - r);
          ctx.fillStyle = g.color;
          ctx.fillText(String(i), x + r + 2, y - r);
        }
      }
    }
  }, [img, landmarks, width, height, layers]);

  return <canvas ref={ref} style={{ width, height, display: 'block' }} />;
}

export const LEGEND = MEASURE_GROUPS.map((g) => ({ color: g.color, label: g.label }));
