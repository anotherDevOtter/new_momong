import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Eye, Sun, Minus, Circle, Lock, MoveLeft, Upload, X } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';
import { useFaceDetector, isFaceInsideOval } from './useFaceDetector';
import {
  requestUploadUrl,
  uploadToS3,
  analyzeFace,
  dataUrlToFile,
  AnalyzeResponse,
} from '@/utils/face-analysis-api';
import { prepareImageForAnalysis } from '@/utils/image-resize';

interface FaceAnalysisCaptureProps {
  onBack: () => void;
  onNext: (result: AnalyzeResponse, faceImageUrl: string) => void;
}

const OVAL_RATIO = { cx: 0.5, cy: 0.44, rx: 0.3, ry: 0.32 };

// 검출된 얼굴 박스를 중심으로 4:5 portrait 영역 자동 크롭. 헤어/이마 여유 위해 얼굴 중심을 세로 45% 지점에.
async function cropAroundFace(
  img: HTMLImageElement,
  faceBox: { originX: number; originY: number; width: number; height: number },
  options: { padding?: number; aspectRatio?: number } = {},
): Promise<File> {
  const padding = options.padding ?? 2.5;
  const aspectRatio = options.aspectRatio ?? 4 / 5; // W/H. <1 → portrait.
  const fx = faceBox.originX + faceBox.width / 2;
  const fy = faceBox.originY + faceBox.height / 2;
  const faceLong = Math.max(faceBox.width, faceBox.height);
  const baseDim = faceLong * padding;
  let cropH = baseDim;
  let cropW = baseDim * aspectRatio;
  if (aspectRatio >= 1) { cropW = baseDim; cropH = baseDim / aspectRatio; }
  let cropX = fx - cropW / 2;
  let cropY = fy - cropH * 0.45;
  if (cropW > img.naturalWidth) { cropW = img.naturalWidth; cropX = 0; }
  if (cropH > img.naturalHeight) { cropH = img.naturalHeight; cropY = 0; }
  cropX = Math.max(0, Math.min(cropX, img.naturalWidth - cropW));
  cropY = Math.max(0, Math.min(cropY, img.naturalHeight - cropH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(cropW);
  canvas.height = Math.round(cropH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context');
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(new File([blob], 'face-crop.jpg', { type: 'image/jpeg' })) : reject(new Error('toBlob 실패')),
      'image/jpeg',
      0.92,
    );
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FaceAnalysisCapture({ onBack, onNext }: FaceAnalysisCaptureProps) {
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string>('');
  const [faceInOval, setFaceInOval] = useState(false);
  const [detectionHint, setDetectionHint] = useState<string>('얼굴을 원 안에 맞춰주세요');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'upload' | 'camera' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  // 업로드 시 원본 파일 (camera 일 땐 null — dataURL 변환해서 사용)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const uploadedImgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  // 업로드된 새 파일에 대해 한 번만 얼굴 자동 크롭 수행
  const pendingCropRef = useRef(false);
  // 업로드 이미지를 사용자가 직접 드래그/줌으로 위치 조정 (auto crop 실패 시 fallback)
  const [imgTransform, setImgTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const faceDetector = useFaceDetector();

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      // 큰 이미지 (2500x2500 등) 는 MediaPipe blaze_face_short_range 모델이
      // 작은 얼굴을 검출 못 함 → 업로드 시 먼저 2048px 까지 리사이즈
      const { file: prepared } = await prepareImageForAnalysis(file);
      const dataUrl = await fileToDataUrl(prepared);
      setPreviewImage(dataUrl);
      setImageSource('upload');
      setUploadedFile(prepared);
      pendingCropRef.current = true;
      setImgTransform({ tx: 0, ty: 0, scale: 1 });
      stopCamera();
    } catch (e) {
      alert(e instanceof Error ? e.message : '이미지 준비 실패');
    }
  };

  const handleClearPreview = () => {
    setPreviewImage(null);
    setImageSource(null);
    setUploadedFile(null);
    setAnalyzeError(null);
    setFaceInOval(false);
    pendingCropRef.current = false;
    setImgTransform({ tx: 0, ty: 0, scale: 1 });
    if (fileInputRef.current) fileInputRef.current.value = '';
    // 카메라가 켜져 있던 흐름이면 다시 시작
    if (cameraStarted) startCamera();
  };

  const startCamera = async () => {
    setCameraStarted(true);
    setCameraError(false);
    setCameraErrorMessage('');

    // 보안 컨텍스트 확인 (https 또는 localhost 필요)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraError(true);
      setIsCameraReady(true);
      setCameraErrorMessage('카메라는 HTTPS 또는 localhost 에서만 사용할 수 있습니다.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(true);
      setIsCameraReady(true);
      setCameraErrorMessage('이 브라우저는 카메라를 지원하지 않습니다.');
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
        setIsCameraReady(true);
        setCameraError(false);
      }
    } catch (error) {
      console.error('카메라 시작 실패', error);
      setCameraError(true);
      setIsCameraReady(true);

      const name = (error as { name?: string })?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraErrorMessage(
          '카메라 권한이 거부되었습니다. 브라우저 주소창의 자물쇠/카메라 아이콘을 눌러 권한을 허용한 뒤 다시 시도해주세요.',
        );
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        setCameraErrorMessage('연결된 카메라를 찾을 수 없습니다.');
      } else if (name === 'NotReadableError') {
        setCameraErrorMessage('다른 앱이 카메라를 사용 중입니다. 종료 후 다시 시도해주세요.');
      } else {
        setCameraErrorMessage(`카메라를 시작할 수 없습니다. (${name || 'Unknown'})`);
      }
    }
  };

  // 컴포넌트 언마운트 시에만 스트림 정리 (자동 시작 X — 사용자가 버튼 클릭 시 시작)
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 비디오 프레임마다 얼굴 검출
  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const preview = previewRef.current;
    if (!video || !preview || !faceDetector.ready || previewImage) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        const detections = faceDetector.detectInVideo(video, performance.now());
        const rect = preview.getBoundingClientRect();
        evaluateDetections(detections, rect, video.videoWidth, video.videoHeight, true);
      } catch (e) {
        // ignore transient errors
      }
    }
    rafRef.current = requestAnimationFrame(detectLoop);
  }, [faceDetector, previewImage]);

  useEffect(() => {
    if (isCameraReady && !cameraError && !previewImage && faceDetector.ready) {
      rafRef.current = requestAnimationFrame(detectLoop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isCameraReady, cameraError, previewImage, faceDetector.ready, detectLoop]);

  // detection 결과를 컨테이너 좌표계로 변환 + oval 검사
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
    // object-cover + scale(1.5) 보정: 컨테이너에 맞춰 cover, 그리고 카메라는 scale(1.5)
    // 단순화: 비디오/이미지 원본 → 컨테이너로 동일 스케일 가정 후 ratio 만 비교
    const box = detections[0];
    const scaleX = container.width / sourceW;
    const scaleY = container.height / sourceH;
    const scale = Math.max(scaleX, scaleY); // object-cover
    const drawnW = sourceW * scale;
    const drawnH = sourceH * scale;
    const offsetX = (container.width - drawnW) / 2;
    const offsetY = (container.height - drawnH) / 2;

    let mappedX = offsetX + box.originX * scale;
    const mappedY = offsetY + box.originY * scale;
    const mappedW = box.width * scale;
    const mappedH = box.height * scale;

    if (mirrored) {
      mappedX = container.width - (mappedX + mappedW);
    }

    const result = isFaceInsideOval(
      { originX: mappedX, originY: mappedY, width: mappedW, height: mappedH },
      { width: container.width, height: container.height },
      OVAL_RATIO,
    );

    setFaceInOval(result.inside);
    setDetectionHint(result.inside ? '얼굴 위치가 좋습니다' : result.reason || '얼굴을 맞춰주세요');
  };

  // 업로드 이미지 검출 (첫 검출에서 얼굴 검출되면 자동 크롭 → 재로드 후 일반 oval 검사)
  const handleImageLoaded = async () => {
    const img = uploadedImgRef.current;
    const preview = previewRef.current;
    if (!img || !preview || !faceDetector.ready) return;
    try {
      const detections = faceDetector.detectInImage(img);

      if (pendingCropRef.current) {
        pendingCropRef.current = false;
        if (detections.length > 0) {
          try {
            const cropped = await cropAroundFace(img, detections[0]);
            const dataUrl = await fileToDataUrl(cropped);
            setUploadedFile(cropped);
            setPreviewImage(dataUrl); // → 재로드 → handleImageLoaded 재진입 (일반 검출)
            setImgTransform({ tx: 0, ty: 0, scale: 1 });
          } catch (cropErr) {
            console.error('자동 크롭 실패', cropErr);
            setFaceInOval(true);
            setDetectionHint('자동 크롭 실패 — 원본 그대로 분석합니다');
          }
        } else {
          // 작은 얼굴 / 전신 사진 등 MediaPipe blaze_face_short_range 한계.
          // 원본 그대로 분석 진행 (Python 서버 Face Mesh 가 더 견고함).
          setFaceInOval(true);
          setDetectionHint('얼굴 자동 검출 실패 — 원본 그대로 분석합니다');
        }
        return;
      }

      const rect = preview.getBoundingClientRect();
      evaluateDetections(detections, rect, img.naturalWidth, img.naturalHeight, false);
    } catch (e) {
      setFaceInOval(false);
      setDetectionHint('얼굴 검출에 실패했습니다');
    }
  };

  // 모델 로드 완료 후 업로드된 이미지가 이미 떠 있으면 검출
  useEffect(() => {
    if (faceDetector.ready && previewImage && uploadedImgRef.current?.complete) {
      handleImageLoaded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceDetector.ready, previewImage]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    // 화면은 object-cover + transform:scale(1.5) 로 크롭되어 보이므로
    // 캡처도 그 크롭+줌된 영역만 추출. 비디오 표시 스타일 바꾸면 ZOOM 도 맞춰야 함.
    const preview = previewRef.current;
    const displayW = preview?.clientWidth || video.videoWidth;
    const displayH = preview?.clientHeight || video.videoHeight;
    const VIDEO_CSS_ZOOM = 1.5; // <video style={{transform:'scale(1.5)'}}> 매칭
    const coverScale = Math.max(displayW / video.videoWidth, displayH / video.videoHeight);
    const srcW = displayW / coverScale / VIDEO_CSS_ZOOM;
    const srcH = displayH / coverScale / VIDEO_CSS_ZOOM;
    const srcX = (video.videoWidth - srcW) / 2;
    const srcY = (video.videoHeight - srcH) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(srcW);
    canvas.height = Math.round(srcH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // 셀카처럼 좌우 반전 보정
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setPreviewImage(dataUrl);
    setImageSource('camera');
    setFaceInOval(false); // 새로 검출하도록 초기화
    stopCamera();
  };

  const handleConfirm = async () => {
    if (!previewImage) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      // 1) 업로드용 파일 준비
      //    - 업로드: 사용자가 pan/zoom 으로 위치 조정한 영역만 crop
      //    - 카메라: handleCapture 가 이미 미리보기 영역만 잡아둔 dataUrl
      const rawFile =
        imageSource === 'upload'
          ? await cropFromUploadView()
          : dataUrlToFile(previewImage, `face-${Date.now()}.jpg`);

      // 1-1) 3MB / 2048px 초과 시 자동 리사이즈 (재압축 최소화)
      const { file } = await prepareImageForAnalysis(rawFile);

      // 2) S3 presigned URL 발급 (백엔드가 3MB 한도 확인)
      const { uploadUrl, publicUrl } = await requestUploadUrl(file.type, undefined, file.size);

      // 3) S3 에 직접 업로드
      await uploadToS3(uploadUrl, file, file.type);

      // 4) 분석 호출
      const result = await analyzeFace({ faceImageUrl: publicUrl });

      // 5) 결과 + 업로드된 S3 URL 을 상위로 전달 → consultation 저장 시 함께 보관
      onNext(result, publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 중 오류가 발생했습니다';
      setAnalyzeError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    handleClearPreview();
  };

  // 업로드 이미지 pan/zoom — 드래그 (mouse + touch via pointer)
  const handleImgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (imageSource !== 'upload') return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTx: imgTransform.tx,
      startTy: imgTransform.ty,
    };
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleImgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setImgTransform((prev) => ({
      ...prev,
      tx: d.startTx + (e.clientX - d.startX),
      ty: d.startTy + (e.clientY - d.startY),
    }));
  };

  const handleImgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // wheel (passive 회피 위해 native addEventListener)
  useEffect(() => {
    const el = previewRef.current;
    if (!el || imageSource !== 'upload') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setImgTransform((prev) => ({
        ...prev,
        scale: Math.max(1, Math.min(5, prev.scale * delta)),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [imageSource]);

  // 업로드 이미지 → 사용자가 설정한 transform 영역만 crop
  const cropFromUploadView = async (): Promise<File> => {
    const img = uploadedImgRef.current;
    const preview = previewRef.current;
    if (!img || !preview) throw new Error('이미지 준비 실패');
    const displayW = preview.clientWidth;
    const displayH = preview.clientHeight;
    const coverScale = Math.max(displayW / img.naturalWidth, displayH / img.naturalHeight);
    const totalScale = imgTransform.scale * coverScale;
    const srcW = displayW / totalScale;
    const srcH = displayH / totalScale;
    let srcX = img.naturalWidth / 2 - imgTransform.tx / totalScale - srcW / 2;
    let srcY = img.naturalHeight / 2 - imgTransform.ty / totalScale - srcH / 2;
    srcX = Math.max(0, Math.min(srcX, Math.max(0, img.naturalWidth - srcW)));
    srcY = Math.max(0, Math.min(srcY, Math.max(0, img.naturalHeight - srcH)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(srcW);
    canvas.height = Math.round(srcH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas context');
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], 'upload-cropped.jpg', { type: 'image/jpeg' })) : reject(new Error('toBlob 실패'))),
        'image/jpeg',
        0.92,
      );
    });
  };

  const guideItems = [
    { icon: MoveLeft, text: '멀리서 촬영' },
    { icon: Camera, text: '정면 촬영' },
    { icon: Eye, text: '눈높이 유지' },
    { icon: Sun, text: '자연광에서 촬영' },
    { icon: Minus, text: '무표정 유지' },
    { icon: Circle, text: '윤곽을 가리지 않기' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
          
            <h2 className="text-2xl font-bold text-[#111111] tracking-[-0.01em] mb-3">
              Face Precision Analysis
            </h2>
            <p className="text-sm text-[#999999] leading-relaxed">
              정확한 분석을 위해 아래 가이드를 따라 촬영해주세요.
            </p>
          </motion.div>

          {/* 촬영 가이드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-700">
              {guideItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                  <span className="font-normal">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 카메라 프리뷰 영역 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <div
              ref={previewRef}
              className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100"
              onPointerDown={handleImgPointerDown}
              onPointerMove={handleImgPointerMove}
              onPointerUp={handleImgPointerUp}
              onPointerCancel={handleImgPointerUp}
              style={{
                cursor: imageSource === 'upload' ? (isDragging ? 'grabbing' : 'grab') : undefined,
                touchAction: imageSource === 'upload' ? 'none' : undefined,
              }}
            >
              {/* 업로드된 이미지 우선 표시 */}
              {previewImage ? (
                <>
                  <img
                    ref={uploadedImgRef}
                    src={previewImage}
                    alt="업로드된 얼굴 이미지"
                    className="absolute inset-0 w-full h-full object-cover select-none"
                    style={{
                      transform: `translate(${imgTransform.tx}px, ${imgTransform.ty}px) scale(${imgTransform.scale})`,
                      transformOrigin: 'center center',
                      pointerEvents: 'none',
                    }}
                    onLoad={handleImageLoaded}
                    crossOrigin="anonymous"
                    draggable={false}
                  />
                  <button
                    onClick={handleClearPreview}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="이미지 제거"
                  >
                    <X className="w-4 h-4 text-white" strokeWidth={2} />
                  </button>
                </>
              ) : !cameraStarted ? (
                /* 카메라 시작 전 플레이스홀더 */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Camera className="w-16 h-16 text-gray-400 mb-4" strokeWidth={1} />
                  <p className="text-sm text-gray-600 font-normal text-center px-6 mb-6">
                    카메라로 촬영하거나
                    <br />
                    아래에서 파일을 업로드하세요
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 bg-black text-white text-sm font-normal rounded-full hover:bg-gray-800 transition-colors"
                  >
                    카메라 시작
                  </button>
                </div>
              ) : (
                <>
                  {/* 비디오 스트림 */}
                  {!cameraError && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ transform: 'scale(1.5)' }}
                    />
                  )}

                  {/* 카메라 에러 시 플레이스홀더 */}
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-6">
                      <Camera className="w-12 h-12 text-gray-400 mb-3" strokeWidth={1} />
                      <p className="text-sm text-gray-700 font-medium text-center mb-2">
                        카메라를 시작할 수 없습니다
                      </p>
                      <p className="text-xs text-gray-500 font-normal text-center leading-relaxed mb-4">
                        {cameraErrorMessage || '알 수 없는 오류가 발생했습니다.'}
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-black text-white text-xs font-normal rounded-full hover:bg-gray-800 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  )}

                  {/* 카메라가 준비되지 않았을 때 로딩 */}
                  {!isCameraReady && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <Camera className="w-16 h-16 text-gray-400 animate-pulse" strokeWidth={1} />
                    </div>
                  )}
                </>
              )}

              {/* 오버레이 가이드 (카메라/업로드 활성 시에만 노출) */}
              {(cameraStarted || previewImage) && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 500"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* 얼굴 타원 가이드 - 검출 상태에 따라 색상 변경 */}
                <motion.ellipse
                  cx="200"
                  cy="220"
                  rx="120"
                  ry="160"
                  fill="none"
                  stroke={faceInOval ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255, 255, 255, 0.45)'}
                  initial={{ strokeWidth: 1 }}
                  animate={{ strokeWidth: faceInOval ? 2.5 : 1.2 }}
                  transition={{ duration: 0.25 }}
                />

                {/* 세로 중심선 */}
                <line
                  x1="200"
                  y1="100"
                  x2="200"
                  y2="340"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="0.5"
                />

                {/* 눈 수평 라인 (더 진하게) */}
                <line
                  x1="80"
                  y1="200"
                  x2="320"
                  y2="200"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                />

                {/* 상중하 3등분 그리드 - 상단 */}
                <line
                  x1="80"
                  y1="150"
                  x2="320"
                  y2="150"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="0.5"
                />

                {/* 상중하 3등분 그리드 - 하단 */}
                <line
                  x1="80"
                  y1="250"
                  x2="320"
                  y2="250"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="0.5"
                />
              </svg>
              )}

              {/* 상단 상태 뱃지 - 카메라/프리뷰 활성 시에만 */}
              {(cameraStarted || previewImage) && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm flex items-center gap-2">
                  {imageSource && (
                    <span className="text-[10px] text-white/80 uppercase tracking-wider border border-white/30 rounded-full px-2 py-0.5">
                      {imageSource === 'camera' ? '촬영' : '업로드'}
                    </span>
                  )}
                  <p className="text-xs text-white font-normal flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        faceInOval ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                      }`}
                    />
                    {!faceDetector.ready
                      ? '얼굴 인식 모델 로딩…'
                      : faceInOval
                      ? '얼굴 위치가 좋습니다'
                      : detectionHint}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* 안내 문구 + 액션 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center mb-6"
          >
            <p className="text-xs text-gray-500 font-normal mb-6">
              {previewImage
                ? imageSource === 'camera'
                  ? '촬영한 이미지를 확인해주세요. 마음에 들지 않으면 다시 촬영할 수 있습니다.'
                  : '업로드한 이미지를 확인해주세요. 다른 이미지를 선택할 수도 있습니다.'
                : cameraStarted
                ? '얼굴이 원 안에 들어오면 촬영하기 버튼이 활성화됩니다.'
                : '카메라로 촬영하거나 이미지를 업로드하세요.'}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-full max-w-md mx-auto space-y-3">
              {previewImage ? (
                <>
                  {/* 분석 에러 표시 */}
                  {analyzeError && (
                    <p className="text-xs text-red-500 text-center">{analyzeError}</p>
                  )}

                  {/* 프리뷰 모드: 분석 / 다시 (촬영 또는 파일 선택)
                      - 카메라: 가이드 안에 얼굴 들어와야 분석 가능
                      - 업로드: MediaPipe 검출 실패해도 분석 가능 (Python Face Mesh 가 더 견고) */}
                  <button
                    onClick={handleConfirm}
                    disabled={(imageSource === 'camera' && !faceInOval) || isAnalyzing}
                    className="w-full block bg-black text-white py-4 rounded-full text-sm font-normal tracking-wider uppercase transition-all duration-300 hover:bg-gray-900 active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                  >
                    {isAnalyzing ? '분석 중…' : '이 이미지로 분석'}
                  </button>
                  <button
                    onClick={handleRetake}
                    disabled={isAnalyzing}
                    className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-4 rounded-full text-sm font-normal tracking-wider transition-all duration-300 hover:border-black hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {imageSource === 'camera' ? '다시 촬영' : '다른 이미지 선택'}
                  </button>
                </>
              ) : (
                <>
                  {/* 카메라 모드: 촬영 (faceInOval 일 때만) + 파일 업로드 */}
                  {cameraStarted && (
                    <button
                      onClick={handleCapture}
                      disabled={!faceInOval}
                      className="w-full block bg-black text-white py-4 rounded-full text-sm font-normal tracking-wider uppercase transition-all duration-300 hover:bg-gray-900 active:scale-98 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                    >
                      촬영하기
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-4 rounded-full text-sm font-normal tracking-wider transition-all duration-300 hover:border-black hover:text-black"
                  >
                    <Upload className="w-4 h-4" strokeWidth={1.8} />
                    파일에서 이미지 선택
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* 개인정보 안내 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-xs text-gray-400 font-normal mb-8"
          >
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            <span>사진은 분석 외 용도로 저장되지 않습니다.</span>
          </motion.div>

          {/* 하단 네비게이션 */}
          <NavigationButtons onBack={onBack} showNext={false} backLabel="이전" />
        </div>
      </div>
    </div>
  );
}