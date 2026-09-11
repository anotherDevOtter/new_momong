'use client';

/**
 * 촬영본에서 얼굴 랜드마크 468점을 브라우저에서 뽑는다.
 *
 * 이목구비 화면의 가이드선이 예시 사진 기준 고정 SVG(AIFaceFeature 의 OVERLAYS)라
 * 고객 얼굴과 어긋났다. 파이썬은 모듈이 있는 항목에만 실측 도형을 주므로
 * 나머지 항목은 맞출 방법이 없었다.
 *
 * 파이썬이 쓰는 것과 같은 MediaPipe FaceMesh 를 브라우저에서 돌려 전 항목의
 * 가이드선을 같은 좌표계로 그린다. 서버는 건드리지 않는다. (2026-09-11)
 *
 * 판정값(WNC/SNH)은 계속 파이썬이 담당한다 — 여기서는 선만 그린다.
 */

import { useEffect, useRef, useState } from 'react';
import type { FaceLandmarker } from '@mediapipe/tasks-vision';

// useFaceDetector 와 같은 픽스 버전을 쓴다 — 운영에서 갑자기 깨지지 않게
const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

/** 0~1 로 정규화된 좌표. 이미지 크기와 무관하다 */
export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

let landmarker: FaceLandmarker | null = null;
let loadPromise: Promise<void> | null = null;

async function loadLandmarker() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const { FilesetResolver, FaceLandmarker: FaceLandmarkerClass } = await import(
      '@mediapipe/tasks-vision'
    );
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = await FaceLandmarkerClass.createFromOptions(vision, {
      // GPU 델리게이트는 환경에 따라 결과가 비어 돌아온다. 가이드선 용도라
      // 속도보다 안정성이 중요해 CPU 를 쓴다. (2026-09-11)
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
      runningMode: 'IMAGE',
      numFaces: 1,
    });
  })();
  return loadPromise;
}

/** 이미지 한 장에서 468점을 뽑는다. 얼굴을 못 찾으면 null */
export async function detectLandmarks(imageUrl: string): Promise<LandmarkPoint[] | null> {
  await loadLandmarker();
  if (!landmarker) return null;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    // 촬영본이 S3 presigned URL 이라 CORS 를 켜 두지 않으면 캔버스로 못 읽는다
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('이미지를 불러오지 못했습니다'));
    el.src = imageUrl;
  });

  const result = landmarker.detect(img);
  const face = result.faceLandmarks?.[0];
  return face && face.length ? (face as LandmarkPoint[]) : null;
}

/**
 * 사진이 바뀔 때마다 랜드마크를 다시 뽑는다.
 * 모델을 내려받는 동안 loading 이 true 가 된다 (첫 호출만 몇 초 걸린다).
 */
export function useFaceLandmarks(imageUrl: string | null | undefined) {
  const [points, setPoints] = useState<LandmarkPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 사진을 빠르게 바꿔도 늦게 끝난 결과가 새 결과를 덮지 않게 한다
  const reqRef = useRef(0);

  useEffect(() => {
    if (!imageUrl) {
      setPoints(null);
      setError(null);
      return;
    }
    const seq = ++reqRef.current;
    setLoading(true);
    setError(null);

    detectLandmarks(imageUrl)
      .then((pts) => {
        if (seq !== reqRef.current) return;
        setPoints(pts);
        if (!pts) setError('얼굴을 찾지 못했습니다');
      })
      .catch((e: unknown) => {
        if (seq !== reqRef.current) return;
        console.warn('[landmarks] 추출 실패', e);
        setPoints(null);
        setError(e instanceof Error ? e.message : '랜드마크 추출 실패');
      })
      .finally(() => {
        if (seq === reqRef.current) setLoading(false);
      });
  }, [imageUrl]);

  return { points, loading, error };
}
