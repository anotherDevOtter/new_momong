import { getAdminToken } from './auth';
import type { Measurement } from '@/components/FaceOverlay';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

export interface AnalysisModule {
  name: string;
  grade?: string;
  type?: string;
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
  /** 분석 직후 원본 이미지를 GET 으로 표시하기 위한 presigned URL */
  faceImageDownloadUrl: string;
}

export interface AdminHistoryRecord {
  id: string;
  faceImageUrl: string;
  faceImageDownloadUrl: string;
  detectedAt: string;
  wnc: { id: string; result: WNCResult };
  snh: { id: string; result: SNHResult };
}

function authHeader(): Record<string, string> {
  const token = getAdminToken();
  if (!token) throw new Error('admin 로그인이 필요합니다');
  return { Authorization: `Bearer ${token}` };
}

/**
 * admin 전용: S3 업로드용 presigned URL 발급.
 */
export async function requestAdminUploadUrl(
  contentType: string,
  contentLength?: number,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const res = await fetch(`${API_BASE}/face-analysis/admin/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ contentType, contentLength }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '업로드 URL 발급 실패');
  }
  const json = await res.json();
  return json.data;
}

export async function uploadToS3(uploadUrl: string, file: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`S3 업로드 실패 (HTTP ${res.status})`);
}

/**
 * admin 테스트 분석. source=admin_test 로 저장됨.
 */
export async function analyzeTest(faceImageUrl: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/face-analysis/analyze-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ faceImageUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '얼굴 분석 실패');
  }
  const json = await res.json();
  return json.data;
}

export async function listAdminHistory(limit = 30): Promise<AdminHistoryRecord[]> {
  const res = await fetch(`${API_BASE}/face-analysis/admin/history?limit=${limit}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('기록 목록 조회 실패');
  const json = await res.json();
  return json.data;
}

export async function getAdminRecord(id: string): Promise<AdminHistoryRecord> {
  const res = await fetch(`${API_BASE}/face-analysis/admin/${id}`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('기록 조회 실패');
  const json = await res.json();
  return json.data;
}

export async function deleteAdminRecord(id: string): Promise<{ deleted: number }> {
  const res = await fetch(`${API_BASE}/face-analysis/admin/${id}`, {
    method: 'DELETE',
    headers: authHeader(),
  });
  if (!res.ok) throw new Error('기록 삭제 실패');
  const json = await res.json();
  return json.data;
}
