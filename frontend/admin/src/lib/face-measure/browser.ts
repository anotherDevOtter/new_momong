'use client';

// 브라우저에서 사진 한 장으로 얼굴 자동 측정을 돌린다 (admin 테스트 페이지용).
// user 앱은 이목구비 화면 가이드선과 랜드마커를 같이 쓰지만, admin 에는 그 훅이 없어 여기서 직접 띄운다.
// 랜드마커 설정은 user 앱(components/new/useFaceLandmarks.ts)과 같다 — 0.10.35 · CPU · IMAGE.

import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { analyzeFace, type FaceMeasureResult } from './index';
import { silenceMediapipeInfoLog } from '@/lib/mediapipeLog';
import type { LandmarkPoint, RgbImage } from './types';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let landmarker: FaceLandmarker | null = null;
let loadPromise: Promise<void> | null = null;

async function loadLandmarker() {
  if (loadPromise) return loadPromise;
  silenceMediapipeInfoLog();   // wasm 을 불러오기 전에 걸어야 한다
  loadPromise = (async () => {
    const { FilesetResolver, FaceLandmarker: FaceLandmarkerClass } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = await FaceLandmarkerClass.createFromOptions(vision, {
      // GPU 델리게이트는 환경에 따라 결과가 비어 돌아온다 (user 앱과 같은 이유로 CPU)
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
      runningMode: 'IMAGE',
      numFaces: 1,
    });
  })();
  // 실패하면 다음 호출에서 다시 시도한다
  loadPromise.catch(() => { loadPromise = null; });
  return loadPromise;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('이미지를 불러오지 못했습니다'));
    el.src = url;
  });
}

function pixelsOf(img: HTMLImageElement): RgbImage {
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
  landmarkMs: number;
  measureMs: number;
}

/** 업로드 전 파일(촬영본)을 그대로 측정한다. 얼굴을 못 찾으면 null */
export async function measureFaceFromFile(file: Blob): Promise<BrowserMeasure | null> {
  const url = URL.createObjectURL(file);
  try {
    const t0 = performance.now();
    await loadLandmarker();
    const img = await loadImage(url);
    const face = landmarker?.detect(img).faceLandmarks?.[0];
    const t1 = performance.now();
    if (!face || !face.length) return null;
    const landmarks = face as LandmarkPoint[];
    const result = analyzeFace({ landmarks, image: pixelsOf(img) });
    return { result, landmarks, landmarkMs: t1 - t0, measureMs: performance.now() - t1 };
  } finally {
    URL.revokeObjectURL(url);
  }
}
