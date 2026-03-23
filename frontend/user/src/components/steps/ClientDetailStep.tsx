'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, User, Calendar, Phone, Clock, ChevronDown, ChevronUp, Scissors, Copy, Check, Eye, EyeOff, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getConsultationsByCustomerPhone, getShareByConsultation } from '@/utils/api';
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
  const [shareInfo, setShareInfo] = useState<Record<string, { token: string; password: string; url: string } | null>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleExpand = async (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next && !(id in shareInfo) && token) {
      const info = await getShareByConsultation(token, id);
      setShareInfo((prev) => ({ ...prev, [id]: info }));
    }
  };

  const handleCopy = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadQR = (id: string) => {
    const svg = qrRefs.current[id]?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 260;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = `share-qr-${id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(new TextEncoder().encode(svgData).reduce((s, b) => s + String.fromCharCode(b), ''))}`;
  };

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
          <div className="w-24" />
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
                    onClick={() => handleExpand(record.id)}
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

                      {/* 공유 링크 */}
                      {shareInfo[record.id] && (() => {
                        const info = shareInfo[record.id]!;
                        const url = `${window.location.origin}/share/${info.token}`;
                        return (
                          <div className="border border-[#EAEAEA] p-4 bg-[#FAFAFA] space-y-4">
                            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider">공유 링크</p>

                            {/* 링크 */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-3 py-2 bg-white border border-[#E5E5E5] text-xs text-[#555555] font-mono truncate">
                                {url}
                              </div>
                              <button
                                onClick={() => handleCopy(record.id, url)}
                                className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors"
                              >
                                {copied === record.id ? <Check size={13} className="text-[#111111]" /> : <Copy size={13} className="text-[#999999]" />}
                              </button>
                            </div>

                            {/* QR 코드 */}
                            <div
                              ref={(el) => { qrRefs.current[record.id] = el; }}
                              className="flex justify-center p-4 bg-white border border-[#E5E5E5]"
                            >
                              <QRCode value={url} size={140} />
                            </div>
                            <button
                              onClick={() => handleDownloadQR(record.id)}
                              className="w-full h-9 flex items-center justify-center gap-2 text-xs text-[#777777] hover:text-[#111111] border border-[#E5E5E5] bg-white hover:border-[#999999] transition-colors"
                            >
                              <Download size={13} />
                              QR 이미지 저장
                            </button>

                            {/* 비밀번호 */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E5E5]">
                              <span className="text-xs text-[#999999] w-16 shrink-0">비밀번호</span>
                              <span className="text-xs font-medium text-[#111111] font-mono tracking-widest flex-1">
                                {showPassword[record.id] ? info.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => setShowPassword((prev) => ({ ...prev, [record.id]: !prev[record.id] }))}
                                className="text-[#999999] hover:text-[#111111] transition-colors"
                              >
                                {showPassword[record.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      {shareInfo[record.id] === null && (
                        <p className="text-xs text-[#999999]">생성된 공유 링크가 없습니다.</p>
                      )}

                      {/* 고객 니즈 - TODAY KEYWORD */}
                      {record.todayKeyword && (
                        record.todayKeyword.faceConcerns?.length > 0 ||
                        record.todayKeyword.hairConcerns?.length > 0 ||
                        record.todayKeyword.imageKeywords?.length > 0
                      ) && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">고객 니즈</p>
                          <div className="border border-[#EAEAEA] overflow-hidden">
                            {record.todayKeyword.faceConcerns?.length > 0 && (
                              <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">얼굴 고민</div>
                                <div className="px-3 py-2 text-xs text-[#111111]">
                                  <div className="font-medium mb-1">{record.todayKeyword.faceConcerns.join(', ')}</div>
                                  {record.todayKeyword.faceConcernsMemo && <div className="text-[#555555] mt-1">{record.todayKeyword.faceConcernsMemo}</div>}
                                </div>
                              </div>
                            )}
                            {record.todayKeyword.hairConcerns?.length > 0 && (
                              <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">머릿결 고민</div>
                                <div className="px-3 py-2 text-xs text-[#111111]">
                                  <div className="font-medium mb-1">{record.todayKeyword.hairConcerns.join(', ')}</div>
                                  {record.todayKeyword.hairConcernsMemo && <div className="text-[#555555] mt-1">{record.todayKeyword.hairConcernsMemo}</div>}
                                </div>
                              </div>
                            )}
                            {record.todayKeyword.imageKeywords?.length > 0 && (
                              <div className="grid grid-cols-[25%_75%]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">이미지 키워드</div>
                                <div className="px-3 py-2 text-xs font-medium text-[#111111]">{record.todayKeyword.imageKeywords.join(', ')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 진단 결과 */}
                      {(record.faceImageType?.type || record.hairCondition) && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">진단 결과</p>
                          <div className="border border-[#EAEAEA] overflow-hidden">
                            {record.faceImageType?.type && (
                              <>
                                <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                  <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">퍼스널 이미지</div>
                                  <div className="px-3 py-2 text-xs font-medium text-[#111111]">
                                    {record.faceImageType.type === 'warm' && '웜 (따뜻함)'}
                                    {record.faceImageType.type === 'cool' && '쿨 (차가운)'}
                                    {record.faceImageType.type === 'neutral' && '뉴트럴 (중성)'}
                                  </div>
                                </div>
                                {record.faceImageType.features?.face && (
                                  <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                    <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">얼굴형</div>
                                    <div className="px-3 py-2 text-xs text-[#555555]">{record.faceImageType.features.face}</div>
                                  </div>
                                )}
                                {record.faceImageType.features?.eyebrows && (
                                  <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                    <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">눈썹</div>
                                    <div className="px-3 py-2 text-xs text-[#555555]">{record.faceImageType.features.eyebrows}</div>
                                  </div>
                                )}
                                {record.faceImageType.features?.eyes && (
                                  <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                    <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">눈</div>
                                    <div className="px-3 py-2 text-xs text-[#555555]">{record.faceImageType.features.eyes}</div>
                                  </div>
                                )}
                                {record.faceImageType.features?.lips && (
                                  <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                    <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">입술</div>
                                    <div className="px-3 py-2 text-xs text-[#555555]">{record.faceImageType.features.lips}</div>
                                  </div>
                                )}
                              </>
                            )}
                            {record.hairCondition?.damageLevel && (
                              <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">손상도</div>
                                <div className="px-3 py-2 text-xs font-medium text-[#111111]">{record.hairCondition.damageLevel}</div>
                              </div>
                            )}
                            {record.hairCondition?.hairType?.length > 0 && (
                              <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">모발 유형</div>
                                <div className="px-3 py-2 text-xs text-[#555555]">{record.hairCondition.hairType.join(', ')}</div>
                              </div>
                            )}
                            {record.hairCondition?.thickness && (
                              <div className="grid grid-cols-[25%_75%] border-b border-[#EAEAEA]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">모발 굵기</div>
                                <div className="px-3 py-2 text-xs text-[#555555]">{record.hairCondition.thickness}</div>
                              </div>
                            )}
                            {record.hairCondition?.density && (
                              <div className="grid grid-cols-[25%_75%]">
                                <div className="px-3 py-2 text-xs text-[#777777] border-r border-[#EAEAEA]">모발 숱</div>
                                <div className="px-3 py-2 text-xs text-[#555555]">{record.hairCondition.density}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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

                      {/* Design Cycle Guide */}
                      {record.designCycleGuide?.selectedMonths?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2">Design Cycle Guide</p>
                          <div className="text-xs text-[#555555] leading-relaxed bg-[#FAFAFA] p-3 border border-[#EAEAEA]">
                            {record.designCycleGuide.selectedMonths.map((m) => {
                              const parts = [];
                              if (m.services.length > 0) parts.push(m.services.join(', '));
                              if (m.memo) parts.push(`(${m.memo})`);
                              return `${m.month}: ${parts.join(' ') || '시술 미정'}`;
                            }).join(' / ')}
                          </div>
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
