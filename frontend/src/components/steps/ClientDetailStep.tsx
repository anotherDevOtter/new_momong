'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, User, Calendar, Phone, Clock, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import { getConsultationsByCustomerPhone } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, ConsultationRecord } from '@/types';

interface ClientDetailStepProps {
  client: Customer;
  onBack: () => void;
  onStartNewConsultation: () => void;
}

export const ClientDetailStep = ({ client, onBack, onStartNewConsultation }: ClientDetailStepProps) => {
  const { token } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (client.phone && token) {
      setIsLoading(true);
      getConsultationsByCustomerPhone(token, client.phone)
        .then(setConsultations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [client.phone, token]);

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-[#E5E5E5] z-10">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#111111] hover:text-[#555555] transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm">목록으로</span>
          </button>
          <h1 className="text-xl font-semibold text-[#111111]">고객 상세</h1>
          <button onClick={onStartNewConsultation} className="px-6 py-2 bg-[#111111] text-white text-sm rounded-full hover:bg-[#222222] transition-colors">
            새 컨설팅 시작
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-20 pt-32 pb-20 space-y-6">
        {/* 고객 정보 카드 */}
        <div className="border border-[#E5E5E5] p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
              <User size={32} className="text-[#999999]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-[#111111] mb-2">{client.name}</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {client.gender && <span className="px-3 py-1 bg-[#F5F5F5] text-[#555555] text-sm">{client.gender === 'female' ? '여성' : '남성'}</span>}
                {client.age_group && <span className="px-3 py-1 bg-[#F5F5F5] text-[#555555] text-sm">{client.age_group}</span>}
              </div>
              <div className="space-y-1 text-sm text-[#777777]">
                {client.phone && <div className="flex items-center gap-2"><Phone size={14} />{client.phone}</div>}
                {client.memo && <p>메모: {client.memo}</p>}
                {client.created_at && <div className="flex items-center gap-1 text-[#999999]"><Calendar size={14} />등록일: {formatDate(client.created_at)}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 컨설팅 히스토리 */}
        <div className="border border-[#E5E5E5] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors size={16} className="text-[#555555]" />
              <h3 className="text-sm font-semibold text-[#111111]">컨설팅 히스토리</h3>
            </div>
            <span className="text-xs text-[#999999]">총 {consultations.length}건</span>
          </div>

          {isLoading ? (
            <div className="px-8 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111111] mx-auto mb-3" />
              <p className="text-sm text-[#999999]">불러오는 중...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="px-8 py-12 text-center">
              <Clock size={32} className="mx-auto mb-3 text-[#CCCCCC]" />
              <p className="text-sm text-[#999999]">아직 컨설팅 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {consultations.map((record) => (
                <div key={record.id} className="px-8 py-5">
                  <button
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{record.visitDate || formatDate(record.createdAt)}</p>
                        <p className="text-xs text-[#999999] mt-0.5">담당: {record.designerName || '-'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {record.faceImageType?.type && (
                          <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#555555] text-xs">{record.faceImageType.type.toUpperCase()}</span>
                        )}
                        {record.hairCondition?.damageLevel && (
                          <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#555555] text-xs">손상도: {record.hairCondition.damageLevel}</span>
                        )}
                        {record.todayDesign?.length?.length > 0 && (
                          <span className="px-2 py-0.5 bg-[#F5F5F5] text-[#555555] text-xs">{record.todayDesign.length.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    {expandedId === record.id ? <ChevronUp size={16} className="text-[#999999] shrink-0" /> : <ChevronDown size={16} className="text-[#999999] shrink-0" />}
                  </button>

                  {expandedId === record.id && (
                    <div className="mt-5 space-y-5 text-sm">
                      {/* TODAY DESIGN */}
                      {record.todayDesign && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">Today Design</p>
                          <div className="border border-[#EAEAEA] overflow-hidden">
                            {[
                              { label: '길이', values: record.todayDesign.length, memo: record.todayDesign.lengthMemo },
                              { label: '앞머리', values: record.todayDesign.bangs, memo: record.todayDesign.bangsMemo },
                              { label: '컬/질감', values: record.todayDesign.curlTexture, memo: record.todayDesign.curlTextureMemo },
                              { label: '컬러', values: record.todayDesign.color, memo: record.todayDesign.colorMemo },
                            ]
                              .filter((row) => row.values?.length > 0)
                              .map((row, idx, arr) => (
                                <div key={row.label} className={`grid grid-cols-[20%_30%_50%] ${idx < arr.length - 1 ? 'border-b border-[#EAEAEA]' : ''}`}>
                                  <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">{row.label}</div>
                                  <div className="px-3 py-2 text-xs font-medium text-[#111111] border-r border-[#EAEAEA]">{row.values.join(', ')}</div>
                                  <div className="px-3 py-2 text-xs text-[#555555]">{row.memo || '-'}</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* NEXT DIRECTION */}
                      {(record.nextDirection?.lengthChange?.length > 0 || record.nextDirection?.colorChange?.length > 0 || record.nextDirection?.others?.length > 0) && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2">Next Direction</p>
                          <ul className="space-y-1 text-xs text-[#777777]">
                            {record.nextDirection.lengthChange?.length > 0 && <li>• 길이: {record.nextDirection.lengthChange.join(', ')}</li>}
                            {record.nextDirection.colorChange?.length > 0 && <li>• 컬러: {record.nextDirection.colorChange.join(', ')}</li>}
                            {record.nextDirection.others?.map((item, i) => <li key={i}>• {item}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* After Note */}
                      {record.afterNote && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2">After Design Memo</p>
                          <p className="text-xs text-[#555555] leading-relaxed bg-[#FAFAFA] p-3 border border-[#EAEAEA] whitespace-pre-line">{record.afterNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-[#E5E5E5] p-8 text-center">
          <p className="text-[#777777] text-sm mb-6">이 고객의 정보로 새로운 FIT 헤어 컨설팅을 시작할 수 있습니다.</p>
          <button onClick={onStartNewConsultation} className="px-8 py-3 bg-[#111111] text-white text-sm rounded-full hover:bg-[#222222] transition-colors">
            새 컨설팅 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};
