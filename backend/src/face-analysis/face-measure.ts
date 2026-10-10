import { BadRequestException } from '@nestjs/common';

// 얼굴 자동 측정 결과 — 브라우저(frontend/user/src/lib/face-measure)가 만들어 보낸다.
// 예전 Python 응답과 같은 모양이고, results 키만 모듈 번호 대신 화면 항목 id 다.
// (INFRA-MIGRATION §6 "모듈 키 변경", 2026-10-10)

export interface Point {
  x: number;
  y: number;
  label?: string;
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

export interface AnalysisModule {
  name: string;
  grade: string;
  value: number | null;
  description: string | null;
  measurement: Measurement | null;
}

export interface GroupResult {
  final: string;
  counts: Record<string, number>;
  results: Record<string, AnalysisModule>;
  /** 어떤 측정기가 만든 결과인지 (예전 Python 결과에는 없다) */
  engine?: { name: string; version: string };
}

export type Axis = 'WNC' | 'SNH';

export const GRADES: Record<Axis, string[]> = { WNC: ['W', 'N', 'C'], SNH: ['S', 'N', 'H'] };

/** 화면 항목 id → 예전 Python 모듈 번호. 변환 SQL(migrations/005) · 시드와 같은 표 */
export const LEGACY_KEY: Record<Axis, Record<string, string>> = {
  WNC: { faceline: '2', cheek: '3', browshape: '5', eyeshape: '6', eyetail: '7', nosewidth: '8', lips: '9' },
  SNH: { facelen: '2', thirds: '11', broweye: '4', eyelid: '7', intereye: '5', eyeouter: '6', noselen: '9', philtrum: '12', mouthwidth: '13', chinlen: '14' },
};

/**
 * 받을 수 있는 키 = 화면 항목 id 전부.
 * 모듈이 아직 없는 browdir · eyefront · nosehigh 도 나중에 측정이 생기면 그대로 받도록 열어 둔다.
 */
export const ALLOWED_KEYS: Record<Axis, Set<string>> = {
  // '1' 피부톤 · '10' 코 폭 — 1way 표에만 있는 항목. 예전 번호 키 그대로 받는다 (2026-10-11)
  WNC: new Set([...Object.keys(LEGACY_KEY.WNC), 'browdir', 'eyefront', 'nosehigh', '1']),
  SNH: new Set([...Object.keys(LEGACY_KEY.SNH), '10']),
};

// ── 검증 ─────────────────────────────────────────────────────────────────
// 클라이언트가 만든 결과를 그대로 저장하므로 모양 · 크기를 서버에서 막는다.
// 모르는 필드는 버리고 아는 필드만 다시 조립한다. 보안 민감 데이터는 아니지만
// DB 를 부풀리거나 화면을 깨뜨리는 입력을 막는 것이 목적이다.

const LIMIT = {
  results: 12,
  shapes: 40,
  points: 60,
  text: 120,
  label: 80,
  color: 20,
  coord: 100_000,
  value: 1_000_000,
  imageSide: 20_000,
};

function fail(path: string, why: string): never {
  throw new BadRequestException(`측정 결과 형식 오류: ${path} — ${why}`);
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function num(v: unknown, path: string, max: number, min = -max): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) fail(path, '숫자 범위');
  return v;
}

function str(v: unknown, path: string, max: number): string {
  if (typeof v !== 'string' || v.length > max) fail(path, `${max}자 이하 문자열`);
  return v;
}

function optStr(v: unknown, path: string, max: number): string | undefined {
  return v === undefined || v === null ? undefined : str(v, path, max);
}

function point(v: unknown, path: string): Point {
  if (!isObj(v)) fail(path, '좌표 객체');
  const p: Point = { x: num(v.x, `${path}.x`, LIMIT.coord), y: num(v.y, `${path}.y`, LIMIT.coord) };
  const label = optStr(v.label, `${path}.label`, LIMIT.label);
  if (label !== undefined) p.label = label;
  return p;
}

