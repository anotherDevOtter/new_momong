'use client';

// 브라우저에서 사진 URL 하나로 얼굴 자동 측정을 돌린다.
// 랜드마크는 이목구비 화면 가이드선과 같은 FaceLandmarker(0.10.35 · CPU)를 쓴다.

import { detectLandmarks } from '@/components/new/useFaceLandmarks';
import { analyzeFace, type FaceMeasureResult } from './index';
import type { LandmarkPoint, RgbImage } from './types';

/** 사진 픽셀을 읽는다. 촬영본이 S3 presigned URL 이라 CORS 를 켜야 캔버스로 읽힌다 */
async function loadPixels(url: string): Promise<RgbImage> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('이미지를 불러오지 못했습니다'));
    el.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas context');
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, channels: 4, data };
}

export interface BrowserMeasure {
  result: FaceMeasureResult;
  landmarks: LandmarkPoint[];
  /** 랜드마크 추출 시간 (첫 호출은 모델 다운로드 포함) */
  landmarkMs: number;
  /** 17개 항목 판정 시간 */
  measureMs: number;
}

/** 업로드 전 파일(촬영본)을 그대로 측정한다. 얼굴을 못 찾으면 null */
export async function measureFaceFromFile(file: Blob): Promise<BrowserMeasure | null> {
  const url = URL.createObjectURL(file);
  try {
    return await measureFaceFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 얼굴을 못 찾으면 null */
export async function measureFaceFromUrl(url: string): Promise<BrowserMeasure | null> {
  const t0 = performance.now();
  const [landmarks, image] = await Promise.all([detectLandmarks(url), loadPixels(url)]);
  const t1 = performance.now();
  if (!landmarks) return null;
  const result = analyzeFace({ landmarks, image });
  const t2 = performance.now();
  return { result, landmarks, landmarkMs: t1 - t0, measureMs: t2 - t1 };
}
