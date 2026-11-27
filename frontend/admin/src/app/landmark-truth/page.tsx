'use client';

// 랜드마크 정답 입력 (로컬 · 운영은 관리자 본인 계정만) —판정에 쓰는 점끼리 묶어 6단계로 확인한다 (얼굴 윤곽 → 상중하안부 → 눈 → 눈썹 → 코 → 입).
// 단계마다 그 부위로 확대해 MediaPipe 가 찍은 위치와 판정 선을 보여 준다. 틀린 점만 끌어서 옮기고 '다음'.
// '다음'을 누를 때마다 자동 저장. 이렇게 모은 정답으로 여러 검출 방법을 채점한다 (tools/landmark-bench).

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getAdminToken } from '@/utils/auth';
import { detectLandmarksFromUrl } from '@/lib/face-measure/browser';
import { MIDLINE_ANCHORS, MIDLINE_POINTS, POINT_BY_ID, STEPS, TRUTH_POINTS, seedPosition } from '@/lib/landmark-truth/points';
import LandmarkExample from '@/components/LandmarkExample';
import LocalOnlyNotice from '@/components/LocalOnlyNotice';
import { useIsOwner } from '@/lib/localOnly';
import { fetchTruthPhoto, getTruth, listTruth, saveTruth, type TruthListItem, type TruthPoints } from '@/utils/landmark-truth-api';

type XY = [number, number];
const TOTAL = TRUTH_POINTS.length;
const HIT_PX = 16;

/** 미간–턱끝 직선. 두 점 중 하나라도 없으면 null */
function midline(pos: Record<string, XY | null>): { a: XY; d: XY } | null {
  const a = pos[MIDLINE_ANCHORS[0]];
  const b = pos[MIDLINE_ANCHORS[1]];
  if (!a || !b) return null;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len < 1e-6) return null;
  return { a, d: [(b[0] - a[0]) / len, (b[1] - a[1]) / len] };
}

/** 점을 직선 위 가장 가까운 곳으로 (정규화 좌표 — 사진 비율 aspect = 높이/너비 를 맞춰 계산) */
function project(v: XY, line: { a: XY; d: XY }, aspect: number): XY {
  // 정규화 좌표는 가로세로 단위가 달라서 픽셀 비율로 바꿔 투영한다
  const ax = line.a[0];
  const ay = line.a[1] * aspect;
  const dx = line.d[0];
  const dy = line.d[1] * aspect;
  const dl = Math.hypot(dx, dy);
  const ux = dx / dl;
  const uy = dy / dl;
  const t = (v[0] - ax) * ux + (v[1] * aspect - ay) * uy;
  return [ax + ux * t, (ay + uy * t) / aspect];
}

export default function LandmarkTruthPage() {
  const owner = useIsOwner();
  if (owner === null) return null; // 운영: 토큰 확인 전
  return owner ? <LandmarkTruth /> : <LocalOnlyNotice owner />;
}

