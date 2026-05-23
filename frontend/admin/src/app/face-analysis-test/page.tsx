'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { FaceOverlay } from '@/components/FaceOverlay';
import { getAdminToken } from '@/utils/auth';
import { prepareImageForAnalysis } from '@/utils/image-resize';
import {
  requestAdminUploadUrl,
  uploadToS3,
  analyzeTest,
  type AnalyzeResponse,
  type AnalysisModule,
} from '@/utils/face-analysis-api';

type ModuleEntry = { key: string; module: AnalysisModule; kind: 'WNC' | 'SNH' };

export default function FaceAnalysisTestPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleEntry | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) router.push('/login');
  }, [router]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    setSelectedModule(null);
    setAnalyzing(true);
    try {
      const { file: prepared, resized, originalSize, finalSize } = await prepareImageForAnalysis(file);
      if (resized) {
        toast.info(`이미지 자동 리사이즈: ${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(finalSize / 1024 / 1024).toFixed(1)}MB`);
      }

      const { uploadUrl, publicUrl } = await requestAdminUploadUrl(prepared.type, prepared.size);
      await uploadToS3(uploadUrl, prepared, prepared.type);
      setImageUrl(publicUrl);

      const res = await analyzeTest(publicUrl);
      setResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 실패';
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const wncModules: ModuleEntry[] = result
    ? Object.entries(result.wnc.results)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([key, module]) => ({ key, module, kind: 'WNC' as const }))
    : [];
  const snhModules: ModuleEntry[] = result
    ? Object.entries(result.snh.results)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([key, module]) => ({ key, module, kind: 'SNH' as const }))
    : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AdminHeader currentPath="/face-analysis-test" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-xl font-medium text-[#111111] mb-1">얼굴 분석 테스트</h1>
        <p className="text-sm text-[#666666] mb-6">
          이미지를 업로드해서 face_landmark 서버의 분석 결과를 확인합니다. 결과는{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">source=admin_test</code> 로 DB 에 저장됩니다.
        </p>

        <div className="bg-white border border-[#E5E5E5] rounded p-6 mb-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <button
            onClick={handlePick}
            disabled={analyzing}
            className="px-4 py-2 bg-[#111111] text-white text-sm rounded hover:bg-[#333333] disabled:bg-[#999999] transition-colors"
          >
            {analyzing ? '분석 중…' : '이미지 선택 + 분석'}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">⚠ {error}</p>}
        </div>

        {result && imageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌: 원본 이미지 + 오버레이 */}
            <div className="bg-white border border-[#E5E5E5] rounded p-4">
              <h2 className="text-sm font-medium text-[#111111] mb-3">
                {selectedModule
                  ? `${selectedModule.kind}#${selectedModule.key} ${selectedModule.module.name} 오버레이`
                  : '원본 이미지 (모듈 선택 시 오버레이 표시)'}
              </h2>
              <FaceOverlay
                imageUrl={imageUrl}
                measurement={selectedModule?.module.measurement || null}
                maxWidth={600}
              />
            </div>

            {/* 우: 결과 표 */}
            <div className="space-y-4">
              <FinalCard
                label="이미지 타입"
                value={`${result.wnc.final} / ${result.snh.final}`}
              />

              <ResultTable
                title="WNC (Warm / Neutral / Cool)"
                entries={wncModules}
                selected={selectedModule}
                onSelect={setSelectedModule}
                counts={result.wnc.counts}
              />

              <ResultTable
                title="SNH (Soft / Neutral / Hard)"
                entries={snhModules}
                selected={selectedModule}
                onSelect={setSelectedModule}
                counts={result.snh.counts}
              />

              <div className="bg-white border border-[#E5E5E5] rounded p-4 text-xs text-[#666666]">
                <button
                  onClick={() => setShowRawJson((v) => !v)}
                  className="text-[#111111] hover:underline"
                >
                  {showRawJson ? '▼' : '▶'} 응답 JSON
                </button>
                {showRawJson && (
                  <pre className="mt-2 max-h-96 overflow-auto text-[10px] leading-snug bg-gray-50 p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FinalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111111] text-white rounded p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#999999]">{label}</div>
      <div className="text-2xl font-medium mt-1">{value}</div>
    </div>
  );
}

interface ResultTableProps {
  title: string;
  entries: ModuleEntry[];
  selected: ModuleEntry | null;
  onSelect: (e: ModuleEntry) => void;
  counts: Record<string, number>;
}

function ResultTable({ title, entries, selected, onSelect, counts }: ResultTableProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded">
      <div className="px-4 py-2 border-b border-[#E5E5E5] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#111111]">{title}</h3>
        <span className="text-xs text-[#666666]">
          {Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' / ')}
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#999999] text-left">
            <th className="px-3 py-1.5 font-normal w-10">#</th>
            <th className="px-3 py-1.5 font-normal">모듈</th>
            <th className="px-3 py-1.5 font-normal w-12 text-center">grade</th>
            <th className="px-3 py-1.5 font-normal w-20 text-right">value</th>
            <th className="px-3 py-1.5 font-normal w-16 text-center">오버레이</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const isSelected = selected?.key === e.key && selected.kind === e.kind;
            return (
              <tr
                key={`${e.kind}-${e.key}`}
                className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] ${isSelected ? 'bg-[#FFF8E1]' : ''}`}
              >
                <td className="px-3 py-1.5 text-[#999999]">{e.key}</td>
                <td className="px-3 py-1.5 text-[#111111]">{e.module.name}</td>
                <td className="px-3 py-1.5 text-center font-medium">{e.module.grade || '-'}</td>
                <td className="px-3 py-1.5 text-right text-[#666666]">
                  {e.module.value != null ? Number(e.module.value).toFixed(2) : '-'}
                </td>
                <td className="px-3 py-1.5 text-center">
                  {e.module.measurement ? (
                    <button
                      onClick={() => onSelect(e)}
                      className={`text-xs px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#111111] text-white'
                          : 'border border-[#999999] text-[#666666] hover:border-[#111111] hover:text-[#111111]'
                      }`}
                    >
                      {isSelected ? '✓' : '보기'}
                    </button>
                  ) : (
                    <span className="text-[#CCCCCC]">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
