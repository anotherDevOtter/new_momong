'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { X, Copy, Check, Link } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createShare } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ShareLinkModalProps {
  consultationId: string;
  onClose: () => void;
}

type Step = 'password' | 'result';

export const ShareLinkModal = ({ consultationId, onClose }: ShareLinkModalProps) => {
  const { token } = useAuth();
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!password.trim()) {
      toast.error('비밀번호를 입력해주세요');
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const result = await createShare(token, consultationId, password);
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/share/${result.token}`);
      setStep('result');
    } catch {
      toast.error('링크 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('링크가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md mx-4 p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link size={18} className="text-[#111111]" />
            <h2 className="text-base font-semibold text-[#111111]">
              {step === 'password' ? '링크 만들기' : '공유 링크'}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#999999] hover:text-[#111111] transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 'password' ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-[#555555]">
                고객이 링크에 접속할 때 사용할 비밀번호를 설정해주세요.
              </p>
              <p className="text-xs text-[#999999]">
                예: 고객 전화번호 뒤 4자리
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#999999]">비밀번호</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="비밀번호 입력"
                className="w-full h-12 px-4 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                autoFocus
              />
            </div>

            <Button onClick={handleCreate} variant="primary" fullWidth disabled={loading}>
              {loading ? '생성 중...' : '링크 생성'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#555555]">
              아래 링크와 QR코드를 고객에게 공유해주세요.
              접속 시 설정한 비밀번호가 필요합니다.
            </p>

            {/* QR Code */}
            <div className="flex justify-center p-6 bg-[#FAFAFA] border border-[#EAEAEA]">
              <QRCode value={shareUrl} size={160} />
            </div>

            {/* Link */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-[#F7F7F7] border border-[#EAEAEA] text-xs text-[#555555] font-mono truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 w-10 h-10 flex items-center justify-center border border-[#E5E5E5] hover:border-[#111111] transition-colors"
              >
                {copied ? <Check size={16} className="text-[#111111]" /> : <Copy size={16} className="text-[#999999]" />}
              </button>
            </div>

            <div className="bg-[#F7F7F7] border border-[#EAEAEA] px-4 py-3">
              <p className="text-xs text-[#777777]">
                링크를 다시 생성하면 기존 링크는 무효화됩니다.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
