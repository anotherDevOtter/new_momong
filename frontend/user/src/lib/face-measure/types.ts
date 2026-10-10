// 얼굴 자동 측정 (Python face_landmark → 브라우저 이식) 공통 타입.
// 결과 모양은 Python 모듈 응답(grade · value · description · measurement)과 같다.
// 키만 모듈 번호 대신 화면 항목 id(faceline, facelen …)를 쓴다. (INFRA-MIGRATION §6)

/** MediaPipe 정규화 좌표 (0~1) */
export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

/** 디코딩된 사진 픽셀. RGB(3) 또는 RGBA(4) 순서. alpha 는 무시한다 (cv2.imread 와 같음) */
export interface RgbImage {
  width: number;
  height: number;
  channels: 3 | 4;
  data: Uint8Array | Uint8ClampedArray;
}

export interface Point {
  x: number;
  y: number;
}

export type MeasurementShape =
  | { type: 'point'; point: Point; color?: string; label?: string }
  | { type: 'line' | 'polyline' | 'polygon' | 'rectangle'; points: Point[]; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'circle'; point?: Point; center?: Point; radius: number; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'text'; point: Point; text: string; color?: string; font_size?: number };

export interface Measurement {
  image_size: { width: number; height: number };
  shapes: MeasurementShape[];
}

export type FormGrade = 'W' | 'N' | 'C';
export type PropGrade = 'S' | 'N' | 'H';

export interface MeasureResult {
  name: string;
  grade: string;
  value: number | null;
  description: string;
  measurement: Measurement | null;
}

/** 모듈 입력. 픽셀이 필요한 모듈(눈썹 형태 · 눈썹~눈 거리 · 쌍꺼풀)만 image 를 쓴다 */
export interface MeasureInput {
  landmarks: LandmarkPoint[];
  image: RgbImage;
}

/** 측정 실패(Python 의 return False)는 null */
export type MeasureFn = (input: MeasureInput) => MeasureResult | null;
