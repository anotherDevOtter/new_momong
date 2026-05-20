import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Eye, Sun, Minus, Circle, Lock, MoveLeft } from 'lucide-react';
import { BrandHeader } from './BrandHeader';
import { NavigationButtons } from './NavigationButtons';

interface FaceAnalysisCaptureProps {
  onBack: () => void;
  onNext: () => void;
}

export function FaceAnalysisCapture({ onBack, onNext }: FaceAnalysisCaptureProps) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // 카메라 스트림 시작
    const startCamera = async () => {
      try {
        // 먼저 디바이스 존재 여부 확인
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
        
        if (!hasVideoDevice) {
          console.log('카메라 디바이스를 찾을 수 없습니다. 데모 모드로 전환합니다.');
          setCameraError(true);
          setIsCameraReady(true);
          return;
        }

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
        console.log('카메라를 사용할 수 없습니다. 데모 모드로 전환합니다.', error);
        setCameraError(true);
        setIsCameraReady(true);
      }
    };

    startCamera();

    // 클린업: 컴포넌트 언마운트 시 카메라 스트림 종료
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 임시로 2초 후 얼굴 인식 시뮬레이션
  useEffect(() => {
    if (isCameraReady) {
      const timer = setTimeout(() => {
        setFaceDetected(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCameraReady]);

  const handleCapture = () => {
    // 실제로는 여기서 캡처 로직 구현
    console.log('촬영 완료');
    onNext();
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
          
            <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em] mb-3">
              얼굴 정밀 분석
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
                  <span className="font-light">{item.text}</span>
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
            <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Camera className="w-16 h-16 text-gray-400 mb-4" strokeWidth={1} />
                  <p className="text-sm text-gray-500 font-light text-center px-6">
                    카메라 미리보기 (데모 모드)
                  </p>
                </div>
              )}

              {/* 카메라가 준비되지 않았을 때 로딩 */}
              {!isCameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <Camera className="w-16 h-16 text-gray-400" strokeWidth={1} />
                </div>
              )}

              {/* 오버레이 가이드 */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 400 500"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* 얼굴 타원 가이드 */}
                <motion.ellipse
                  cx="200"
                  cy="220"
                  rx="120"
                  ry="160"
                  fill="none"
                  stroke={faceDetected ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'}
                  strokeWidth="1"
                  initial={{ strokeWidth: 1 }}
                  animate={{
                    strokeWidth: faceDetected ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.3 }}
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

              {/* 얼굴 인식 상태 표시 */}
              <AnimatePresence>
                {faceDetected && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full"
                  >
                    <p className="text-xs text-white font-light flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      얼굴 인식 완료
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 안내 문구 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center mb-6"
          >
            <p className="text-xs text-gray-500 font-light mb-6">
              촬영 후 자동으로 분석이 시작됩니다.
            </p>

            {/* 촬영 버튼 */}
            <button
              onClick={handleCapture}
              className="w-full max-w-md mx-auto block bg-black text-white py-4 rounded-full text-sm font-light tracking-wider uppercase transition-all duration-300 hover:bg-gray-900 active:scale-98"
            >
              촬영하기
            </button>
          </motion.div>

          {/* 개인정보 안내 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-xs text-gray-400 font-light mb-8"
          >
            <Lock className="w-3 h-3" strokeWidth={1.5} />
            <span>사진은 분석 외 용도로 저장되지 않습니다.</span>
          </motion.div>

          {/* 하단 네비게이션 */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={onBack}
              className="px-8 py-3 text-sm font-light text-gray-600 hover:text-black transition-colors duration-300"
            >
              이전
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}