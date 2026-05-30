import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Eye, Sun, Minus, Circle, Lock, MoveLeft, Upload, X } from 'lucide-react';
import { BrandHeader } from './BrandHeader';
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

  const faceDetector = useFaceDetector();

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
      setImageSource('upload');
      setUploadedFile(file);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleClearPreview = () => {
    setPreviewImage(null);
    setImageSource(null);
    setUploadedFile(null);
    setAnalyzeError(null);
    setFaceInOval(false);
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

  // 업로드 이미지 검출
  const handleImageLoaded = () => {
    const img = uploadedImgRef.current;
    const preview = previewRef.current;
    if (!img || !preview || !faceDetector.ready) return;
    try {
      const detections = faceDetector.detectInImage(img);
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

    // 화면은 object-cover 로 크롭되어 보이므로 캡처도 그 크롭된 영역만 추출.
    // (이전에는 비디오 전체 프레임을 캡처해서 사용자가 본 것보다 큰 영역이 분석되었음)
    const preview = previewRef.current;
    const displayW = preview?.clientWidth || video.videoWidth;
    const displayH = preview?.clientHeight || video.videoHeight;
    const scale = Math.max(displayW / video.videoWidth, displayH / video.videoHeight);
    const srcW = displayW / scale;
    const srcH = displayH / scale;
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
      // 1) 업로드용 파일 준비 (업로드는 원본 file, 카메라는 dataUrl 변환)
      const rawFile =
        imageSource === 'upload' && uploadedFile
          ? uploadedFile
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
      <BrandHeader />

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
            >
              {/* 업로드된 이미지 우선 표시 */}
              {previewImage ? (
                <>
                  <img
                    ref={uploadedImgRef}
                    src={previewImage}
                    alt="업로드된 얼굴 이미지"
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoad={handleImageLoaded}
                    crossOrigin="anonymous"
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

                  {/* 프리뷰 모드: 분석 / 다시 (촬영 또는 파일 선택) */}
                  <button
                    onClick={handleConfirm}
                    disabled={!faceInOval || isAnalyzing}
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
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={onBack}
              className="px-8 py-3 text-sm font-normal text-gray-600 hover:text-black transition-colors duration-300"
            >
              이전
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}