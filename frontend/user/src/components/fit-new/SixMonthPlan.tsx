'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MONO } from '@/components/new/faceAnalysisData';
import {
  SERVICES, SERVICE_ORDER, SERVICE_DETAILS, SERVICE_KO,
  computeNextCare, computeNextDesign, computeCycleEvents, weekToMonthHint,
  type ServiceKey,
} from '@/components/new/NextDirection';
import type { CycleMonth, SixMonthCycle } from '@/types';

// ─────────────────────────────────────────────────────────────────────────
// FIT-NEW 6개월 관리 플랜 (2026-10-28)
//
//   오늘의 시술 선택 → 6개월 관리 주기 자동 생성 → 결과 페이지에 '방문 후 6개월 관리 플랜'
//
// 계산은 new 코스 NextDirection 것을 그대로 쓴다 — 주기 규칙이 두 군데로 갈라지지 않게.
// 화면 모양도 NextDirection 의 TODAY SERVICE · 6 MONTH DESIGN CYCLE 섹션,
// 리포트 모양은 PremiumReportV2 의 같은 장을 옮겼다.
// ─────────────────────────────────────────────────────────────────────────

const GOLD = '#B8963C';

/**
 * 자동 주기 → 기존 FIT 의 월별 로드맵(selectedMonths) 꼴.
 * 공유 링크·고객 상세가 이 값을 읽으므로 같이 채워 둔다. 같은 달은 하나로 합친다.
 */
export function toCycleMonths(events: SixMonthCycle['cycleEvents']): CycleMonth[] {
  const byMonth = new Map<string, CycleMonth>();
  for (const ev of events) {
    if (ev.services.length === 0) continue;   // 6개월 재확인처럼 시술 없는 방문은 로드맵에 안 싣는다
    const entry = byMonth.get(ev.monthHint) ?? { month: ev.monthHint, services: [], memo: '' };
    for (const s of ev.services) if (!entry.services.includes(s)) entry.services.push(s);
    entry.memo = entry.memo ? `${entry.memo} · ${ev.purpose}` : ev.purpose;
    byMonth.set(ev.monthHint, entry);
  }
  return [...byMonth.values()];
}

const SectionHeader = ({ label, title, sub, right }: { label: string; title: string; sub?: string; right?: React.ReactNode }) => (
  <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
    <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', color: '#AAAAAA', marginBottom: 20 }}>{label}</p>
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 style={{ fontSize: 27, fontWeight: 300, color: '#111111', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12, color: '#AAAAAA', marginTop: 4, fontWeight: 300 }}>{sub}</p>}
      </div>
      {right}
    </div>
  </div>
);

// ── 입력 — After Note 안에 들어간다 ─────────────────────────────────────

interface SixMonthPlanInputProps {
  initial?: SixMonthCycle | null;
  /** 고객 정보의 성별. 시술 주기가 성별로 다르다 (커트 여 7–9주 / 남 3–4주) */
  gender: 'female' | 'male' | '';
  onChange: (cycle: SixMonthCycle) => void;
}

