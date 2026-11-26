import { getAdminToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';
const BASE = `${API_BASE}/face-analysis/admin/landmark-review`;

export type Verdict = 'ok' | 'bad';
export type ReviewFilter = 'all' | 'unchecked' | 'ok' | 'bad';
export type ReviewSource = 'consultation' | 'admin_test' | 'all';

/** 틀린 부위 — 화면에 그리는 점 묶음(LandmarkCanvas MEASURE_GROUPS)과 같다. 백엔드 LANDMARK_PARTS 의 일부 */
export const PARTS = [
  { id: 'contour', label: '얼굴 윤곽·턱' },
  { id: 'brow', label: '눈썹' },
  { id: 'eye', label: '눈' },
  { id: 'nose', label: '코' },
  { id: 'lips', label: '입' },
  { id: 'other', label: '기타' },
] as const;
export type Part = (typeof PARTS)[number]['id'];

export interface Review {
  verdict: Verdict;
  badParts: Part[];
  note: string | null;
  reviewedAt: string;
}

export interface ReviewItem {
  faceImageUrl: string;
  source: string;
  detectedAt: string;
  review: Review | null;
}

export interface ReviewCounts {
  total: number;
  unchecked: number;
  ok: number;
  bad: number;
}

function headers(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('admin 로그인이 필요합니다');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function json<T>(res: Response, fail: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || fail);
  }
  return (await res.json()).data;
}

export async function listReviews(opts: {
  filter: ReviewFilter;
  source: ReviewSource;
  limit: number;
  offset: number;
}): Promise<{ items: ReviewItem[]; counts: ReviewCounts }> {
  const q = new URLSearchParams({
    filter: opts.filter,
    source: opts.source,
    limit: String(opts.limit),
    offset: String(opts.offset),
  });
  return json(await fetch(`${BASE}?${q}`, { headers: headers() }), '검수 목록을 불러오지 못했습니다');
}

export async function saveReview(body: {
  faceImageUrl: string;
  verdict: Verdict;
  badParts: Part[];
  note: string;
}): Promise<Review> {
  return json(
    await fetch(BASE, { method: 'POST', headers: headers(), body: JSON.stringify(body) }),
    '검수 저장 실패',
  );
}

/**
 * 사진 원본을 백엔드를 거쳐 받는다 (S3 직접 X — 버킷 CORS 에 이 화면 주소가 없어도 되게).
 * 돌려준 blob: 주소는 다 쓰면 URL.revokeObjectURL 로 정리한다.
 */
export async function fetchPhotoObjectUrl(faceImageUrl: string): Promise<string> {
  const token = getAdminToken();
  if (!token) throw new Error('admin 로그인이 필요합니다');
  const res = await fetch(`${BASE}/photo?${new URLSearchParams({ url: faceImageUrl })}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `사진을 받지 못했습니다 (HTTP ${res.status})`);
  }
  return URL.createObjectURL(await res.blob());
}

export async function clearReview(faceImageUrl: string): Promise<void> {
  await json(
    await fetch(`${BASE}/clear`, { method: 'POST', headers: headers(), body: JSON.stringify({ faceImageUrl }) }),
    '검수 취소 실패',
  );
}
