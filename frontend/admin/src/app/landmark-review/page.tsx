'use client';

// 랜드마크 검수 — 지금까지 분석한 얼굴 사진마다 MediaPipe 랜드마크를 다시 뽑아 그려 보여 주고,
// 점이 제자리에 찍혔는지 가/부를 남긴다. 부일 때는 틀린 부위를 고른다.
// 랜드마크는 저장돼 있지 않아서 브라우저에서 다시 뽑는다 — 고객 화면과 같은 모델 · 설정 (0.10.35 · CPU · IMAGE).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import LocalOnlyNotice from '@/components/LocalOnlyNotice';
import { IS_LOCAL_DEV } from '@/lib/localOnly';
import LandmarkCanvas, { LEGEND, type Layers } from '@/components/LandmarkCanvas';
import { getAdminToken } from '@/utils/auth';
import { detectLandmarksFromUrl } from '@/lib/face-measure/browser';
import type { LandmarkPoint } from '@/lib/face-measure';
import {
  PARTS,
  clearReview,
  fetchPhotoObjectUrl,
  listReviews,
  saveReview,
  type Part,
  type ReviewCounts,
  type ReviewFilter,
  type ReviewItem,
  type ReviewSource,
  type Verdict,
} from '@/utils/landmark-review-api';

const PAGE = 24;
const CARD_W = 260;

type Detection =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; img: HTMLImageElement; landmarks: LandmarkPoint[] | null };

const FILTERS: { id: ReviewFilter; label: string; count: (c: ReviewCounts) => number }[] = [
  { id: 'unchecked', label: '미검수', count: (c) => c.unchecked },
  { id: 'bad', label: '부', count: (c) => c.bad },
  { id: 'ok', label: '가', count: (c) => c.ok },
  { id: 'all', label: '전체', count: (c) => c.total },
];

const SOURCES: { id: ReviewSource; label: string }[] = [
  { id: 'consultation', label: '실제 상담' },
  { id: 'admin_test', label: '관리자 테스트' },
  { id: 'all', label: '모두' },
];

const matches = (filter: ReviewFilter, item: ReviewItem) =>
  filter === 'all' || (filter === 'unchecked' ? !item.review : item.review?.verdict === filter);

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function LandmarkReviewPage() {
  return IS_LOCAL_DEV ? <LandmarkReview /> : <LocalOnlyNotice />;
}

