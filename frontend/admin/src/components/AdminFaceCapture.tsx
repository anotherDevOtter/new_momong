'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useFaceDetector, isFaceInsideOval } from './useFaceDetector';

interface AdminFaceCaptureProps {
  /** 사용자가 분석 시작 버튼을 누를 때. File 을 부모로 전달. */
  onConfirm: (file: File) => void;
  disabled?: boolean;
}

type Mode = 'idle' | 'camera' | 'preview';
const OVAL_RATIO = { cx: 0.5, cy: 0.5, rx: 0.35, ry: 0.45 };

export function AdminFaceCapture({ onConfirm, disabled }: AdminFaceCaptureProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceInOval, setFaceInOval] = useState(false);
  const [detectionHint, setDetectionHint] = useState('얼굴을 원 안에 맞춰주세요');

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  const faceDetector = useFaceDetector();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setMode('camera');

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError('카메라는 HTTPS 또는 localhost 에서만 사용할 수 있습니다');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('이 브라우저는 카메라를 지원하지 않습니다');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (e) {
      const name = (e as { name?: string })?.name || 'Unknown';
      if (name === 'NotAllowedError') {
        setCameraError('카메라 권한이 거부되었습니다');
      } else if (name === 'NotFoundError') {
        setCameraError('카메라를 찾을 수 없습니다');
      } else {
        setCameraError(`카메라를 시작할 수 없습니다 (${name})`);
      }
    }
  };

  // MediaPipe face detection loop
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const preview = previewRef.current;
    if (!video || !preview || !faceDetector.ready || mode !== 'camera') return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        const detections = faceDetector.detectInVideo(video, performance.now());
        const rect = preview.getBoundingClientRect();
        evaluateDetections(detections, rect, video.videoWidth, video.videoHeight, true);
      } catch {
        // ignore transient detection errors
      }
    }
    rafRef.current = requestAnimationFrame(detectLoop);
  }, [faceDetector, mode]);

  useEffect(() => {
    if (mode === 'camera' && faceDetector.ready) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [mode, faceDetector.ready, detectLoop]);

  const evaluateDetections = (
    detections: { originX: number; originY: number; width: number; height: number }[],
    container: DOMRect,
    sourceW: number,
    sourceH: number,
    mirrored: boolean,
  ) => {
    if (detections.length === 0) {
      setFaceInOval(false);
      setDetectionHint('얼굴이 보이지 않습니다');
      return;
    }
    const box = detections[0];
    const scale = Math.max(container.width / sourceW, container.height / sourceH);
    const drawnW = sourceW * scale;
    const drawnH = sourceH * scale;
    const offsetX = (container.width - drawnW) / 2;
    const offsetY = (container.height - drawnH) / 2;

    let mappedX = offsetX + box.originX * scale;
    const mappedY = offsetY + box.originY * scale;
    const mappedW = box.width * scale;
    const mappedH = box.height * scale;
    if (mirrored) mappedX = container.width - (mappedX + mappedW);

    const result = isFaceInsideOval(
      { originX: mappedX, originY: mappedY, width: mappedW, height: mappedH },
      { width: container.width, height: container.height },
      OVAL_RATIO,
    );
    setFaceInOval(result.inside);
    setDetectionHint(result.inside ? '얼굴 위치가 좋습니다' : result.reason || '얼굴을 맞춰주세요');
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPreviewFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setMode('preview');
        stopCamera();
      },
      'image/jpeg',
      0.92,
    );
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다');
      return;
    }
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode('preview');
    stopCamera();
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setFaceInOval(false);
    setDetectionHint('얼굴을 원 안에 맞춰주세요');
    setMode('idle');
  };

  const handleConfirm = () => {
    if (previewFile) onConfirm(previewFile);
  };

  // Idle: 카메라/업로드 선택
  if (mode === 'idle') {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded p-6">
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#111111] text-white text-sm rounded hover:bg-[#333333] disabled:opacity-50 transition-colors"
          >
            <Camera size={16} /> 카메라로 촬영
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[#111111] text-[#111111] text-sm rounded hover:bg-[#FAFAFA] disabled:opacity-50 transition-colors"
          >
            <Upload size={16} /> 파일 업로드
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  // Camera: 비디오 + 가이드
  if (mode === 'camera') {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded p-4">
        {cameraError ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-3">{cameraError}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={startCamera}
                className="px-3 py-1.5 text-xs border border-[#111111] rounded hover:bg-[#FAFAFA]"
              >
                다시 시도
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-[#111111] text-white rounded hover:bg-[#333333]"
              >
                파일 업로드로 변경
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </div>
        ) : (
          <>
            <div
              ref={previewRef}
              className="relative w-full max-w-md mx-auto aspect-[3/4] bg-black rounded overflow-hidden"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <ellipse
                  cx={OVAL_RATIO.cx * 100}
                  cy={OVAL_RATIO.cy * 100}
                  rx={OVAL_RATIO.rx * 100}
                  ry={OVAL_RATIO.ry * 100}
                  fill="none"
                  stroke={faceInOval ? '#22C55E' : '#FFFFFF'}
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="absolute bottom-2 left-2 right-2 text-center">
                <span
                  className={`inline-block px-3 py-1 text-xs rounded-full ${
                    faceInOval ? 'bg-green-600 text-white' : 'bg-black/60 text-white'
                  }`}
                >
                  {detectionHint}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={handleRetake}
                className="px-4 py-2 text-sm border border-[#E5E5E5] rounded hover:bg-[#FAFAFA]"
              >
                취소
              </button>
              <button
                onClick={handleCapture}
                disabled={!faceInOval}
                className="px-4 py-2 text-sm bg-[#111111] text-white rounded hover:bg-[#333333] disabled:bg-[#CCCCCC]"
              >
                촬영
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Preview: 결과 미리보기 + 확인/재시도
  return (
    <div className="bg-white border border-[#E5E5E5] rounded p-4">
      <div className="relative max-w-md mx-auto">
        {previewUrl && (
          <img src={previewUrl} alt="preview" className="w-full h-auto rounded" />
        )}
        <button
          onClick={handleRetake}
          className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
        >
          <X size={14} />
        </button>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={handleRetake}
          disabled={disabled}
          className="px-4 py-2 text-sm border border-[#E5E5E5] rounded hover:bg-[#FAFAFA] disabled:opacity-50"
        >
          다시 선택
        </button>
        <button
          onClick={handleConfirm}
          disabled={disabled}
          className="px-4 py-2 text-sm bg-[#111111] text-white rounded hover:bg-[#333333] disabled:bg-[#999999]"
        >
          {disabled ? '분석 중…' : '분석 시작'}
        </button>
      </div>
    </div>
  );
}
