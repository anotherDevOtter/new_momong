'use client';

import Image from 'next/image';
import { PageLayout } from '../PageLayout';
import { PhotoUploader } from '../PhotoUploader';

interface BodyGuideProps {
  surveyToken: string;
  bodyPhotos: string[];
  photoDisplayUrls: Record<string, string>;
  onChangeBodyPhotos: (next: string[]) => void;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

export function BodyGuide({
  surveyToken,
  bodyPhotos,
  photoDisplayUrls,
  onChangeBodyPhotos,
  onPrev,
  onNext,
  nextLabel = '제출',
}: BodyGuideProps) {
  return (
    <PageLayout pageNumber={8} totalPages={8} onPrev={onPrev} onNext={onNext} nextLabel={nextLabel}>
      <div className="bg-white px-7 py-16">
        <div className="mb-16 pb-12 border-b border-[#E5E5E5]">
          <h2 className="text-[28px] text-[#111111] mb-8 text-center" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
            체형 사진 가이드
          </h2>
          <p className="text-[13px] text-[#7A7A7A] leading-[1.5] text-center max-w-[320px] mx-auto" style={{ fontWeight: 400 }}>
            메르시모몽은 헤어컨설팅은 골격이미지 분석을 통해 <br />
            고객님께 가장 어울리는 스타일을 제안해 드립니다.
          </p>
        </div>

        <div className="mb-16">
          <div className="mb-12">
            <div className="aspect-[16/9] bg-[#F7F7F5] border border-[#E5E5E5] overflow-hidden relative">
              <Image
                src="/pre-survey/body-guide.png"
                alt="Body guide - Front, Side, Back view"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-7 bg-[#F7F7F5] px-7 py-10">
            <h4 className="text-[20px] text-[#111111] text-center mb-2" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              촬영 가이드
            </h4>
            <div className="space-y-5">
              <p className="text-[13px] text-[#2B2B2B] leading-[2] text-center" style={{ fontWeight: 400 }}>
                몸의 라인이 드러나는 편안한 옷차림을 권장합니다. <br />
                과도하게 타이트하거나 루즈한 옷보다는 <br />
                자연스러운 핏이 적절합니다.
              </p>
              <p className="text-[13px] text-[#2B2B2B] leading-[2] text-center" style={{ fontWeight: 400 }}>
                <span style={{ fontWeight: 700 }}>정면/ 측면/ 뒷모습</span><br /> 각각 촬영해 주시면 <br />
                전체적인 실루엣을 파악할 수 있습니다.
              </p>
              <p className="text-[13px] text-[#2B2B2B] leading-[2] text-center" style={{ fontWeight: 400 }}>
                자연스럽게 선 자세로 촬영해 주세요. <br />
                일상적인 모습 그대로가 <br />가장 정확한 분석의 기준이 됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <PhotoUploader
            label="체형 사진"
            hint="정면 / 측면 / 뒷모습 3장 권장"
            surveyToken={surveyToken}
            photos={bodyPhotos}
            max={3}
            onChange={onChangeBodyPhotos}
            displayUrlMap={photoDisplayUrls}
          />
        </div>
      </div>
    </PageLayout>
  );
}
