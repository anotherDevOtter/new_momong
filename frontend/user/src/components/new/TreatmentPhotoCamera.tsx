'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, SwitchCamera, X } from 'lucide-react';

type CameraFacing = 'user' | 'environment';

interface TreatmentPhotoCameraProps {
  title: string;
  /** 찍은 사진의 blob: 주소 */
  onCapture: (url: string) => void;
  /** 앨범에서 고르기. 파일 창이 막히지 않도록 버튼을 누른 그 자리에서 부른다 */
  onPickFile: () => void;
  onClose: () => void;
}

function cameraErrorMessage(error: unknown): string {
  const name = (error as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return '카메라 권한이 거부되었습니다. 브라우저 설정에서 허용하거나 앨범에서 선택해 주세요.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return '연결된 카메라를 찾을 수 없습니다.';
  if (name === 'NotReadableError') return '다른 앱이 카메라를 사용 중입니다.';
  return '카메라를 시작할 수 없습니다. 앨범에서 선택해 주세요.';
}

/** 시술 전·후 사진 촬영 창. 디자이너가 고객을 찍는 경우가 많아 후면으로 시작한다 */
export function TreatmentPhotoCamera({ title, onCapture, onPickFile, onClose }: TreatmentPhotoCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const started = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) {
          started.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = started;
        if (videoRef.current) videoRef.current.srcObject = started;
        setReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);
      } catch (e) {
        if (!cancelled) setError(cameraErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [facing]);

  const handleSwitch = () => {
    setReady(false);
    setFacing((f) => (f === 'user' ? 'environment' : 'user'));
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1); // 셀카는 미리보기와 같은 방향으로 저장한다
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.92);
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm">{title}</span>
        <button onClick={onClose} aria-label="닫기" className="w-9 h-9 flex items-center justify-center">
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        {error ? (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm leading-relaxed">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-contain"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
          />
        )}
      </div>

      <div className="grid grid-cols-3 items-center px-6 py-5">
        <button onClick={onPickFile} aria-label="앨범에서 선택" className="justify-self-start w-11 h-11 flex items-center justify-center">
          <ImageIcon className="w-6 h-6" strokeWidth={1.8} />
        </button>
        <button
          onClick={handleCapture}
          disabled={!ready || !!error}
          aria-label="촬영"
          className="justify-self-center w-16 h-16 rounded-full border-4 border-white bg-white/90 disabled:opacity-30"
        />
        {canSwitch && !error ? (
          <button
            onClick={handleSwitch}
            aria-label={facing === 'user' ? '후면 카메라로 전환' : '전면 카메라로 전환'}
            className="justify-self-end w-11 h-11 flex items-center justify-center"
          >
            <SwitchCamera className="w-6 h-6" strokeWidth={1.8} />
          </button>
        ) : <span />}
      </div>
    </div>,
    document.body,
  );
}