export function SixMonthPlanInput({ initial, gender: clientGender, onChange }: SixMonthPlanInputProps) {
  const [gender, setGender] = useState<'female' | 'male'>(initial?.gender ?? (clientGender || 'female'));
  const [todayServices, setTodayServices] = useState<ServiceKey[]>((initial?.todayServices ?? []) as ServiceKey[]);
  const [todayDetails, setTodayDetails] = useState<Record<string, string[]>>(initial?.todayDetails ?? {});

  const cycleEvents = useMemo(() => computeCycleEvents(todayServices, gender), [todayServices, gender]);

  useEffect(() => {
    onChange({
      todayServices,
      todayDetails,
      gender,
      nextCare: computeNextCare(todayServices, gender),
      nextDesign: computeNextDesign(todayServices, gender),
      cycleEvents,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayServices, todayDetails, gender, cycleEvents]);

  const toggleService = (key: ServiceKey) => {
    setTodayServices(prev => {
      if (prev.includes(key)) {
        setTodayDetails(d => { const n = { ...d }; delete n[key]; return n; });
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const toggleDetail = (key: ServiceKey, opt: string) => {
    setTodayDetails(prev => {
      const cur = prev[key] ?? [];
      return { ...prev, [key]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] };
    });
  };

  return (
    <div>
      {/* ── TODAY SERVICE ── */}
      <div className="mb-14">
        <SectionHeader
          label="TODAY SERVICE"
          title="오늘의 시술"
          sub="진행한 시술을 모두 선택해주세요"
          right={
            <div style={{ display: 'flex', border: '1px solid #E0E0DC', overflow: 'hidden', flexShrink: 0 }}>
              {(['female', 'male'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  style={{
                    padding: '10px 20px', fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em',
                    background: gender === g ? 'rgba(26,26,26,0.06)' : 'transparent',
                    color: gender === g ? '#1A1A1A' : '#AAAAAA',
                    border: 'none', cursor: 'pointer',
                  }}
                >{g === 'female' ? '여성' : '남성'}</button>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: 6, marginBottom: 4 }}>
          {SERVICE_ORDER.map(key => {
            const meta = SERVICES[key];
            const isOn = todayServices.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleService(key)}
                style={{
                  padding: '12px 6px', border: `1px solid ${isOn ? '#1A1A1A' : '#E0E0DC'}`,
                  background: isOn ? 'rgba(26,26,26,0.06)' : 'transparent',
                  cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: '#555550' }}>{meta.label}</span>
                <span style={{ fontSize: 15, fontWeight: 400, color: '#AAAAAA' }}>{meta.ko}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {todayServices.filter(k => SERVICE_DETAILS[k]).map(key => {
            const selected = todayDetails[key] ?? [];
            return (
              <motion.div key={key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '11px 0', borderTop: '1px solid #EEEEE9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.14em', color: '#AAAAAA', flexShrink: 0, minWidth: 62 }}>{SERVICES[key].label}</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {SERVICE_DETAILS[key]!.map(opt => {
                      const active = selected.includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => toggleDetail(key, opt)} style={{
                          padding: '4px 11px', fontSize: 11, fontWeight: 300,
                          border: `1px solid ${active ? GOLD : '#E0E0DC'}`,
                          background: active ? 'rgba(184,150,60,0.07)' : 'transparent',
                          color: active ? GOLD : '#888880',
                          cursor: 'pointer', borderRadius: 1,
                        }}>{opt}</button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── 6 MONTH DESIGN CYCLE — 시술을 고르면 자동으로 생긴다 ── */}
      {todayServices.length > 0 && (
        <div className="mb-6">
          <SectionHeader label="6 MONTH DESIGN CYCLE" title="6개월 관리 주기" sub="방문일 기준 자동 계산 — 결과 페이지에 반영됩니다" />

          <div style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{ width: 100, flexShrink: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 500, color: '#111111', marginBottom: 2, lineHeight: 1.3 }}>{weekToMonthHint(0)}</p>
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: '#111111', fontWeight: 500 }}>오늘</p>
            </div>
            <div style={{ flex: 1, paddingLeft: 16, borderLeft: '1px solid #E0E0DC', paddingBottom: 32 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                {todayServices.map(k => (
                  <span key={k} style={{ fontSize: 13, color: '#111111', padding: '2px 10px', border: '1px solid #1A1A1A' }}>{SERVICE_KO[k]}</span>
                ))}
              </div>
              <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em', color: '#CCCCCA', marginTop: 7 }}>오늘 진행한 시술</p>
            </div>
          </div>

          {cycleEvents.map((ev, i) => {
            const isReview = ev.type === 'REVIEW';
            const isLast = i === cycleEvents.length - 1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: 100, flexShrink: 0, paddingTop: 2 }}>
                  <p style={{ fontSize: 17, fontWeight: 500, color: isReview ? GOLD : '#111111', marginBottom: 2, lineHeight: 1.3 }}>{ev.monthHint}</p>
                  <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: isReview ? '#C9AE72' : '#AAAAA5' }}>{ev.label}</p>
                </div>
                <div style={{ flex: 1, paddingLeft: 16, borderLeft: `1px solid ${isLast ? 'transparent' : '#E0E0DC'}`, paddingBottom: isLast ? 0 : 28 }}>
                  <p style={{ fontSize: 15, color: isReview ? GOLD : '#111111', lineHeight: 1.35, marginTop: 2, marginBottom: ev.services.length > 0 ? 7 : 0 }}>{ev.purpose}</p>
                  {ev.services.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {ev.services.map(s => (
                        <span key={s} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em', padding: '4px 10px', border: '1px solid #DDDDD9', color: '#AAAAAA' }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 리포트 — 결과 페이지의 '방문 후 6개월 관리 플랜' ───────────────────

/** hideTitle — 결과 페이지처럼 바깥에 이미 제목이 있을 때 */
export function SixMonthPlanReport({ cycle, hideTitle }: { cycle: SixMonthCycle; hideTitle?: boolean }) {
  if (cycle.todayServices.length === 0) return null;

  const todayLabel = cycle.todayServices.map(k => SERVICES[k as ServiceKey]?.label ?? k).join(' · ');
  const plan = [
    { label: '오늘', monthHint: weekToMonthHint(0), title: todayLabel, sub: '오늘 진행한 시술' },
    ...cycle.cycleEvents.map(ev => ({ label: ev.label, monthHint: ev.monthHint, title: ev.services.join(' · '), sub: ev.purpose })),
  ];
  const fmtWeeks = (min: number, max: number) => (min === max ? `약 ${min}주 후` : `${min}–${max}주 후`);

  return (
    <div>
      {!hideTitle && (
        <>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', color: '#AAAAAA', marginBottom: 12 }}>6 MONTH DESIGN CYCLE</p>
          <h3 style={{ fontSize: 22, fontWeight: 300, color: '#111111', marginBottom: 32 }}>방문 후 6개월 관리 플랜</h3>
        </>
      )}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', minWidth: `${plan.length * 120}px`, position: 'relative', paddingBottom: 8 }}>
          <div style={{ position: 'absolute', top: 5, left: '7%', right: '7%', height: 1, background: '#E0E0DC', zIndex: 0 }} />
          {plan.map((item, i) => {
            const isToday = i === 0;
            const isLast = i === plan.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, padding: '0 6px' }}>
                <div style={{
                  width: isToday ? 11 : 9, height: isToday ? 11 : 9, borderRadius: '50%',
                  background: isToday ? '#111111' : '#FFFFFF',
                  border: isToday ? '2px solid #111111' : '1.5px solid #AAAAAA',
                  marginBottom: 14,
                }} />
                <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em', color: '#AAAAAA', marginBottom: 2, whiteSpace: 'nowrap' }}>{item.label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: isToday ? '#111111' : '#333333', marginBottom: 12, whiteSpace: 'nowrap' }}>{item.monthHint}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#111111', textAlign: 'center', lineHeight: 1.45, marginBottom: 4, wordBreak: 'keep-all' }}>{item.title}</p>
                <p style={{ fontSize: 11, color: isLast ? GOLD : '#888888', textAlign: 'center', lineHeight: 1.5, fontWeight: 300, wordBreak: 'keep-all' }}>{item.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {(cycle.nextCare || cycle.nextDesign) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 mt-8" style={{ gap: 12 }}>
          {cycle.nextCare && (
            <div style={{ border: '1px solid #E0E0DC', padding: '24px 22px' }}>
              <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: '#AAAAAA', marginBottom: 14 }}>NEXT CARE</p>
              <p style={{ fontSize: 32, fontWeight: 300, color: '#111111', lineHeight: 1.1, marginBottom: 10 }}>{fmtWeeks(cycle.nextCare.minWeeks, cycle.nextCare.maxWeeks)}</p>
              <p style={{ fontSize: 12, color: GOLD, fontWeight: 500, marginBottom: 10 }}>{cycle.nextCare.services.join(' · ')}</p>
              <p style={{ fontSize: 12, color: '#888888', lineHeight: 1.7, fontWeight: 300 }}>손상 상태와 컬러 후 컨디션을 확인하는 관리 방문입니다.</p>
            </div>
          )}
          {cycle.nextDesign && (
            <div style={{ border: `1px solid ${GOLD}`, padding: '24px 22px' }}>
              <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: GOLD, marginBottom: 14 }}>NEXT DESIGN</p>
              <p style={{ fontSize: 32, fontWeight: 300, color: '#111111', lineHeight: 1.1, marginBottom: 10 }}>{fmtWeeks(cycle.nextDesign.minWeeks, cycle.nextDesign.maxWeeks)}</p>
              <p style={{ fontSize: 12, color: GOLD, fontWeight: 500, marginBottom: 10 }}>{cycle.nextDesign.services.join(' · ')}</p>
              <p style={{ fontSize: 12, color: '#888888', lineHeight: 1.7, fontWeight: 300 }}>현재 디자인과 컬러 균형을 다시 확인하는 다음 디자인 시점입니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