function LandmarkTruth() {
  const router = useRouter();
  const [items, setItems] = useState<TruthListItem[]>([]);
  const [dir, setDir] = useState('');
  const [idx, setIdx] = useState(-1);

  const loadList = useCallback(async () => {
    try {
      const r = await listTruth();
      setItems(r.items);
      setDir(r.dir);
      return r.items;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '목록을 불러오지 못했습니다');
      return [];
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push('/login');
      return;
    }
    loadList().then((list) => {
      const first = list.findIndex((i) => i.pointCount < TOTAL);
      setIdx(list.length ? (first < 0 ? 0 : first) : -1);
    });
  }, [loadList, router]);

  // 저장할 때마다 목록 전체를 다시 받지 않고, 그 사진의 점 개수만 고친다
  const markSaved = useCallback(
    (n: string, pointCount: number) => setItems((its) => its.map((i) => (i.name === n ? { ...i, pointCount } : i))),
    [],
  );

  const done = items.filter((i) => i.pointCount >= TOTAL).length;
  const item = items[idx];

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <AdminHeader currentPath="/landmark-truth" />
      <div className="flex items-center gap-3 px-6 py-3 text-sm">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx <= 0} className="rounded px-2 py-1 hover:bg-gray-200 disabled:opacity-30">
          ‹
        </button>
        <select value={idx} onChange={(e) => setIdx(Number(e.target.value))} className="rounded border bg-white px-2 py-1">
          {items.map((it, i) => (
            <option key={it.name} value={i}>
              사진 {i + 1} {it.pointCount >= TOTAL ? '· 완료' : it.pointCount ? '· 하는 중' : ''}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          disabled={idx >= items.length - 1}
          className="rounded px-2 py-1 hover:bg-gray-200 disabled:opacity-30"
        >
          ›
        </button>
        <span className="text-gray-500">
          완료 {done} / {items.length}장
        </span>
      </div>
      {item ? (
        <Editor key={item.name} name={item.name} onSaved={markSaved} onFinished={() => setIdx((i) => (i < items.length - 1 ? i + 1 : i))} />
      ) : (
        <p className="px-6 text-sm text-gray-500">{idx === -1 && dir ? `사진이 없습니다 — ${dir}/images 에 넣으세요` : '불러오는 중…'}</p>
      )}
    </div>
  );
}

function Editor({ name, onSaved, onFinished }: { name: string; onSaved: (name: string, pointCount: number) => void; onFinished: () => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, XY | null>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomMul, setZoomMul] = useState(1);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<{ sx: number; sy: number; sw: number; sh: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<string | null>(null);
  const dragStart = useRef<XY | null>(null);
  const [showExample, setShowExample] = useState(false);
  const [lockMidline, setLockMidline] = useState(true);
  const hiddenFrom = useRef<Record<string, XY>>({});
  const posRef = useRef(pos);
  posRef.current = pos;
  const seeds = useRef<Record<string, XY>>({});

  const step = STEPS[stepIdx];

  // ── 사진 · 처음 위치 ─────────────────────────────────────────────────────
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        objectUrl = await fetchTruthPhoto(name);
        if (cancelled) {
          // 받는 사이에 다른 사진으로 넘어갔다 — 정리 함수는 이미 지나갔으니 여기서 버린다
          URL.revokeObjectURL(objectUrl);
          return;
        }
        const [{ img: el, landmarks }, saved] = await Promise.all([detectLandmarksFromUrl(objectUrl), getTruth(name)]);
        if (cancelled) return;
        const initial: Record<string, XY | null> = {};
        for (const p of TRUTH_POINTS) {
          const v: XY = !landmarks ? [0.5, 0.5] : p.mp !== null ? [landmarks[p.mp].x, landmarks[p.mp].y] : seedPosition(p.id, landmarks);
          initial[p.id] = v;
          seeds.current[p.id] = v;
        }
        const conf = new Set<string>();
        for (const [id, v] of Object.entries(saved?.points ?? {})) {
          if (!POINT_BY_ID[id]) continue;
          initial[id] = v;
          conf.add(id);
        }
        const first = STEPS.findIndex((s) => s.points.some((id) => !conf.has(id)));
        setPos(initial);
        setConfirmed(conf);
        setStepIdx(first < 0 ? 0 : first);
        setImg(el);
        if (!landmarks) toast.warning('얼굴을 자동으로 못 찾았습니다 — 점을 직접 옮겨 주세요');
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '사진을 불러오지 못했습니다');
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [name]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  // ── 보이는 영역: 단계가 바뀔 때만 다시 잡는다 (점을 옮길 때 화면이 움직이면 어지럽다) ──
  useEffect(() => {
    if (!img || !box.w || !box.h) return;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const pts = [...step.points, ...(step.refs ?? [])]
      .map((id) => pos[id] ?? seeds.current[id])
      .filter(Boolean)
      .map((v) => [v![0] * W, v![1] * H]);
    if (!pts.length) return;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    let vw = Math.max(Math.max(...xs) - Math.min(...xs), W * 0.12) * 1.6 * zoomMul;
    let vh = Math.max(Math.max(...ys) - Math.min(...ys), H * 0.08) * 1.6 * zoomMul;
    // 화면 비율에 맞춘다
    if (vw / vh < box.w / box.h) vw = (vh * box.w) / box.h;
    else vh = (vw * box.h) / box.w;
    vw = Math.min(vw, W);
    vh = Math.min(vh, H);
    setView({
      sx: Math.min(Math.max(cx - vw / 2, 0), W - vw),
      sy: Math.min(Math.max(cy - vh / 2, 0), H - vh),
      sw: vw,
      sh: vh,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, box, stepIdx, zoomMul]);

  // 사진 좌표(0~1) ↔ 화면 좌표
  const geom = (() => {
    if (!img || !view) return null;
    const s = Math.min(box.w / view.sw, box.h / view.sh);
    const ox = (box.w - view.sw * s) / 2;
    const oy = (box.h - view.sh * s) / 2;
    return {
      toScreen: (v: XY): XY => [ox + (v[0] * img.naturalWidth - view.sx) * s, oy + (v[1] * img.naturalHeight - view.sy) * s],
      toImage: (x: number, y: number): XY => [
        Math.min(1, Math.max(0, (view.sx + (x - ox) / s) / img.naturalWidth)),
        Math.min(1, Math.max(0, (view.sy + (y - oy) / s) / img.naturalHeight)),
      ],
      s,
      ox,
      oy,
    };
  })();

  // ── 그리기 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !img || !view || !geom) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = box.w * dpr;
    c.height = box.h * dpr;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, box.w, box.h);
    ctx.drawImage(img, view.sx, view.sy, view.sw, view.sh, geom.ox, geom.oy, view.sw * geom.s, view.sh * geom.s);

    // 판정 선
    for (const g of step.guides) {
      const pts = g.ids.map((id) => pos[id]).filter((v): v is XY => !!v).map(geom.toScreen);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash(g.dashed ? [6, 5] : []);
      ctx.beginPath();
      if (g.horizontal) {
        for (const [, y] of pts) {
          ctx.moveTo(0, y);
          ctx.lineTo(box.w, y);
        }
      } else {
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 가운데 선 (고정 중이고, 이 단계에 가운데 점이 있을 때)
    const line = midline(pos);
    if (lockMidline && line && step.points.some((id) => MIDLINE_POINTS.includes(id))) {
      const [x1, y1] = geom.toScreen([line.a[0] - line.d[0] * 2, line.a[1] - line.d[1] * 2]);
      const [x2, y2] = geom.toScreen([line.a[0] + line.d[0] * 2, line.a[1] + line.d[1] * 2]);
      ctx.strokeStyle = 'rgba(50,210,255,0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 참고 점 (앞 단계)
    for (const id of step.refs ?? []) {
      const v = pos[id];
      if (!v) continue;
      const [x, y] = geom.toScreen(v);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }

    // 이 단계의 점
    ctx.font = '600 12px system-ui, sans-serif';
    const placed: { x: number; y: number; w: number }[] = [];
    for (const id of step.points) {
      const v = pos[id];
      if (!v) continue;
      const [x, y] = geom.toScreen(v);
      const sel = id === selected;
      ctx.beginPath();
      ctx.arc(x, y, sel ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = sel ? '#FF3B30' : '#FFD60A';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      const label = POINT_BY_ID[id].short;
      const tw = ctx.measureText(label).width + 8;
      // 이름표가 겹치면 점 왼쪽에 붙인다 (입을 다물면 입술 안쪽 두 점이 거의 같은 곳에 있다)
      const overlaps = (lx: number) => placed.some((p) => Math.abs(p.y - (y - 9)) < 18 && lx < p.x + p.w && p.x < lx + tw);
      const lx = overlaps(x + 9) ? x - 9 - tw : x + 9;
      placed.push({ x: lx, y: y - 9, w: tw });
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(lx, y - 9, tw, 18);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, lx + 4, y + 4);
    }
  }, [img, view, box, pos, step, selected, lockMidline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 저장 ────────────────────────────────────────────────────────────────
  // 점을 놓을 때마다, 그리고 '다음'을 누를 때 저장한다. 확정된 점(conf)만 정답으로 남는다.
  // 저장은 한 줄로 세운다: 앞 저장이 끝나야 다음을 보내고, 보낼 때는 그때까지 쌓인 것 중 '가장 최근 상태' 하나만.
  // (요청이 겹치면 늦게 도착한 예전 위치가 정답으로 남을 수 있다)
  const pendingRef = useRef<TruthPoints | null>(null);
  const arrowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const persist = useCallback(
    (p: Record<string, XY | null>, conf: Set<string>): Promise<boolean> => {
      if (!img) return Promise.resolve(false);
      // 이보다 앞선 방향키 저장 예약은 버린다 — 이번 상태가 더 최신이다
      if (arrowTimer.current) {
        clearTimeout(arrowTimer.current);
        arrowTimer.current = null;
      }
      const points: TruthPoints = {};
      for (const t of TRUTH_POINTS) if (conf.has(t.id)) points[t.id] = p[t.id] ?? null;
      pendingRef.current = points;
      chainRef.current = chainRef.current.then(async () => {
        const snap = pendingRef.current;
        if (!snap) return true; // 앞 차례에서 이미 최신 상태를 보냈다
        pendingRef.current = null;
        try {
          await saveTruth({ name, imageWidth: img.naturalWidth, imageHeight: img.naturalHeight, points: snap });
          onSaved(name, Object.keys(snap).length);
          return true;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : '저장 실패');
          return false;
        }
      });
      return chainRef.current;
    },
    [img, name, onSaved],
  );

  // 방향키는 누르고 있으면 초당 수십 번 — 멈춘 뒤 한 번만 저장 (아래 onKey).
  // 예약이 남은 채 다른 사진으로 넘어가면 기다리지 않고 바로 저장한다
  const arrowSave = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      if (arrowTimer.current) {
        clearTimeout(arrowTimer.current);
        arrowSave.current?.();
      }
    },
    [],
  );

  /** 가운데 선 고정이면 가운데 점들을 선 위로 (선을 정하는 미간 · 턱끝이 움직였을 때도) */
  const applyMidline = useCallback(
    (p: Record<string, XY | null>): Record<string, XY | null> => {
      if (!lockMidline || !img) return p;
      const line = midline(p);
      if (!line) return p;
      const aspect = img.naturalHeight / img.naturalWidth;
      const out = { ...p };
      for (const id of MIDLINE_POINTS) if (out[id]) out[id] = project(out[id]!, line, aspect);
      return out;
    },
    [lockMidline, img],
  );

  const next = useCallback(async () => {
    if (!img) return;
    const conf = new Set(confirmed);
    step.points.forEach((id) => conf.add(id));
    const p = applyMidline(pos);
    setPos(p);
    if (!(await persist(p, conf))) return;
    setConfirmed(conf);
    setSelected(null);
    setZoomMul(1);
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else {
      toast.success('이 사진 완료 — 다음 사진으로');
      onFinished();
    }
  }, [img, confirmed, step, pos, stepIdx, applyMidline, persist, onFinished]);

  const toggleHidden = (id: string) => {
    let v: XY | null;
    if (pos[id]) {
      hiddenFrom.current[id] = pos[id]!;
      v = null;
    } else v = hiddenFrom.current[id] ?? seeds.current[id];
    const p = { ...pos, [id]: v };
    const conf = new Set(confirmed).add(id);
    setPos(p);
    setConfirmed(conf);
    persist(p, conf);
  };

  // ── 마우스: 점을 잡아 끈다 ───────────────────────────────────────────────
  const local = (e: React.PointerEvent<HTMLCanvasElement>): XY => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!geom) return;
    const [x, y] = local(e);
    let hit: string | null = null;
    let best = HIT_PX;
    for (const id of step.points) {
      const v = pos[id];
      if (!v) continue;
      const [px, py] = geom.toScreen(v);
      const d = Math.hypot(px - x, py - y);
      if (d < best) {
        best = d;
        hit = id;
      }
    }
    setSelected(hit);
    if (hit) {
      dragging.current = hit;
      dragStart.current = pos[hit];
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const id = dragging.current;
    if (!id || !geom || !img) return;
    const [x, y] = local(e);
    let v = geom.toImage(x, y);
    // Shift: 처음 위치에서 가로 또는 세로로만
    const s = dragStart.current;
    if (e.shiftKey && s) {
      const dx = Math.abs(v[0] - s[0]) * img.naturalWidth;
      const dy = Math.abs(v[1] - s[1]) * img.naturalHeight;
      v = dx >= dy ? [v[0], s[1]] : [s[0], v[1]];
    }
    setPos((p) => applyMidline({ ...p, [id]: v }));
  };
  const onUp = () => {
    const id = dragging.current;
    if (!id) return;
    dragging.current = null;
    dragStart.current = null;
    // 놓는 순간 저장 — 옮긴 점은 확정
    const conf = new Set(confirmed).add(id);
    setConfirmed(conf);
    persist(posRef.current, conf);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!img || showExample) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === '?' || e.key === 'h') {
        setShowExample(true);
      } else if (selected && pos[selected] && geom && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const [x, y] = geom.toScreen(pos[selected]!);
        const d = e.shiftKey ? 5 : 1;
        const [nx, ny] = { ArrowLeft: [x - d, y], ArrowRight: [x + d, y], ArrowUp: [x, y - d], ArrowDown: [x, y + d] }[e.key] as XY;
        const p = applyMidline({ ...pos, [selected]: geom.toImage(nx, ny) });
        const conf = new Set(confirmed).add(selected);
        setPos(p);
        setConfirmed(conf);
        if (arrowTimer.current) clearTimeout(arrowTimer.current);
        arrowSave.current = () => persist(p, conf);
        arrowTimer.current = setTimeout(() => arrowSave.current?.(), 300);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [img, next, selected, pos, geom, showExample, applyMidline, confirmed, persist]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;

  const hidden = step.points.filter((id) => pos[id] === null);

  return (
    <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
      <div ref={boxRef} className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-gray-900">
        {img ? (
          <canvas
            ref={canvasRef}
            style={{ width: box.w, height: box.h, cursor: 'default', touchAction: 'none' }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        ) : (
          <div className="p-8 text-gray-400">불러오는 중…</div>
        )}
        <div className="absolute bottom-3 right-3 flex overflow-hidden rounded-lg bg-white/90 text-lg shadow">
          <button onClick={() => setZoomMul((z) => Math.min(6, z * 1.4))} className="px-3 py-1 hover:bg-gray-100" title="넓게 보기">
            −
          </button>
          <button onClick={() => setZoomMul((z) => Math.max(0.3, z / 1.4))} className="border-l px-3 py-1 hover:bg-gray-100" title="확대">
            +
          </button>
        </div>
      </div>

      <aside className="flex w-80 shrink-0 flex-col rounded-xl bg-white p-6 shadow-sm">
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 flex-1 rounded-full ${i < stepIdx ? 'bg-blue-600' : i === stepIdx ? 'bg-blue-300' : 'bg-gray-100'}`} />
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {stepIdx + 1} / {STEPS.length}
        </div>

        <h2 className="mt-4 text-2xl font-bold">{step.title}</h2>
        <p className="mt-1 text-xs text-gray-400">{step.judgments.join(' · ')}</p>
        <p className="mt-4 text-sm leading-6 text-gray-600">{step.tip}</p>
        <button
          onClick={() => setShowExample(true)}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          예시 그림 보기 <span className="text-xs font-normal text-blue-400">H</span>
        </button>

        <p className="mt-4 text-sm font-medium text-gray-800">틀린 점만 끌어서 옮기세요.</p>
        <p className="mt-1 text-xs text-gray-500">Shift 를 누른 채 끌면 가로 · 세로로만 움직입니다.</p>

        {step.points.some((id) => MIDLINE_POINTS.includes(id)) && (
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={lockMidline}
              onChange={(e) => {
                setLockMidline(e.target.checked);
              }}
              className="mt-0.5"
            />
            <span>
              <b className="text-gray-800">가운데 선 고정</b> — 얼굴 가운데 점을 미간–턱끝 직선(하늘색 점선) 위에만 둡니다
            </span>
          </label>
        )}

        {selected && (
          <button onClick={() => toggleHidden(selected)} className="mt-3 self-start rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            &lsquo;{POINT_BY_ID[selected].short}&rsquo; 안 보임 (가려짐)
          </button>
        )}
        {hidden.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            안 보임:{' '}
            {hidden.map((id) => (
              <button key={id} onClick={() => toggleHidden(id)} className="mr-1 underline">
                {POINT_BY_ID[id].short} 되돌리기
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <button onClick={next} disabled={!img} className="rounded-lg bg-gray-900 py-3 text-base font-semibold text-white disabled:opacity-40">
            {stepIdx < STEPS.length - 1 ? '다음' : '완료'} <span className="ml-1 text-xs font-normal text-gray-400">Enter</span>
          </button>
          <button
            onClick={() => {
              setStepIdx((i) => Math.max(0, i - 1));
              setSelected(null);
              setZoomMul(1);
            }}
            disabled={stepIdx === 0}
            className="py-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            ← 이전 단계
          </button>
        </div>
      </aside>
      {showExample && <LandmarkExample step={step} onClose={() => setShowExample(false)} />}
    </div>
  );
}
