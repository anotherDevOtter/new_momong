const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string {
  if (typeof window === 'undefined') throw new Error('localStorage unavailable');
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('인증이 필요합니다');
  return token;
}

export interface WNCResult {
  final: string;
  counts: { W: number; N: number; C: number };
  results: Record<string, { type: string; value: number; name: string }>;
}

export interface SNHResult {
  final: string;
  counts: { S: number; N: number; H: number };
  results: Record<string, { type: string; value: number; name: string }>;
}

export interface AnalyzeResponse {
  wnc: WNCResult;
  snh: SNHResult;
  metadata: { image_id: string; total_modules: number };
  wncId: string;
  snhId: string;
}

/**
 * S3 업로드용 presigned URL 발급 + 결과 publicUrl 반환.
 */
export async function requestUploadUrl(contentType: string, ext?: string): Promise<{
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
    body: JSON.stringify({ contentType, ext }),
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