function shape(v: unknown, path: string): MeasurementShape {
  if (!isObj(v)) fail(path, '도형 객체');
  const style = {
    ...(v.stroke != null && { stroke: str(v.stroke, `${path}.stroke`, LIMIT.color) }),
    ...(v.stroke_width != null && { stroke_width: num(v.stroke_width, `${path}.stroke_width`, 50, 0) }),
    ...(v.fill != null && { fill: str(v.fill, `${path}.fill`, LIMIT.color) }),
    ...(v.dashed != null && { dashed: !!v.dashed }),
    ...(v.label != null && { label: str(v.label, `${path}.label`, LIMIT.label) }),
  };
  switch (v.type) {
    case 'point':
      return {
        type: 'point',
        point: point(v.point, `${path}.point`),
        ...(v.color != null && { color: str(v.color, `${path}.color`, LIMIT.color) }),
        ...(v.label != null && { label: str(v.label, `${path}.label`, LIMIT.label) }),
      };
    case 'line':
    case 'polyline':
    case 'polygon':
    case 'rectangle': {
      if (!Array.isArray(v.points) || v.points.length < 1 || v.points.length > LIMIT.points) fail(`${path}.points`, `1~${LIMIT.points}개`);
      return { type: v.type, points: v.points.map((p, i) => point(p, `${path}.points[${i}]`)), ...style };
    }
    case 'circle': {
      const c = v.point ?? v.center;
      return { type: 'circle', point: point(c, `${path}.point`), radius: num(v.radius, `${path}.radius`, 10_000, 0), ...style };
    }
    case 'text':
      return {
        type: 'text',
        point: point(v.point, `${path}.point`),
        text: str(v.text, `${path}.text`, LIMIT.text),
        ...(v.color != null && { color: str(v.color, `${path}.color`, LIMIT.color) }),
        ...(v.font_size != null && { font_size: num(v.font_size, `${path}.font_size`, 200, 1) }),
      };
    default:
      fail(`${path}.type`, '알 수 없는 도형');
  }
}

function measurement(v: unknown, path: string): Measurement | null {
  if (v === null || v === undefined) return null;
  if (!isObj(v) || !isObj(v.image_size)) fail(path, 'image_size 필요');
  if (!Array.isArray(v.shapes) || v.shapes.length > LIMIT.shapes) fail(`${path}.shapes`, `${LIMIT.shapes}개 이하 배열`);
  return {
    image_size: {
      width: num(v.image_size.width, `${path}.image_size.width`, LIMIT.imageSide, 1),
      height: num(v.image_size.height, `${path}.image_size.height`, LIMIT.imageSide, 1),
    },
    shapes: v.shapes.map((s, i) => shape(s, `${path}.shapes[${i}]`)),
  };
}

/** Python determine_final_grade 와 같은 규칙: 다수결, 동점에 N 이 있으면 N, 아니면 앞선 등급 */
function finalGrade(results: Record<string, AnalysisModule>, cats: string[]) {
  const counts = Object.fromEntries(cats.map((c) => [c, 0])) as Record<string, number>;
  for (const r of Object.values(results)) counts[r.grade]++;
  if (!Object.keys(results).length) return { final: 'Unknown', counts };
  const max = Math.max(...cats.map((c) => counts[c]));
  const winners = cats.filter((c) => counts[c] === max);
  const final = winners.length > 1 && winners.includes(cats[1]) ? cats[1] : winners[0];
  return { final, counts };
}

/**
 * 브라우저가 보낸 한 축(WNC 또는 SNH)의 결과를 검증해 저장할 모양으로 만든다.
 * final · counts 는 받지 않고 서버가 결과에서 다시 계산한다 (한 곳에서만 정해지게).
 */
export function parseGroup(axis: Axis, v: unknown, engine?: GroupResult['engine']): GroupResult {
  const path = axis.toLowerCase();
  if (!isObj(v) || !isObj(v.results)) fail(path, 'results 객체 필요');
  const entries = Object.entries(v.results);
  if (entries.length > LIMIT.results) fail(`${path}.results`, `${LIMIT.results}개 이하`);

  const results: Record<string, AnalysisModule> = {};
  for (const [key, m] of entries) {
    const p = `${path}.results.${key}`;
    if (!ALLOWED_KEYS[axis].has(key)) fail(p, '모르는 항목');
    if (!isObj(m)) fail(p, '객체 필요');
    if (typeof m.grade !== 'string' || !GRADES[axis].includes(m.grade)) fail(`${p}.grade`, GRADES[axis].join('/'));
    results[key] = {
      name: str(m.name, `${p}.name`, 50),
      grade: m.grade,
      value: m.value === null || m.value === undefined ? null : num(m.value, `${p}.value`, LIMIT.value),
      description: m.description === null || m.description === undefined ? null : str(m.description, `${p}.description`, 200),
      measurement: measurement(m.measurement, `${p}.measurement`),
    };
  }
  return { ...finalGrade(results, GRADES[axis]), results, ...(engine && { engine }) };
}

export function parseEngine(v: unknown): GroupResult['engine'] {
  if (!isObj(v)) return undefined;
  return { name: str(v.name, 'engine.name', 40), version: str(v.version, 'engine.version', 20) };
}