function LandmarkReview() {
  const router = useRouter();
  const [filter, setFilter] = useState<ReviewFilter>('unchecked');
  const [source, setSource] = useState<ReviewSource>('consultation');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [counts, setCounts] = useState<ReviewCounts | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState<Layers>({ labels: false });
  const [detections, setDetections] = useState<Record<string, Detection>>({});
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // ── 목록 ────────────────────────────────────────────────────────────────
  const load = useCallback(
    async (append: boolean, current: ReviewItem[] = []) => {
      setLoading(true);
      try {
        // 이 화면에서 검수해 필터에서 빠진 것은 서버 기준 순번에서도 빠졌으니 그만큼 당겨서 받는다
        const offset = append ? current.filter((i) => matches(filter, i)).length : 0;
        const { items: next, counts: c } = await listReviews({ filter, source, limit: PAGE, offset });
        setItems(append ? [...current, ...next.filter((n) => !current.some((i) => i.faceImageUrl === n.faceImageUrl))] : next);
        setCounts(c);
        setHasMore(next.length === PAGE);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : '목록을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    },
    [filter, source],
  );

  useEffect(() => {
    if (!getAdminToken()) {
      router.push('/login');
      return;
    }
    setOpenIdx(null);
    load(false);
  }, [load, router]);

  const refreshCounts = useCallback(async () => {
    try {
      const { counts: c } = await listReviews({ filter: 'all', source, limit: 1, offset: 0 });
      setCounts(c);
    } catch {
      /* 집계만 못 바꾼 것 — 다음 목록 조회 때 맞춰진다 */
    }
  }, [source]);

  // ── 랜드마크 검출: 한 장씩 차례로 ─────────────────────────────────────────
  const detectionsRef = useRef(detections);
  detectionsRef.current = detections;
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    const queue = items.filter((i) => !detectionsRef.current[i.faceImageUrl]);
    if (!queue.length) return;
    runningRef.current = true;
    (async () => {
      for (const item of queue) {
        const url = item.faceImageUrl;
        if (detectionsRef.current[url]) continue;
        setDetections((d) => ({ ...d, [url]: { status: 'loading' } }));
        try {
          const objectUrl = await fetchPhotoObjectUrl(url);
          try {
            const { img, landmarks } = await detectLandmarksFromUrl(objectUrl);
            setDetections((d) => ({ ...d, [url]: { status: 'done', img, landmarks } }));
          } finally {
            // 이미지는 이미 디코딩돼 캔버스에 그릴 수 있다
            URL.revokeObjectURL(objectUrl);
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          setDetections((d) => ({ ...d, [url]: { status: 'error', message } }));
        }
      }
      runningRef.current = false;
      // 도는 동안 목록이 늘었으면 이어서 (상태를 한 번 건드려 effect 를 다시 돌린다)
      setDetections((d) => ({ ...d }));
    })();
  }, [items, detections]);

  // ── 저장 ────────────────────────────────────────────────────────────────
  const save = async (item: ReviewItem, verdict: Verdict, badParts: Part[], note: string) => {
    try {
      const review = await saveReview({ faceImageUrl: item.faceImageUrl, verdict, badParts, note });
      setItems((list) => list.map((i) => (i.faceImageUrl === item.faceImageUrl ? { ...i, review } : i)));
      refreshCounts();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '저장 실패');
      return false;
    }
  };

  const clear = async (item: ReviewItem) => {
    try {
      await clearReview(item.faceImageUrl);
      setItems((list) => list.map((i) => (i.faceImageUrl === item.faceImageUrl ? { ...i, review: null } : i)));
      refreshCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '취소 실패');
    }
  };

  const open = openIdx != null ? items[openIdx] : null;

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/landmark-review" />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-lg font-medium text-[#111111] mb-2">랜드마크 검수</h1>
        <p className="text-sm text-[#999999] mb-6">
          지금까지 분석한 얼굴 사진에 고객 화면과 같은 모델로 랜드마크를 다시 찍어 보여 줍니다.
          점이 제자리에 있으면 <b className="text-[#111111]">가</b>, 어긋났으면 <b className="text-[#111111]">부</b>와 틀린 부위를 골라 주세요.
          사진을 누르면 크게 볼 수 있습니다.
        </p>

        {/* 필터 · 표시 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 h-8 text-sm rounded-full border ${
                  filter === f.id ? 'bg-[#111111] text-white border-[#111111]' : 'text-[#555] border-[#E5E5E5] hover:border-[#111111]'
                }`}
              >
                {f.label}
                {counts && <span className="ml-1 opacity-60">{f.count(counts)}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ReviewSource)}
              className="h-8 border border-[#E5E5E5] rounded px-2 text-sm"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <LayerToggles layers={layers} onChange={setLayers} />
          </div>
        </div>
        <Legend />

        {counts && counts.total > 0 && (
          <div className="mb-6 h-1.5 w-full bg-[#F2F2F2] rounded-full overflow-hidden flex">
            <div className="bg-[#22A06B]" style={{ width: `${(counts.ok / counts.total) * 100}%` }} />
            <div className="bg-[#E5484D]" style={{ width: `${(counts.bad / counts.total) * 100}%` }} />
          </div>
        )}

        {!loading && items.length === 0 && <div className="text-sm text-[#999999] py-20 text-center">해당하는 사진이 없습니다.</div>}

        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_W}px, 1fr))` }}>
          {items.map((item, idx) => (
            <div key={item.faceImageUrl} className="border border-[#E5E5E5] rounded-lg overflow-hidden flex flex-col">
              <button onClick={() => setOpenIdx(idx)} className="bg-[#111] flex justify-center" title="크게 보기">
                <Photo detection={detections[item.faceImageUrl]} width={CARD_W} layers={layers} />
              </button>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between text-xs text-[#999999]">
                  <span>{fmtDate(item.detectedAt)}</span>
                  {item.source !== 'consultation' && <span className="px-1.5 rounded bg-[#F2F2F2]">테스트</span>}
                </div>
                <ReviewControls item={item} onSave={save} onClear={clear} compact />
              </div>
            </div>
          ))}
        </div>

        <div className="py-10 text-center">
          {loading ? (
            <span className="text-sm text-[#999999]">불러오는 중...</span>
          ) : (
            hasMore && (
              <button onClick={() => load(true, items)} className="px-5 h-9 text-sm border border-[#E5E5E5] rounded-full hover:border-[#111111]">
                더 보기
              </button>
            )
          )}
        </div>
      </main>

      {open && openIdx != null && (
        <Viewer
          item={open}
          index={openIdx}
          total={items.length}
          detection={detections[open.faceImageUrl]}
          onNav={(d) => setOpenIdx((i) => (i == null ? i : Math.min(items.length - 1, Math.max(0, i + d))))}
          onClose={() => setOpenIdx(null)}
          onSave={save}
          onClear={clear}
        />
      )}
    </div>
  );
}

// ── 사진 + 랜드마크 ───────────────────────────────────────────────────────

function Photo({ detection, width, layers }: { detection?: Detection; width: number; layers: Layers }) {
  if (!detection || detection.status === 'loading') {
    return <div style={{ width, height: width * 1.25 }} className="flex items-center justify-center text-xs text-[#888]">랜드마크 찾는 중...</div>;
  }
  if (detection.status === 'error') {
    return (
      <div style={{ width, height: width * 1.25 }} className="flex flex-col items-center justify-center text-xs text-[#E5484D] px-4 text-center gap-1">
        <span>사진 또는 랜드마크를 불러오지 못했습니다</span>
        <span className="text-[#888] break-all">{detection.message}</span>
      </div>
    );
  }
  return (
    <div className="relative">
      <LandmarkCanvas img={detection.img} landmarks={detection.landmarks} width={width} layers={layers} />
      {!detection.landmarks && (
        <div className="absolute inset-x-0 top-2 text-center">
          <span className="px-2 py-0.5 text-xs bg-[#E5484D] text-white rounded">얼굴을 찾지 못함</span>
        </div>
      )}
    </div>
  );
}

function LayerToggles({ layers, onChange }: { layers: Layers; onChange: (l: Layers) => void }) {
  const items: { key: keyof Layers; label: string }[] = [{ key: 'labels', label: '점 번호' }];
  return (
    <div className="flex items-center gap-3">
      {items.map((t) => (
        <label key={t.key} className="flex items-center gap-1 text-[#555] cursor-pointer select-none">
          <input type="checkbox" checked={layers[t.key]} onChange={(e) => onChange({ ...layers, [t.key]: e.target.checked })} />
          {t.label}
        </label>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 mb-4 text-xs text-[#777]">
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm border border-[#ccc]" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

// ── 가/부 ─────────────────────────────────────────────────────────────────

function ReviewControls({
  item,
  onSave,
  onClear,
  compact,
  badRequestKey,
}: {
  item: ReviewItem;
  onSave: (item: ReviewItem, v: Verdict, parts: Part[], note: string) => Promise<boolean>;
  onClear: (item: ReviewItem) => void;
  compact?: boolean;
  /** 값이 바뀌면 '부' 입력을 연다 (확대 화면의 키보드 2) */
  badRequestKey?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [parts, setParts] = useState<Part[]>(item.review?.badParts ?? []);
  const [note, setNote] = useState(item.review?.note ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditing(false);
    setParts(item.review?.badParts ?? []);
    setNote(item.review?.note ?? '');
  }, [item.faceImageUrl, item.review]);

  useEffect(() => {
    if (badRequestKey) setEditing(true);
  }, [badRequestKey]);

  const submit = async (v: Verdict) => {
    if (v === 'bad' && !parts.length) {
      toast.error('틀린 부위를 하나 이상 골라 주세요');
      return;
    }
    setSaving(true);
    if (await onSave(item, v, v === 'ok' ? [] : parts, v === 'ok' ? '' : note)) setEditing(false);
    setSaving(false);
  };

  const r = item.review;
  if (r && !editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${r.verdict === 'ok' ? 'text-[#22A06B]' : 'text-[#E5484D]'}`}>
            {r.verdict === 'ok' ? '가' : '부'}
            {r.verdict === 'bad' && r.badParts.length > 0 && (
              <span className="ml-1.5 font-normal text-xs">
                {r.badParts.map((p) => PARTS.find((x) => x.id === p)?.label ?? p).join(' · ')}
              </span>
            )}
          </span>
          <span className="flex gap-2 text-xs text-[#999999]">
            <button onClick={() => setEditing(true)} className="hover:text-[#111]">수정</button>
            <button onClick={() => onClear(item)} className="hover:text-[#111]">취소</button>
          </span>
        </div>
        {r.note && <p className="text-xs text-[#777] whitespace-pre-wrap">{r.note}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={() => submit('ok')}
          className="flex-1 h-9 text-sm rounded border border-[#22A06B] text-[#22A06B] hover:bg-[#22A06B] hover:text-white disabled:opacity-50"
        >
          가{!compact && <span className="ml-1 text-xs opacity-60">(1)</span>}
        </button>
        <button
          disabled={saving}
          onClick={() => setEditing(true)}
          className={`flex-1 h-9 text-sm rounded border border-[#E5484D] ${
            editing ? 'bg-[#E5484D] text-white' : 'text-[#E5484D] hover:bg-[#E5484D] hover:text-white'
          } disabled:opacity-50`}
        >
          부{!compact && <span className="ml-1 text-xs opacity-60">(2)</span>}
        </button>
      </div>
      {editing && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {PARTS.map((p) => {
              const on = parts.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => setParts((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                  className={`px-2 h-7 text-xs rounded-full border ${on ? 'bg-[#E5484D] text-white border-[#E5484D]' : 'border-[#E5E5E5] text-[#555]'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="메모 (선택) — 예: 왼쪽 눈썹 꼬리가 실제보다 아래"
            rows={2}
            className="text-xs border border-[#E5E5E5] rounded p-2 resize-none"
          />
          <div className="flex gap-2">
            <button disabled={saving} onClick={() => submit('bad')} className="flex-1 h-8 text-sm rounded bg-[#E5484D] text-white disabled:opacity-50">
              부로 저장
            </button>
            <button onClick={() => setEditing(false)} className="px-3 h-8 text-sm text-[#999999]">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 크게 보기 ─────────────────────────────────────────────────────────────

function Viewer({
  item,
  index,
  total,
  detection,
  onNav,
  onClose,
  onSave,
  onClear,
}: {
  item: ReviewItem;
  index: number;
  total: number;
  detection?: Detection;
  onNav: (d: number) => void;
  onClose: () => void;
  onSave: (item: ReviewItem, v: Verdict, parts: Part[], note: string) => Promise<boolean>;
  onClear: (item: ReviewItem) => void;
}) {
  const [zoom, setZoom] = useState(1);
  // 확대 화면은 번호를 켠 채로 연다 — 어느 점이 어긋났는지 메모하기 쉽게
  const [layers, setLayers] = useState<Layers>({ labels: true });
  const [badKey, setBadKey] = useState(0);
  const base = useMemo(() => (typeof window === 'undefined' ? 600 : Math.min(720, window.innerWidth - 420)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNav(1);
      else if (e.key === 'ArrowLeft') onNav(-1);
      else if (e.key === '1' && !item.review) onSave(item, 'ok', [], '').then((ok) => ok && onNav(1));
      else if (e.key === '2') setBadKey((k) => k + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose, onNav, onSave]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex" onClick={onClose}>
      <div className="flex-1 overflow-auto flex items-start justify-center p-6" onClick={(e) => e.stopPropagation()}>
        {detection?.status === 'done' ? (
          <div className="relative">
            <LandmarkCanvas img={detection.img} landmarks={detection.landmarks} width={Math.max(240, base) * zoom} layers={layers} />
            {!detection.landmarks && (
              <div className="absolute inset-x-0 top-3 text-center">
                <span className="px-2 py-0.5 text-sm bg-[#E5484D] text-white rounded">얼굴을 찾지 못함</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-white text-sm mt-20">{detection?.status === 'error' ? detection.message : '랜드마크 찾는 중...'}</div>
        )}
      </div>
      <aside className="w-[360px] shrink-0 bg-white h-full overflow-auto p-5 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#999999]">
            {index + 1} / {total}
          </span>
          <button onClick={onClose} className="text-sm text-[#999999] hover:text-[#111]">닫기 (Esc)</button>
        </div>
        <div className="text-xs text-[#999999]">{fmtDate(item.detectedAt)}</div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[#999999]">확대</span>
          <div className="flex gap-1">
            {[1, 1.5, 2, 3].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 h-8 text-sm rounded border ${zoom === z ? 'bg-[#111] text-white border-[#111]' : 'border-[#E5E5E5]'}`}
              >
                {z}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs text-[#999999]">표시</span>
          <LayerToggles layers={layers} onChange={setLayers} />
        </div>

        <div className="border-t border-[#E5E5E5] pt-5">
          <ReviewControls item={item} onSave={onSave} onClear={onClear} badRequestKey={badKey} />
        </div>

        <div className="flex gap-2">
          <button onClick={() => onNav(-1)} disabled={index === 0} className="flex-1 h-9 text-sm border border-[#E5E5E5] rounded disabled:opacity-40">
            ← 이전
          </button>
          <button onClick={() => onNav(1)} disabled={index >= total - 1} className="flex-1 h-9 text-sm border border-[#E5E5E5] rounded disabled:opacity-40">
            다음 →
          </button>
        </div>
        <p className="text-xs text-[#999999] leading-relaxed">
          키보드: ← → 이동 · 1 가(저장 후 다음) · 2 부 · Esc 닫기
        </p>
        <Legend />
      </aside>
    </div>
  );
}
