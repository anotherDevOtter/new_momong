'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyShare } from '@/utils/api';
import { ConsultationData } from '@/types';
import { Lock, Eye, EyeOff, Download } from 'lucide-react';

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `after-note-${data.clientInfo.name}-${data.visitDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div ref={contentRef} className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        {/* 헤더 */}
        <div className="text-center space-y-2 pb-8 border-b border-[#EAEAEA]">
          <p className="text-xs tracking-[0.2em] text-[#999999] uppercase">After Note</p>
          <h1 className="text-2xl font-semibold text-[#111111]">{data.clientInfo.name}</h1>
          <p className="text-sm text-[#777777]">{data.visitDate} · {data.designerName}</p>
        </div>

        {/* IMAGE TYPE */}
        {data.faceImageType?.type && (
          <Section title="IMAGE TYPE">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#111111] text-white text-xs font-medium tracking-wider">
                {data.faceImageType.type.toUpperCase()}
              </span>
              {Object.entries(data.faceImageType.features || {}).filter(([, v]) => v).map(([k, v]) => (
                <span key={k} className="text-xs text-[#555555]">{v as string}</span>
              ))}
            </div>
          </Section>
        )}

        {/* HAIR CONDITION */}
        {data.hairCondition?.damageLevel && (
          <Section title="HAIR CONDITION">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Row label="손상도" value={data.hairCondition.damageLevel} />
              <Row label="모질" value={data.hairCondition.hairType?.join(', ')} />
              <Row label="굵기" value={data.hairCondition.thickness} />
              <Row label="숱" value={data.hairCondition.density} />
            </div>
          </Section>
        )}

        {/* TODAY DESIGN */}
        {data.todayDesign?.length?.length > 0 && (
          <Section title="TODAY DESIGN">
            <div className="border border-[#EAEAEA]">
              {[
                { label: '길이', values: data.todayDesign.length, memo: data.todayDesign.lengthMemo },
                { label: '앞머리', values: data.todayDesign.bangs, memo: data.todayDesign.bangsMemo },
                { label: '컬/질감', values: data.todayDesign.curlTexture, memo: data.todayDesign.curlTextureMemo },
                { label: '컬러', values: data.todayDesign.color, memo: data.todayDesign.colorMemo },
              ].filter(r => r.values?.length > 0).map((row, idx, arr) => (
                <div key={row.label} className={`grid grid-cols-[20%_30%_50%] ${idx < arr.length - 1 ? 'border-b border-[#EAEAEA]' : ''}`}>
                  <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">{row.label}</div>
                  <div className="px-3 py-2 text-xs font-medium text-[#111111] border-r border-[#EAEAEA]">{row.values.join(', ')}</div>
                  <div className="px-3 py-2 text-xs text-[#555555]">{row.memo || '-'}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* NEXT DIRECTION */}
        {(data.nextDirection?.lengthChange?.length > 0 || data.nextDirection?.colorChange?.length > 0) && (
          <Section title="NEXT DIRECTION">
            <div className="flex flex-wrap gap-2">
              {data.nextDirection.lengthChange?.map((v) => <Tag key={v} label={`길이 변화: ${v}`} />)}
              {data.nextDirection.colorChange?.map((v) => <Tag key={v} label={`컬러 변화: ${v}`} />)}
              {data.nextDirection.others?.map((v) => <Tag key={v} label={v} />)}
            </div>
          </Section>
        )}

        {/* PROFESSIONAL NOTE */}
        {data.afterNote && (
          <Section title="PROFESSIONAL NOTE">
            <p className="text-sm text-[#555555] leading-relaxed whitespace-pre-line">{data.afterNote}</p>
          </Section>
        )}

        {/* 푸터 */}
        <div className="text-center pt-8 border-t border-[#EAEAEA] space-y-1">
          <p className="text-xs text-[#999999]">BE YOURSELF</p>
          <p className="text-[11px] tracking-[0.2em] text-[#BBBBBB] uppercase">MERCI MOMONG</p>
        </div>
      </div>

      {/* 이미지 다운로드 버튼 */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full h-12 bg-[#111111] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#333333] transition-colors disabled:opacity-40"
        >
          <Download size={16} />
          {downloading ? '저장 중...' : '이미지로 저장'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#111111] tracking-[0.08em]">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-[#999999]">{label}: </span>
      <span className="text-xs text-[#111111] font-medium">{value}</span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 border border-[#E5E5E5] text-xs text-[#555555]">{label}</span>
  );
}
