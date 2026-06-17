'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, User, Calendar, Phone, Clock, Scissors, Copy, Check, Eye, EyeOff, Download, Pencil, Trash2, Briefcase, ClipboardList, Link2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getConsultationsByCustomerId, getShareByConsultation, deleteConsultation } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';
import {
  createPreSurvey,
  listPreSurveysByCustomer,
  getPreSurvey,
  buildPreSurveyUrl,
  type PreSurveyRecord,
  type PreSurveyDetail,
} from '@/utils/pre-survey-api';
import { describeApiError } from '@/utils/api-error';
import { PreSurveyLinkDialog } from '@/components/PreSurveyLinkDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, ConsultationRecord } from '@/types';

interface ClientDetailStepProps {
  client: Customer;
  onBack: () => void;
  onStartNewConsultation: () => void;
  onStart3Way?: () => void;
  onEditConsultation: (record: ConsultationRecord) => void;
}

export const ClientDetailStep = ({ client, onBack, onStartNewConsultation, onStart3Way, onEditConsultation }: ClientDetailStepProps) => {
  const { token } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalConsultation, setModalConsultation] = useState<ConsultationRecord | null>(null);
  const [shareInfo, setShareInfo] = useState<Record<string, { token: string; password: string; url: string } | null>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [tab, setTab] = useState<'history' | 'survey'>('history');
  const [preSurveys, setPreSurveys] = useState<PreSurveyRecord[]>([]);
  const [preSurveyDialogToken, setPreSurveyDialogToken] = useState<string | null>(null);
  const [creatingPreSurvey, setCreatingPreSurvey] = useState(false);

  // 가장 최근 컨설팅에서 occupation 추출 (clientInfo jsonb 에서 — 최신 saveConsult 형식)
  const latestOccupation = (() => {
    for (const c of consultations) {
      const occ = (c.clientInfo as { occupation?: string } | undefined)?.occupation;
      if (occ) return occ;
    }
    return '';
  })();

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('이 컨설팅 기록을 삭제하시겠습니까?')) return;
    await deleteConsultation(token, id);
    setConsultations((prev) => prev.filter((c) => c.id !== id));
    if (modalConsultation?.id === id) setModalConsultation(null);
  };

  const handleOpenConsultation = async (record: ConsultationRecord) => {
    setModalConsultation(record);
    if (!(record.id in shareInfo) && token) {
      const info = await getShareByConsultation(token, record.id);
      setShareInfo((prev) => ({ ...prev, [record.id]: info }));
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
    if (client.id && token) {
      setIsLoading(true);
      // 전화번호 대신 고객 UUID 로 조회 (번호 변경·미입력에도 이력 유지)
      getConsultationsByCustomerId(token, client.id)
        .then(setConsultations)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [client.id, token]);

  useEffect(() => {
    if (!token) return;
    listPreSurveysByCustomer(token, client.id).then(setPreSurveys).catch(console.error);
  }, [client.id, token]);

  const handleCreatePreSurvey = async () => {
    if (!token) return;
    setCreatingPreSurvey(true);
    try {
      const created = await createPreSurvey(token, client.id);
      setPreSurveys((prev) => [created, ...prev]);
      setPreSurveyDialogToken(created.token);
    } catch (e) {
      alert(describeApiError(e));
    } finally {
      setCreatingPreSurvey(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-6 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-[#111111] hover:text-[#555555] transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm">목록으로</span>
          </button>
          <h1 className="text-xl font-semibold text-[#111111]">고객 상세</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-12 space-y-6">
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
                {latestOccupation && (
                  <span className="px-3 py-1 bg-[#F5F5F5] text-[#555555] text-sm inline-flex items-center gap-1">
                    <Briefcase size={12} /> {latestOccupation}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-[#777777]">
                {client.phone && <div className="flex items-center gap-2"><Phone size={14} />{client.phone}</div>}
                {client.memo && <p>메모: {client.memo}</p>}
                {client.created_at && <div className="flex items-center gap-1 text-[#999999]"><Calendar size={14} />등록일: {formatDate(client.created_at)}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 새 컨설팅 시작 — 히스토리 위로 */}
        <div className="border border-[#E5E5E5] p-8 text-center">
          <p className="text-[#777777] text-sm mb-6">이 고객의 정보로 새 컨설팅을 시작합니다.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={onStartNewConsultation}
              className="px-8 py-3 bg-[#111111] text-white text-sm rounded-full hover:bg-[#222222] transition-colors"
            >
              FIT 시작
            </button>
            {onStart3Way && (
              <button
                onClick={onStart3Way}
                className="px-8 py-3 border border-[#111111] text-[#111111] text-sm rounded-full hover:bg-[#FAFAFA] transition-colors"
              >
                3WAY 시작
              </button>
            )}
            <button
              onClick={handleCreatePreSurvey}
              disabled={creatingPreSurvey}
              className="px-8 py-3 border border-[#B88A5A] text-[#B88A5A] text-sm rounded-full hover:bg-[#FFFBF7] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Link2 size={14} />
              {creatingPreSurvey ? '발급 중...' : '사전설문지 링크 생성'}
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#E5E5E5]">
          <button
            onClick={() => setTab('history')}
            className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === 'history' ? 'border-[#111111] text-[#111111] font-medium' : 'border-transparent text-[#999999] hover:text-[#111111]'
            }`}
          >
            <Scissors size={14} className="inline-block mr-1 -mt-0.5" /> 컨설팅 히스토리
          </button>
          <button
            onClick={() => setTab('survey')}
            className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === 'survey' ? 'border-[#111111] text-[#111111] font-medium' : 'border-transparent text-[#999999] hover:text-[#111111]'
            }`}
          >
            <ClipboardList size={14} className="inline-block mr-1 -mt-0.5" /> 사전 설문
          </button>
        </div>

        {tab === 'survey' && (
          <>
            <PreSurveyList
              surveys={preSurveys}
              onOpenLink={(t) => setPreSurveyDialogToken(t)}
              onCreate={handleCreatePreSurvey}
              creating={creatingPreSurvey}
              formatDate={formatDate}
            />
            <SurveySection consultations={consultations} isLoading={isLoading} formatDate={formatDate} />
          </>
        )}

        {tab === 'history' && (
        <>
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
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenConsultation(record)}
                      className="flex-1 flex items-center gap-4 text-left hover:opacity-70 transition-opacity"
                    >
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
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onEditConsultation(record)}
                        className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#111111] transition-colors px-2 py-1 border border-[#E5E5E5] hover:border-[#999999]"
                      >
                        <Pencil size={11} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="flex items-center gap-1 text-xs text-[#999999] hover:text-red-500 transition-colors px-2 py-1 border border-[#E5E5E5] hover:border-red-300"
                      >
                        <Trash2 size={11} />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      <PreSurveyLinkDialog
        open={!!preSurveyDialogToken}
        surveyToken={preSurveyDialogToken}
        customerName={client.name}
        onClose={() => setPreSurveyDialogToken(null)}
      />

      <Modal
        open={!!modalConsultation}
        onClose={() => setModalConsultation(null)}
        title={
          modalConsultation ? (
            <span>
              컨설팅 상세 · {modalConsultation.visitDate || formatDate(modalConsultation.createdAt)}
              <span className="text-xs text-[#999999] font-normal ml-2">담당: {modalConsultation.designerName || '-'}</span>
            </span>
          ) : null
        }
      >
        {modalConsultation && (
          <ConsultationDetailView
            record={modalConsultation}
            shareInfo={shareInfo[modalConsultation.id]}
            showPassword={!!showPassword[modalConsultation.id]}
            copied={copied === modalConsultation.id}
            onCopy={(url) => handleCopy(modalConsultation.id, url)}
            onTogglePassword={() =>
              setShowPassword((prev) => ({ ...prev, [modalConsultation.id]: !prev[modalConsultation.id] }))
            }
            onDownloadQR={() => handleDownloadQR(modalConsultation.id)}
            qrRef={(el) => {
              qrRefs.current[modalConsultation.id] = el;
            }}
          />
        )}
      </Modal>
    </div>
  );
};

/* ─────────────────── 컨설팅 상세 (모달 내부) ─────────────────── */
function ConsultationDetailView({
  record,
  shareInfo,
  showPassword,
  copied,
  onCopy,
  onTogglePassword,
  onDownloadQR,
  qrRef,
}: {
  record: ConsultationRecord;
  shareInfo?: { token: string; password: string; url: string } | null;
  showPassword: boolean;
  copied: boolean;
  onCopy: (url: string) => void;
  onTogglePassword: () => void;
  onDownloadQR: () => void;
  qrRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="space-y-5 text-sm">
      {/* 공유 링크 */}
      {shareInfo && (() => {
        const url = `${window.location.origin}/share/${shareInfo.token}`;
        return (
          <div className="border border-[#EAEAEA] p-4 bg-[#FAFAFA] space-y-4">
            <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider">공유 링크</p>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-white border border-[#E5E5E5] text-xs text-[#555555] font-mono truncate">
                {url}
              </div>
              <button
                onClick={() => onCopy(url)}
                className="shrink-0 w-8 h-8 flex items-center justify-center border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors"
              >
                {copied ? <Check size={13} className="text-[#111111]" /> : <Copy size={13} className="text-[#999999]" />}
              </button>
            </div>

            <div ref={qrRef} className="flex justify-center p-4 bg-white border border-[#E5E5E5]">
              <QRCode value={url} size={140} />
            </div>
            <button
              onClick={onDownloadQR}
              className="w-full h-9 flex items-center justify-center gap-2 text-xs text-[#777777] hover:text-[#111111] border border-[#E5E5E5] bg-white hover:border-[#999999] transition-colors"
            >
              <Download size={13} />
              QR 이미지 저장
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E5E5]">
              <span className="text-xs text-[#999999] w-16 shrink-0">비밀번호</span>
              <span className="text-xs font-medium text-[#111111] font-mono tracking-widest flex-1">
                {showPassword ? shareInfo.password : '••••••••'}
              </span>
              <button onClick={onTogglePassword} className="text-[#999999] hover:text-[#111111] transition-colors">
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
        );
      })()}
      {shareInfo === null && (
        <p className="text-xs text-[#999999]">생성된 공유 링크가 없습니다.</p>
      )}

      {/* 고객 니즈 */}
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
  );
}

/* ─────────────────── 사전설문 링크 목록 ─────────────────── */
function PreSurveyList({
  surveys,
  onOpenLink,
  onCreate,
  creating,
  formatDate,
}: {
  surveys: PreSurveyRecord[];
  onOpenLink: (token: string) => void;
  onCreate: () => void;
  creating: boolean;
  formatDate: (d: string) => string;
}) {
  const { token } = useAuth();
  const [modalSurveyId, setModalSurveyId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, PreSurveyDetail>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const modalSurvey = surveys.find((s) => s.id === modalSurveyId) || null;
  const modalDetail = modalSurveyId ? detailCache[modalSurveyId] : null;

  const handleCopy = async (surveyToken: string) => {
    await navigator.clipboard.writeText(buildPreSurveyUrl(surveyToken));
  };

  const handleOpen = async (id: string) => {
    setModalSurveyId(id);
    if (!detailCache[id] && token) {
      setLoadingId(id);
      try {
        const detail = await getPreSurvey(token, id);
        setDetailCache((prev) => ({ ...prev, [id]: detail }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingId(null);
      }
    }
  };

  return (
    <>
      <div className="border border-[#E5E5E5] overflow-hidden">
        <div className="px-8 py-5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-[#555555]" />
            <h3 className="text-sm font-semibold text-[#111111]">사전설문지</h3>
            <span className="text-xs text-[#999999] ml-1">총 {surveys.length}건</span>
          </div>
          <button
            onClick={onCreate}
            disabled={creating}
            className="text-xs px-3 py-1.5 border border-[#B88A5A] text-[#B88A5A] hover:bg-[#FFFBF7] transition-colors disabled:opacity-50"
          >
            {creating ? '발급 중...' : '+ 새 링크 발급'}
          </button>
        </div>

        {surveys.length === 0 ? (
          <div className="px-8 py-10 text-center">
            <p className="text-sm text-[#999999]">발급된 사전설문지가 없습니다.</p>
            <p className="text-xs text-[#CCCCCC] mt-1">위 버튼으로 새 링크를 발급해 고객님께 전달하세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {surveys.map((s) => {
              const filled = !!s.filled_at;
              return (
                <div key={s.id} className="px-8 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpen(s.id)}
                      className="flex-1 flex items-center gap-4 text-left hover:opacity-70 transition-opacity"
                    >
                      <span
                        className={`px-2 py-0.5 text-xs ${
                          filled ? 'bg-[#111111] text-white' : 'bg-[#F5F5F5] text-[#777777]'
                        }`}
                      >
                        {filled ? '작성 완료' : '작성중'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#111111]">
                          {filled ? `완료: ${formatDate(s.filled_at!)}` : '미작성'}
                        </p>
                        <p className="text-xs text-[#999999] mt-0.5">발급: {formatDate(s.created_at)}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(s.token)}
                        className="text-xs px-2 py-1 border border-[#E5E5E5] text-[#777777] hover:border-[#111111] hover:text-[#111111] transition-colors inline-flex items-center gap-1"
                      >
                        <Copy size={11} /> 복사
                      </button>
                      <button
                        onClick={() => onOpenLink(s.token)}
                        className="text-xs px-2 py-1 border border-[#E5E5E5] text-[#777777] hover:border-[#111111] hover:text-[#111111] transition-colors"
                      >
                        링크 보기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!modalSurveyId}
        onClose={() => setModalSurveyId(null)}
        title={
          modalSurvey ? (
            <span>
              사전설문지 상세
              <span className="text-xs text-[#999999] font-normal ml-2">
                {modalSurvey.filled_at
                  ? `완료: ${formatDate(modalSurvey.filled_at)}`
                  : `발급: ${formatDate(modalSurvey.created_at)} · 미작성`}
              </span>
            </span>
          ) : null
        }
      >
        {loadingId === modalSurveyId && !modalDetail ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111111] mx-auto mb-3" />
            <p className="text-sm text-[#999999]">불러오는 중...</p>
          </div>
        ) : modalDetail ? (
          <PreSurveyDetailView detail={modalDetail} />
        ) : modalSurvey ? (
          <p className="text-sm text-[#CCCCCC] py-8 text-center">불러오기 실패</p>
        ) : null}
      </Modal>
    </>
  );
}

const PROGRAM_NAMES: Record<string, string> = {
  '01': '3WAY HAIR CONSULTING',
  '02': '2WAY HAIR CONSULTING (퍼스널컬러)',
  '03': '2WAY HAIR CONSULTING (골격이미지)',
  '04': '1WAY HAIR CONSULTING',
};

function PreSurveyDetailView({ detail }: { detail: PreSurveyDetail }) {
  const a = detail.answers ?? {};
  const displayMap = detail.photoDisplayUrls ?? {};

  return (
    <div className="space-y-6 text-sm">
      {/* 기본 정보 */}
      <DetailGroup label="기본 정보">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <DetailField label="나이" value={a.age || '-'} />
          <DetailField label="직업" value={a.job || '-'} />
          <DetailField
            label="컨설팅 프로그램"
            value={a.selectedProgram ? PROGRAM_NAMES[a.selectedProgram] || a.selectedProgram : '-'}
          />
        </div>
      </DetailGroup>

      {/* 이미지 키워드 */}
      <DetailGroup label="이미지 선호도">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailChips label="선호 키워드" values={a.preferences} />
          <DetailChips label="비선호 키워드" values={a.dislikes} />
        </div>
      </DetailGroup>

      {/* 고민 */}
      <DetailGroup label="상세 고민">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DetailChips label="체형" values={a.bodyConcerns} note={a.otherBodyConcern} />
          <DetailChips label="얼굴 보완 부위" values={a.faceConcerns} note={a.otherFaceConcern} />
          <DetailChips label="헤어 고민" values={a.hairConcerns} note={a.otherHairConcern} />
        </div>
        <div className="mt-4">
          <DetailField label="시술 희망" value={a.treatmentPreference || '-'} />
        </div>
      </DetailGroup>

      {/* 사진 */}
      <DetailGroup label="첨부 사진">
        <div className="space-y-5">
          <PhotoGroup label="얼굴 사진" photos={a.facePhotos} displayMap={displayMap} />
          <PhotoGroup label="선호 헤어스타일" photos={a.preferredHairPhotos} displayMap={displayMap} />
          <PhotoGroup label="비선호 헤어스타일" photos={a.dislikedHairPhotos} displayMap={displayMap} />
          <PhotoGroup label="체형 사진" photos={a.bodyPhotos} displayMap={displayMap} />
        </div>
      </DetailGroup>
    </div>
  );
}

function DetailGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#111111] uppercase tracking-wider mb-3">{label}</p>
      <div className="border border-[#EAEAEA] p-4 bg-[#FAFAFA]">{children}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#999999] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xs text-[#111111]" style={{ fontWeight: 500 }}>{value}</p>
    </div>
  );
}

function DetailChips({ label, values, note }: { label: string; values?: string[]; note?: string }) {
  return (
    <div>
      <p className="text-[11px] text-[#999999] uppercase tracking-wider mb-1">{label}</p>
      {values && values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => (
            <span key={v} className="px-2 py-0.5 bg-white border border-[#E5E5E5] text-[#555555] text-xs">{v}</span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#CCCCCC]">-</p>
      )}
      {note && <p className="text-xs text-[#777777] mt-2 leading-relaxed">기타: {note}</p>}
    </div>
  );
}

function PhotoGroup({
  label,
  photos,
  displayMap,
}: {
  label: string;
  photos?: string[];
  displayMap: Record<string, string>;
}) {
  const items = photos ?? [];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] text-[#999999] uppercase tracking-wider">{label}</p>
        <span className="text-[11px] text-[#CCCCCC]">{items.length}장</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[#CCCCCC]">-</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((raw, i) => {
            const src = displayMap[raw] || raw;
            return (
              <a
                key={`${raw}-${i}`}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square bg-[#F7F7F5] border border-[#E5E5E5] overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${label} ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── 사전 설문 탭 ─────────────────── */
function SurveySection({
  consultations,
  isLoading,
  formatDate,
}: {
  consultations: ConsultationRecord[];
  isLoading: boolean;
  formatDate: (d: string) => string;
}) {
  // 3WAY 컨설팅에서 preInterviewData (faceConcerns/hairConcerns 등) 만 추출
  const surveys = consultations
    .map((c) => {
      const tw = (c as unknown as { threeWay?: { preInterviewData?: unknown } }).threeWay;
      const pre = tw?.preInterviewData as
        | { selectedFaceAreas?: string[]; selectedHairConcerns?: string[]; faceAreasMemo?: string; hairConcernsMemo?: string }
        | undefined;
      return pre ? { consult: c, pre } : null;
    })
    .filter(Boolean) as { consult: ConsultationRecord; pre: { selectedFaceAreas?: string[]; selectedHairConcerns?: string[]; faceAreasMemo?: string; hairConcernsMemo?: string } }[];

  if (isLoading) {
    return (
      <div className="border border-[#E5E5E5] px-8 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111111] mx-auto mb-3" />
        <p className="text-sm text-[#999999]">불러오는 중...</p>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="border border-[#E5E5E5] px-8 py-12 text-center">
        <ClipboardList size={32} className="mx-auto mb-3 text-[#CCCCCC]" />
        <p className="text-sm text-[#999999]">사전 설문 기록이 없습니다.</p>
        <p className="text-xs text-[#CCCCCC] mt-1">3WAY 컨설팅 진행 시 사전 인터뷰 단계의 답변이 여기 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
      {surveys.map(({ consult, pre }) => (
        <div key={consult.id} className="px-8 py-5">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm font-medium text-[#111111]">
              {consult.visitDate || formatDate(consult.createdAt)}
            </p>
            <p className="text-xs text-[#999999]">담당: {consult.designerName || '-'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#999999] uppercase tracking-wider mb-1">얼굴 보완 부위</p>
              {pre.selectedFaceAreas?.length ? (
                <div className="flex flex-wrap gap-1">
                  {pre.selectedFaceAreas.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-[#F5F5F5] text-[#555555] text-xs">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#CCCCCC]">-</p>
              )}
              {pre.faceAreasMemo && <p className="text-xs text-[#777777] mt-2">{pre.faceAreasMemo}</p>}
            </div>
            <div>
              <p className="text-xs text-[#999999] uppercase tracking-wider mb-1">헤어 고민</p>
              {pre.selectedHairConcerns?.length ? (
                <div className="flex flex-wrap gap-1">
                  {pre.selectedHairConcerns.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-[#F5F5F5] text-[#555555] text-xs">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#CCCCCC]">-</p>
              )}
              {pre.hairConcernsMemo && <p className="text-xs text-[#777777] mt-2">{pre.hairConcernsMemo}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
