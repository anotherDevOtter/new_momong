'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyShare } from '@/utils/api';
import { ConsultationData } from '@/types';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function SharePage() {
  const params = useParams();
  const shareToken = params.token as string;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);

  const handleVerify = async () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyShare(shareToken, password);
      setConsultation(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (consultation) {
    return <AfterNoteView data={consultation} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#F5F5F5] border border-[#EAEAEA] mx-auto">
            <Lock size={24} className="text-[#111111]" />
          </div>
          <h1 className="text-lg font-semibold text-[#111111]">AFTER NOTE</h1>
          <p className="text-sm text-[#777777]">비밀번호를 입력하면 결과를 확인할 수 있습니다</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="비밀번호 입력"
              className="w-full h-12 px-4 pr-12 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#111111] transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#111111]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full h-12 bg-[#111111] text-white text-sm font-medium hover:bg-[#222222] transition-colors disabled:opacity-40"
          >
            {loading ? '확인 중...' : '확인'}
          </button>
        </div>

        <p className="text-center text-[11px] tracking-[0.2em] text-[#BBBBBB] uppercase">MERCI MOMONG</p>
      </div>
    </div>
  );
}

function AfterNoteView({ data }: { data: ConsultationData }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* PAGE 1 */}
      <div className="max-w-2xl mx-auto px-12 py-16 space-y-10">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="text-2xl font-semibold tracking-[0.08em] text-[#1C1C1C] mb-2">AFTER NOTE</div>
          <div className="text-xs text-[#999999] tracking-[0.02em]">Today&apos;s Design Record</div>
        </div>

        {/* 고객 기본 정보 */}
        <div className="grid grid-cols-3 gap-5 pb-4 border-b border-[#EAEAEA]">
          <div>
            <div className="text-[11px] text-[#999999] mb-1">고객명</div>
            <div className="text-sm text-[#1C1C1C]">{data.clientInfo.name}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#999999] mb-1">방문일</div>
            <div className="text-sm text-[#1C1C1C]">{data.visitDate}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#999999] mb-1">담당 디자이너</div>
            <div className="text-[15px] font-semibold text-[#1C1C1C] tracking-wide">{data.designerName}</div>
          </div>
        </div>

        {/* IMAGE TYPE & HAIR CONDITION */}
        <div>
          <div className="text-sm font-semibold tracking-[0.05em] text-[#1C1C1C] mb-4">IMAGE TYPE &amp; HAIR CONDITION</div>
          <div className="grid grid-cols-2 gap-4">
            {/* IMAGE TYPE */}
            <div className="border border-[#EAEAEA] p-4">
              <div className="text-[11px] font-semibold text-[#6E1F2A] tracking-[0.03em] mb-3">IMAGE TYPE</div>
              {['WARM', 'NEUTRAL', 'COOL'].map((type) => {
                const selected = data.faceImageType?.type?.toUpperCase() === type;
                return (
                  <div key={type} className="flex items-center mb-2.5">
                    <div className={`w-3.5 h-3.5 mr-2.5 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#6E1F2A] border-2 border-[#6E1F2A]' : 'border border-[#CCCCCC]'}`}>
                      {selected && <div className="w-1.5 h-1.5 bg-white" />}
                    </div>
                    <span className={`text-sm ${selected ? 'text-[#6E1F2A] font-semibold' : 'text-[#AAAAAA]'}`}>{type}</span>
                  </div>
                );
              })}
              <div className="text-[10px] text-[#999999] leading-relaxed pt-2.5 border-t border-[#F5F5F5] mt-1">현재 인상 기준 최적 이미지 타입</div>
            </div>

            {/* HAIR CONDITION */}
            <div className="border border-[#EAEAEA] p-4">
              <div className="text-[11px] font-semibold text-[#6E1F2A] tracking-[0.03em] mb-3">HAIR CONDITION</div>
              {data.hairCondition?.damageLevel && (
                <div className="mb-2.5">
                  <div className="text-[10px] text-[#999999] mb-0.5">손상도</div>
                  <div className="text-sm text-[#1C1C1C]">{data.hairCondition.damageLevel}</div>
                </div>
              )}
              {data.hairCondition?.hairType?.length > 0 && (
                <div className="mb-2.5">
                  <div className="text-[10px] text-[#999999] mb-0.5">모질</div>
                  <div className="text-sm text-[#1C1C1C]">{data.hairCondition.hairType.join(', ')}</div>
                </div>
              )}
              {data.hairCondition?.density && (
                <div className="mb-2.5">
                  <div className="text-[10px] text-[#999999] mb-0.5">숱</div>
                  <div className="text-sm text-[#1C1C1C]">{data.hairCondition.density}</div>
                </div>
              )}
              <div className="text-[10px] text-[#999999] leading-relaxed pt-2.5 border-t border-[#F5F5F5] mt-1">모발 컨디션 기준 조율</div>
            </div>
          </div>
        </div>

        {/* TODAY DESIGN */}
        {data.todayDesign?.length?.length > 0 && (
          <div>
            <div className="text-sm font-semibold tracking-[0.05em] text-[#1C1C1C] mb-4">TODAY DESIGN</div>
            <div className="border border-[#EAEAEA]">
              <div className="grid grid-cols-[20%_30%_50%] border-b border-[#EAEAEA] bg-[#FAFAFA]">
                {['항목', '결과', '메모'].map((h) => (
                  <div key={h} className="px-3 py-2.5 text-xs text-[#555555] border-r last:border-r-0 border-[#EAEAEA]">{h}</div>
                ))}
              </div>
              {[
                { label: '길이', values: data.todayDesign.length, memo: data.todayDesign.lengthMemo },
                { label: '앞머리', values: data.todayDesign.bangs, memo: data.todayDesign.bangsMemo },
                { label: '컬 / 질감', values: data.todayDesign.curlTexture, memo: data.todayDesign.curlTextureMemo },
                { label: '컬러', values: data.todayDesign.color, memo: data.todayDesign.colorMemo },
              ].filter(r => r.values?.length > 0).map((row, idx, arr) => (
                <div key={row.label} className={`grid grid-cols-[20%_30%_50%] min-h-[42px] ${idx < arr.length - 1 ? 'border-b border-[#EAEAEA]' : ''}`}>
                  <div className="px-3 py-3 text-xs text-[#555555] border-r border-[#EAEAEA] flex items-center">{row.label}</div>
                  <div className="px-3 py-3 text-xs font-semibold text-[#111111] border-r border-[#EAEAEA] flex items-center">{row.values.join(', ')}</div>
                  <div className="px-3 py-3 text-xs text-[#555555] flex items-center">{row.memo || '-'}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-4 border border-[#EAEAEA]">
              <p className="text-xs text-[#555555] leading-relaxed">
                현재 얼굴 밸런스와 모질 컨디션을 기준으로 안정적인 방향으로 진행된 디자인입니다.<br />
                손상도와 이미지 변화에 따라 다음 방문 시 디자인이 조정될 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PAGE 2 */}
      {(data.nextDirection?.lengthChange?.length > 0 || data.nextDirection?.colorChange?.length > 0 || data.nextDirection?.others?.length > 0 || data.designCycleGuide?.selectedMonths?.filter(m => m.services.length > 0).length > 0 || data.afterNote) && (
        <div className="max-w-2xl mx-auto px-12 py-16 space-y-10 border-t-4 border-[#F5F5F5]">
          <div className="text-center mb-10">
            <div className="text-2xl font-semibold tracking-[0.08em] text-[#1C1C1C] mb-2">FUTURE DIRECTION</div>
            <div className="text-xs text-[#999999] tracking-[0.02em]">Next Design Strategy</div>
          </div>

          {/* NEXT DIRECTION */}
          {(data.nextDirection?.lengthChange?.length > 0 || data.nextDirection?.colorChange?.length > 0 || data.nextDirection?.others?.length > 0) && (
            <div>
              <div className="text-sm font-semibold tracking-[0.05em] text-[#1C1C1C] mb-4">NEXT DIRECTION</div>
              <div className="flex flex-wrap gap-3 mb-3">
                {data.nextDirection.lengthChange?.map((v) => (
                  <span key={v} className="px-4 py-2 border border-[#6E1F2A] text-xs text-[#6E1F2A] font-semibold">길이 변화 ({v})</span>
                ))}
                {data.nextDirection.colorChange?.map((v) => (
                  <span key={v} className="px-4 py-2 border border-[#6E1F2A] text-xs text-[#6E1F2A] font-semibold">컬러 변화 ({v})</span>
                ))}
                {data.nextDirection.others?.map((v, i) => (
                  <span key={i} className="px-4 py-2 border border-[#6E1F2A] text-xs text-[#6E1F2A] font-semibold">{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* DESIGN ROADMAP */}
          {data.designCycleGuide?.selectedMonths?.filter(m => m.services.length > 0).length > 0 && (
            <div>
              <div className="text-sm font-semibold tracking-[0.05em] text-[#1C1C1C] mb-4">DESIGN ROADMAP</div>
              <div className="max-w-sm">
                {data.designCycleGuide.selectedMonths
                  .filter(m => m.services.length > 0)
                  .sort((a, b) => {
                    const order = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
                    return order.indexOf(a.month) - order.indexOf(b.month);
                  })
                  .map((monthData) => (
                    <div key={monthData.month} className="flex items-center py-3 border-b border-[#EAEAEA]">
                      <div className="text-sm text-[#1C1C1C] w-14">{monthData.month}</div>
                      <div className="text-sm text-[#999999] mx-4">—</div>
                      <div className="text-sm text-[#6E1F2A] font-semibold">
                        {monthData.services.join(', ')}
                        {monthData.memo && <span className="text-xs text-[#999999] font-normal ml-2">({monthData.memo})</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PROFESSIONAL NOTE */}
          {data.afterNote && (
            <div>
              <div className="text-sm font-semibold tracking-[0.05em] text-[#1C1C1C] mb-4">PROFESSIONAL NOTE</div>
              <div className="p-4 border border-[#EAEAEA]">
                <p className="text-xs text-[#666666] leading-relaxed whitespace-pre-line">{data.afterNote}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 푸터 */}
      <div className="max-w-2xl mx-auto px-12 py-8 text-center border-t border-[#EAEAEA]">
        <p className="text-[10px] text-[#CCCCCC] leading-relaxed mb-2">
          디자인은 고정되지 않습니다.<br />
          얼굴, 이미지, 컨디션에 따라 매 방문마다 FIT는 달라질 수 있습니다.
        </p>
        <p className="text-xs text-[#999999] tracking-[0.05em] font-medium">MERCI MOMONG</p>
      </div>
    </div>
  );
}
