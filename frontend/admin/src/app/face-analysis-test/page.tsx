'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import { FaceOverlay } from '@/components/FaceOverlay';
import { AdminFaceAnalysisCapture } from '@/components/AdminFaceAnalysisCapture';
import { getAdminToken } from '@/utils/auth';
import {
  listAdminHistory,
  deleteAdminRecord,
  type AnalysisModule,
  type AdminHistoryRecord,
  type AnalyzeResponse,
  type WNCResult,
  type SNHResult,
} from '@/utils/face-analysis-api';

type Tab = 'analyze' | 'history';
type ModuleEntry = { key: string; module: AnalysisModule; kind: 'WNC' | 'SNH' };

export default function FaceAnalysisTestPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('analyze');

  // 분석하기 탭
  const [currentResult, setCurrentResult] = useState<AnalyzeResponse | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleEntry | null>(null);

  // 이전 기록 탭
  const [history, setHistory] = useState<AdminHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) router.push('/login');
  }, [router]);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const list = await listAdminHistory();
      setHistory(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '기록 로드 실패');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') refreshHistory();
  }, [tab, refreshHistory]);

  const handleCaptureNext = (result: AnalyzeResponse) => {
    setCurrentResult(result);
    setSelectedModule(null);
    refreshHistory(); // 기록 탭에서 바로 보이도록 미리 동기화
    // 캡처 UI 가 자동으로 숨겨지므로 별도 스크롤 불필요
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 기록을 삭제할까요? (DB 행만 삭제)')) return;
    try {
      await deleteAdminRecord(id);
      toast.success('삭제 완료');
      refreshHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AdminHeader currentPath="/face-analysis-test" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-xl font-medium text-[#111111] mb-1">얼굴 분석 테스트</h1>
        <p className="text-sm text-[#666666] mb-6">
          face_landmark 분석 도구.{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">source=admin_test</code> 로 DB 에 저장됩니다.
        </p>

        {/* 탭 */}
        <div className="flex border-b border-[#E5E5E5] mb-6">
          <button
            onClick={() => setTab('analyze')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === 'analyze' ? 'border-[#111111] text-[#111111] font-medium' : 'border-transparent text-[#999999] hover:text-[#111111]'
            }`}
          >
            얼굴 분석하기
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
              tab === 'history' ? 'border-[#111111] text-[#111111] font-medium' : 'border-transparent text-[#999999] hover:text-[#111111]'
            }`}
          >
            이전 기록 보기
          </button>
        </div>

        {tab === 'analyze' ? (
          <AnalyzeTab
            currentResult={currentResult}
            selectedModule={selectedModule}
            setSelectedModule={setSelectedModule}
            onCaptureNext={handleCaptureNext}
            onReset={() => {
              setCurrentResult(null);
              setSelectedModule(null);
            }}
          />
        ) : (
          <HistoryTab
            history={history}
            loading={historyLoading}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

/* ─────────────────── 분석하기 탭 ─────────────────── */

interface AnalyzeTabProps {
  currentResult: AnalyzeResponse | null;
  selectedModule: ModuleEntry | null;
  setSelectedModule: (m: ModuleEntry | null) => void;
  onCaptureNext: (result: AnalyzeResponse) => void;
  onReset: () => void;
}

function AnalyzeTab({ currentResult, selectedModule, setSelectedModule, onCaptureNext, onReset }: AnalyzeTabProps) {
  // 분석 완료 후엔 캡처 UI 를 숨기고 결과만 표시. 새로 분석하려면 "다시 분석하기" 클릭.
  if (currentResult) {
    return (
      <>
        <div className="mb-4 flex justify-end">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm border border-[#111111] text-[#111111] rounded hover:bg-[#FAFAFA] transition-colors"
          >
            ↺ 다시 분석하기
          </button>
        </div>
        <ResultView
          result={currentResult}
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
        />
      </>
    );
  }

  return (
    <div className="bg-white border border-[#E5E5E5] rounded">
      <AdminFaceAnalysisCapture onNext={(result) => onCaptureNext(result)} />
    </div>
  );
}

/* ─────────────────── 이전 기록 탭 ─────────────────── */

interface HistoryTabProps {
  history: AdminHistoryRecord[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function HistoryTab({ history, loading, onDelete }: HistoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedByRecord, setSelectedByRecord] = useState<Record<string, ModuleEntry | null>>({});

  if (loading) return <p className="text-sm text-[#999999] py-8 text-center">기록을 불러오는 중…</p>;
  if (history.length === 0)
    return (
      <p className="text-sm text-[#999999] py-12 text-center bg-white border border-[#E5E5E5] rounded">
        아직 분석 기록이 없습니다. "얼굴 분석하기" 탭에서 첫 분석을 진행해보세요.
      </p>
    );

  return (
    <div className="space-y-2">
      {history.map((rec) => {
        const isOpen = expandedId === rec.id;
        const wncFinal = (rec.wnc.result as WNCResult).final;
        const snhFinal = (rec.snh.result as SNHResult).final;
        return (
          <div key={rec.id} className="bg-white border border-[#E5E5E5] rounded overflow-hidden">
            {/* 헤더: 클릭 시 펼침 */}
            <div className="flex items-center px-4 py-3 hover:bg-[#FAFAFA] cursor-pointer" onClick={() => setExpandedId(isOpen ? null : rec.id)}>
              <button className="text-[#666666] mr-2" aria-label="toggle">
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {/* 썸네일 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rec.faceImageDownloadUrl} alt="thumb" className="w-12 h-12 object-cover rounded mr-3" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#111111]">
                  {wncFinal} / {snhFinal}
                </div>
                <div className="text-xs text-[#999999]">{new Date(rec.detectedAt).toLocaleString('ko-KR')}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(rec.id);
                }}
                className="ml-3 px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* 펼친 본문: 결과 + 오버레이 */}
            {isOpen && (
              <div className="border-t border-[#E5E5E5] p-4 bg-[#FAFAFA]">
                <ResultView
                  result={{
                    wnc: rec.wnc.result as WNCResult,
                    snh: rec.snh.result as SNHResult,
                    faceImageDownloadUrl: rec.faceImageDownloadUrl,
                    wncId: rec.wnc.id,
                    snhId: rec.snh.id,
                    metadata: { image_id: rec.id, total_modules: 0 },
                  }}
                  selectedModule={selectedByRecord[rec.id] || null}
                  setSelectedModule={(m) => setSelectedByRecord((prev) => ({ ...prev, [rec.id]: m }))}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── 결과 표시 공통 컴포넌트 ─────────────────── */

interface ResultViewProps {
  result: AnalyzeResponse;
  selectedModule: ModuleEntry | null;
  setSelectedModule: (m: ModuleEntry | null) => void;
}

function ResultView({ result, selectedModule, setSelectedModule }: ResultViewProps) {
  const wncModules: ModuleEntry[] = Object.entries(result.wnc.results)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, module]) => ({ key, module, kind: 'WNC' as const }));
  const snhModules: ModuleEntry[] = Object.entries(result.snh.results)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, module]) => ({ key, module, kind: 'SNH' as const }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-[#E5E5E5] rounded p-4">
        <h2 className="text-sm font-medium text-[#111111] mb-3">
          {selectedModule
            ? `${selectedModule.kind}#${selectedModule.key} ${selectedModule.module.name} 오버레이`
            : '원본 이미지 (모듈 선택 시 오버레이 표시)'}
        </h2>
        <FaceOverlay
          imageUrl={result.faceImageDownloadUrl}
          measurement={selectedModule?.module.measurement || null}
          maxWidth={600}
        />
      </div>
      <div className="space-y-4">
        <div className="bg-[#111111] text-white rounded p-4">
          <div className="text-[10px] uppercase tracking-wider text-[#999999]">이미지 타입</div>
          <div className="text-2xl font-medium mt-1">
            {result.wnc.final} / {result.snh.final}
          </div>
        </div>
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
      </div>
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
