'use client';

// ⚠️ 이 파일은 frontend/user 와 frontend/admin 에 동일한 복사본으로 존재한다.
//    한쪽을 고치면 반드시 나머지도 같이 고칠 것.
//    (합칠 수 없는 이유: ARCHITECTURE.md §3-1 '프론트 공통 코드 중복')

import { useEffect, useRef, useState } from 'react';
import type { FaceDetector } from '@mediapipe/tasks-vision';

// 운영에서 갑자기 깨지지 않도록 npm 설치 버전과 동일한 픽스 버전 사용
const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

let videoDetector: FaceDetector | null = null;
let imageDetector: FaceDetector | null = null;
let loadPromise: Promise<void> | null = null;

async function loadDetectors() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const { FilesetResolver, FaceDetector: FaceDetectorClass } = await import(
      '@mediapipe/tasks-vision'
    );
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    [videoDetector, imageDetector] = await Promise.all([
      FaceDetectorClass.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
      }),
      FaceDetectorClass.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'IMAGE',
      }),
    ]);
  })();
  return loadPromise;
}

export interface DetectedBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export function useFaceDetector() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDetectors()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('face detector load failed', err);
        setError('얼굴 인식 모델 로드 실패');
      });
  }, []);

  return {
    ready,
    error,
    detectInVideo(video: HTMLVideoElement, timestampMs: number): DetectedBox[] {
      if (!videoDetector || video.readyState < 2) return [];
      const result = videoDetector.detectForVideo(video, timestampMs);
      return result.detections
        .map((d) => d.boundingBox)
        .filter((b) => !!b)
        .map((b) => ({
          originX: b!.originX,
          originY: b!.originY,
          width: b!.width,
          height: b!.height,
        }));
    },
    detectInImage(image: HTMLImageElement): DetectedBox[] {
      if (!imageDetector) return [];
      const result = imageDetector.detect(image);
      return result.detections
        .map((d) => d.boundingBox)
        .filter((b) => !!b)
        .map((b) => ({
          originX: b!.originX,
          originY: b!.originY,
          width: b!.width,
          height: b!.height,
        }));
    },
  };
}

/**
 * 얼굴 박스 중심이 가이드 원(타원) 안에 있고
 * 면적이 너무 작거나 크지 않은지 검사.
 *
 * @param box 화면 좌표 기준 얼굴 바운딩 박스 (px)
 * @param container 미리보기 컨테이너 크기 (px)
 * @param ovalRatio 가이드 타원이 컨테이너에서 차지하는 비율 (rx, ry, cx, cy 비율)
 */
export function isFaceInsideOval(
  box: DetectedBox,
  container: { width: number; height: number },
  ovalRatio = { cx: 0.5, cy: 0.44, rx: 0.3, ry: 0.32 },
): { inside: boolean; reason?: string } {
  const cx = ovalRatio.cx * container.width;
  const cy = ovalRatio.cy * container.height;
  const rx = ovalRatio.rx * container.width;
  const ry = ovalRatio.ry * container.height;

  const faceCenterX = box.originX + box.width / 2;
  const faceCenterY = box.originY + box.height / 2;

  // 1. 얼굴 중심이 타원 안에 있는지 (타원 방정식)
  const ellipseValue =
    Math.pow(faceCenterX - cx, 2) / Math.pow(rx, 2) +
    Math.pow(faceCenterY - cy, 2) / Math.pow(ry, 2);
  if (ellipseValue > 1) {
    return { inside: false, reason: '얼굴을 원 안으로 맞춰주세요' };
  }

  // 2. 얼굴이 너무 작은지 (가이드 타원의 50% 미만)
  const faceArea = box.width * box.height;
  const ovalArea = Math.PI * rx * ry;
  if (faceArea < ovalArea * 0.4) {
    return { inside: false, reason: '조금 더 가까이서 촬영해주세요' };
  }

  // 3. 얼굴이 너무 큰지 (가이드 타원 넘침)
  if (box.width > 2 * rx * 1.2 || box.height > 2 * ry * 1.2) {
    return { inside: false, reason: '조금 더 멀리서 촬영해주세요' };
  }

  return { inside: true };
}
