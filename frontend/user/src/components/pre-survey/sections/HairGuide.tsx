'use client';

import Image from 'next/image';
import { PageLayout } from '../PageLayout';
import { PhotoUploader } from '../PhotoUploader';

interface HairGuideProps {
  surveyToken: string;
  facePhotos: string[];
  preferredHairPhotos: string[];
  dislikedHairPhotos: string[];
  photoDisplayUrls: Record<string, string>;
  onChangeFacePhotos: (next: string[]) => void;
  onChangePreferredHairPhotos: (next: string[]) => void;
  onChangeDislikedHairPhotos: (next: string[]) => void;
  onPrev: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function HairGuide({
  surveyToken,
  facePhotos,
  preferredHairPhotos,
  dislikedHairPhotos,
  photoDisplayUrls,
  onChangeFacePhotos,
  onChangePreferredHairPhotos,
  onChangeDislikedHairPhotos,
  onPrev,
  onNext,
  nextLabel,
}: HairGuideProps) {
  return (
    <PageLayout pageNumber={7} totalPages={8} onPrev={onPrev} onNext={onNext} nextLabel={nextLabel}>
      <div className="bg-white px-7 py-16">
        <div className="mb-16 pb-12 border-b border-[#E5E5E5]">
          <h2 className="text-[28px] text-[#111111] mb-8 text-center" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
            헤어 · 얼굴 사진 가이드
          </h2>
          <p className="text-[13px] text-[#7A7A7A] leading-[1.5] text-center max-w-[320px] mx-auto" style={{ fontWeight: 400 }}>
            고객님의 현재 헤어 상태와 얼굴형, 피부톤을 <br />정확하게 파악하기 위해
            몇 가지 각도의 사진이 필요합니다. <br />
            자연스러운 모습 그대로 촬영해 주시면 됩니다.
          </p>
        </div>

        <div className="mb-16">
          <div className="mb-12">
            <div className="aspect-[16/9] bg-[#F7F7F5] border border-[#E5E5E5] overflow-hidden relative">
              <Image
                src="/pre-survey/hair-guide.png"
                alt="Photo guide - Profile, 3/4 view, Front"
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
                필터나 보정 없이 기본 카메라로 촬영해 주세요. <br />
                자연광 아래에서 촬영하시면 더욱 좋습니다.
              </p>
              <p className="text-[13px] text-[#2B2B2B] leading-[2] text-center" style={{ fontWeight: 400 }}>
                <span style={{ fontWeight: 700 }}>정면/ 45도 각도/ 측면</span><br />세 가지 방향에서 촬영해 주시면
                분석후 <br />이미지를 정확히 파악할 수 있습니다.
              </p>
              <p className="text-[13px] text-[#2B2B2B] leading-[2] text-center" style={{ fontWeight: 400 }}>
                머리를 묶은 상태, 풀어 내린 상태 모두 촬영해 주시면, <br />
                더 다양한 스타일 제안이 가능합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16 bg-[#F7F7F5] px-7 py-9">
          <p className="text-[12px] text-[#7A7A7A] leading-[2.2] text-center max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
            과도한 필터나 보정은 정확한 진단에 방해가 될 수 있습니다. <br />
            고객님의 자연스러운 모습 그대로가 가장 중요하며, <br />
            그것이 진정으로 어울리는 스타일을 찾는 시작점입니다.
          </p>
        </div>

        <div className="mb-16 space-y-10">
          <PhotoUploader
            label="얼굴 사진"
            hint="정면 / 45도 / 측면 3장 권장"
            surveyToken={surveyToken}
            photos={facePhotos}
            max={3}
            onChange={onChangeFacePhotos}
            displayUrlMap={photoDisplayUrls}
          />
          <PhotoUploader
            label="선호하는 헤어스타일 사진"
            hint="원하는 분위기의 레퍼런스 사진을 올려주세요"
            surveyToken={surveyToken}
            photos={preferredHairPhotos}
            max={3}
            onChange={onChangePreferredHairPhotos}
            displayUrlMap={photoDisplayUrls}
          />
          <PhotoUploader
            label="비선호 헤어스타일 사진"
            hint="피하고 싶은 스타일의 사진을 올려주세요"
            surveyToken={surveyToken}
            photos={dislikedHairPhotos}
            max={3}
            onChange={onChangeDislikedHairPhotos}
            displayUrlMap={photoDisplayUrls}
          />
        </div>
      </div>
    </PageLayout>
  );
}
