const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

function getToken(): string {
  if (typeof window === 'undefined') throw new Error('localStorage unavailable');
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('인증이 필요합니다');
  return token;
}

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export type MeasurementShape =
  | { type: 'point'; point: Point; color?: string; label?: string }
  | { type: 'line' | 'polyline' | 'polygon' | 'rectangle'; points: Point[]; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'circle'; point: Point; radius: number; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'text'; point: Point; text: string; color?: string; font_size?: number };

export interface Measurement {
  image_size: { width: number; height: number };
  shapes: MeasurementShape[];
}

export interface AnalysisModule {
  name: string;
  grade?: string;
  type?: string; // legacy
  value?: number | null;
  description?: string | null;
  image?: string | null;
  measurement?: Measurement | null;
}

export interface WNCResult {
  final: string;
  counts: { W: number; N: number; C: number };
  results: Record<string, AnalysisModule>;
}

export interface SNHResult {
  final: string;
  counts: { S: number; N: number; H: number };
  results: Record<string, AnalysisModule>;
}

export interface AnalyzeResponse {
  wnc: WNCResult;
  snh: SNHResult;
  metadata: { image_id: string; total_modules: number };
  wncId: string;
  snhId: string;
}

// 얼굴분석 모듈 표시 설정 (전역, admin 관리). 표를 이걸로 동적 렌더 (P2b).
export interface ModuleConfig {
  id: string;
  axis: 'WNC' | 'SNH';
  moduleKey: string;
  label: string;
  order: number;
  display: boolean;
  unit: string | null;
}

// 공개 엔드포인트 — 토큰 불필요
export async function getModuleConfigs(): Promise<ModuleConfig[]> {
  const res = await fetch(`${API_BASE}/module-configs`);
  if (!res.ok) throw new Error('모듈 설정 조회 실패');
  const json = await res.json();
  return (json.data ?? []) as ModuleConfig[];
}

/**
 * S3 업로드용 presigned URL 발급 + 결과 publicUrl 반환.
 */
export async function requestUploadUrl(
  contentType: string,
  ext?: string,
  contentLength?: number,
): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
}> {
  const res = await fetch(`${API_BASE}/face-analysis/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ contentType, ext, contentLength }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '업로드 URL 발급 실패');
  }
  const json = await res.json();
  return json.data;
}

/**
 * presigned PUT URL 로 이미지를 S3 에 직접 업로드.
 */
export async function uploadToS3(uploadUrl: string, file: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`S3 업로드 실패 (HTTP ${res.status})`);
  }
}

/**
 * 업로드된 S3 URL 로 얼굴 분석 요청.
 */
export async function analyzeFace(opts: {
  faceImageUrl: string;
  customerId?: string;
  clientProvidedData?: Record<string, unknown>;
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/face-analysis/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '얼굴 분석 실패');
  }
  const json = await res.json();
  return json.data;
}

/**
 * dataURL → File (이미지 캡처 결과 → S3 업로드용)
 */
export function dataUrlToFile(dataUrl: string, filename = 'face.jpg'): File {
  const [meta, base64] = dataUrl.split(',');
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}
