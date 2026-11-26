import { getAdminToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';
const BASE = `${API_BASE}/face-analysis/admin/landmark-truth`;

/** 사진 크기 대비 0~1. null = 안 보이는 점 */
export type TruthPoints = Record<string, [number, number] | null>;

export interface TruthFile {
  imageWidth: number;
  imageHeight: number;
  points: TruthPoints;
  updatedAt: string;
}

export interface TruthListItem {
  name: string;
  pointCount: number;
  updatedAt: string | null;
}

function auth(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('admin 로그인이 필요합니다');
  return { Authorization: `Bearer ${token}` };
}

async function json<T>(res: Response, fail: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fail);
  }
  return (await res.json()).data;
}

export async function listTruth(): Promise<{ dir: string; items: TruthListItem[] }> {
  return json(await fetch(BASE, { headers: auth() }), '사진 목록을 불러오지 못했습니다');
}

export async function getTruth(name: string): Promise<TruthFile | null> {
  return json(await fetch(`${BASE}/one?${new URLSearchParams({ name })}`, { headers: auth() }), '정답을 불러오지 못했습니다');
}

export async function saveTruth(body: { name: string; imageWidth: number; imageHeight: number; points: TruthPoints }): Promise<TruthFile> {
  return json(
    await fetch(BASE, { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    '정답 저장 실패',
  );
}

/** 예시 그림 → blob: 주소. 다 쓰면 URL.revokeObjectURL */
export async function fetchExample(name: string): Promise<string> {
  const res = await fetch(`${BASE}/example?${new URLSearchParams({ name })}`, { headers: auth() });
  if (!res.ok) throw new Error(`예시 그림을 받지 못했습니다 (HTTP ${res.status})`);
  return URL.createObjectURL(await res.blob());
}

/** 사진 원본 → blob: 주소. 다 쓰면 URL.revokeObjectURL */
export async function fetchTruthPhoto(name: string): Promise<string> {
  const res = await fetch(`${BASE}/photo?${new URLSearchParams({ name })}`, { headers: auth() });
  if (!res.ok) throw new Error(`사진을 받지 못했습니다 (HTTP ${res.status})`);
  return URL.createObjectURL(await res.blob());
}
