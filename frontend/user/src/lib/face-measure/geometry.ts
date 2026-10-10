// Python 모듈과 같은 계산을 하기 위한 작은 도우미들.

import type { LandmarkPoint, MeasurementShape, Point } from './types';

export type P = [number, number];

/** Python 의 pt(): 정규화 좌표 → 픽셀 정수 좌표 (int() = 0 쪽으로 버림) */
export function pt(lm: LandmarkPoint[], i: number, w: number, h: number): P {
  return [Math.trunc(lm[i].x * w), Math.trunc(lm[i].y * h)];
}

export function dist(a: P, b: P): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Python 의 // (정수 내림 나눗셈) */
export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Python 의 round(x, n) */
export function round(x: number, n: number): number {
  return Number(x.toFixed(n));
}

/** f'{x:.nf}' */
export function fmt(x: number, n: number): string {
  return x.toFixed(n);
}

/** 세 점의 각도 (p2 가 꼭짓점), 도 단위 */
export function angleAt(p1: P, p2: P, p3: P): number {
  const v1x = p1[0] - p2[0];
  const v1y = p1[1] - p2[1];
  const v2x = p3[0] - p2[0];
  const v2y = p3[1] - p2[1];
  const cos = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

export const deg = (rad: number) => (rad * 180) / Math.PI;

// ── measurement 도형 (Python 모듈이 내는 것과 같은 속성) ──────────────────

const WHITE = '#FFFFFF';

export const xy = (x: number, y: number): Point => ({ x: Math.trunc(x), y: Math.trunc(y) });
export const toPt = (p: P): Point => xy(p[0], p[1]);

export function line(a: Point, b: Point, label: string, dashed = false, stroke = WHITE): MeasurementShape {
  return { type: 'line', points: [a, b], stroke, stroke_width: 2, dashed, label };
}

export function polyline(points: Point[], label: string): MeasurementShape {
  return { type: 'polyline', points, stroke: WHITE, stroke_width: 2, dashed: false, label };
}

export function dot(p: Point, label: string): MeasurementShape {
  return { type: 'point', point: p, color: WHITE, label };
}

export function text(p: Point, t: string, fontSize: number, color = WHITE): MeasurementShape {
  return { type: 'text', point: p, text: t, color, font_size: fontSize };
}
