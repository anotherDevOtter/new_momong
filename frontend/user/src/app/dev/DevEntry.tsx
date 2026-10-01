'use client';

import { useSyncExternalStore } from 'react';
import { DEV_CUSTOMER_ID, disableDevMock, enableDevMock, isDevMockOn } from '@/lib/devMock';

const BASE = `/3way/consulting?course=new&customerId=${DEV_CUSTOMER_ID}`;

/** course=new 의 화면들. demoFace=1 은 얼굴을 찍지 않아도 더미 측정값을 채운다 */
const SCREENS: { label: string; note: string; href: string }[] = [
  { label: '요약 (INFO)', note: '사전설문 요약', href: `${BASE}&step=summary` },
  { label: '얼굴 촬영', note: '카메라·업로드', href: `${BASE}&step=faceAnalysis` },
  { label: '이목구비 집중 분석', note: '가이드라인 · 항목별 조정', href: `${BASE}&step=aiFaceFeature&demoFace=1` },
  { label: '최종 이미지타입', note: '핵심 해석 · 영향도', href: `${BASE}&step=aiFaceResultDerived&demoFace=1` },
  { label: '최종 이미지타입 (좌우 섞임)', note: '합산이 Neutral 인 경우', href: `${BASE}&step=aiFaceResultDerived&demoFace=neutral` },
  { label: '헤어 컨설팅', note: '스타일·모질·목표 이미지', href: `${BASE}&step=hairConsulting&demoFace=1` },
  { label: '다음 방향', note: '', href: `${BASE}&step=nextDirection&demoFace=1` },
  { label: '완료 + 리포트', note: '리포트 바로 열기', href: `${BASE}&step=completion&demoFace=1&report=1` },
];

const OTHERS: { label: string; href: string }[] = [
  { label: '코스 선택', href: '/3way' },
  { label: '고객 목록', href: '/customers' },
];

// localStorage 의 목업 플래그를 구독한다 (서버 렌더에서는 꺼짐으로 본다)
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const notify = () => listeners.forEach(cb => cb());

export function DevEntry() {
  const on = useSyncExternalStore(subscribe, isDevMockOn, () => false);

  // 목업은 페이지를 새로 읽을 때 걸리므로, 켠 뒤에는 링크를 통째로 이동(a 태그)한다.
  const start = () => { enableDevMock(); notify(); };
  const stop = () => { disableDevMock(); notify(); };

  return (
    <div className="min-h-screen bg-white px-6 py-10 max-w-2xl mx-auto" style={{ fontFamily: "'Pretendard Variable','Inter',-apple-system,sans-serif" }}>
      <p className="text-[10px] tracking-[0.22em] text-[#AAAAAA] mb-1">DEV ONLY</p>
      <h1 className="text-[1.5rem] font-light text-[#111111] mb-2">로그인 없이 화면 보기</h1>
      <p className="text-[12px] text-[#888888] leading-relaxed mb-6">
        개발 서버에서만 열립니다. 목업을 켜면 가짜 로그인과 가짜 API 응답이 쓰여서 백엔드·DB·고객 등록 없이 화면을 볼 수 있어요.
        저장한 내용은 남지 않습니다.
      </p>

      <div className="flex items-center gap-3 mb-8 p-4 border border-[#E8E8E4] rounded-sm">
        <span className="text-[12px] text-[#111111]">
          목업 <b style={{ color: on ? '#2E7D32' : '#999999' }}>{on ? 'ON' : 'OFF'}</b>
        </span>
        {on ? (
          <button onClick={stop} className="ml-auto px-3 py-2 text-[11px] rounded-sm border border-[#DDDDDD] text-[#666666]" style={{ background: 'transparent', cursor: 'pointer' }}>
            목업 끄기
          </button>
        ) : (
          <button onClick={start} className="ml-auto px-4 py-2 text-[11px] rounded-sm" style={{ background: '#111111', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>
            목업으로 시작
          </button>
        )}
      </div>

      <p className="text-[10px] tracking-[0.18em] text-[#AAAAAA] mb-3">SCREENS · COURSE NEW</p>
      <div className="flex flex-col mb-8" style={{ opacity: on ? 1 : 0.4, pointerEvents: on ? 'auto' : 'none' }}>
        {SCREENS.map(s => (
          <a key={s.href} href={s.href} className="flex items-baseline justify-between py-3 border-b border-[#F0F0EE] hover:bg-[#FAFAF8]">
            <span className="text-[13px] text-[#111111]">{s.label}</span>
            <span className="text-[10px] text-[#AAAAAA]">{s.note}</span>
          </a>
        ))}
      </div>

      <p className="text-[10px] tracking-[0.18em] text-[#AAAAAA] mb-3">OTHERS</p>
      <div className="flex gap-2" style={{ opacity: on ? 1 : 0.4, pointerEvents: on ? 'auto' : 'none' }}>
        {OTHERS.map(o => (
          <a key={o.href} href={o.href} className="px-3 py-2 text-[11px] rounded-sm border border-[#E8E8E4] text-[#444444]">{o.label}</a>
        ))}
      </div>
    </div>
  );
}
