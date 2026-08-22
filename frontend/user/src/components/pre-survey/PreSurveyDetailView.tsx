import type { ReactNode } from 'react';
import type { PreSurveyDetail } from '@/utils/pre-survey-api';

// 사전설문 상세 렌더 (고객 상세 탭 + 3WAY 사전설문 리뷰 단계에서 공용 사용)

const PROGRAM_NAMES: Record<string, string> = {
  '01': '3WAY HAIR CONSULTING',
  '02': '2WAY HAIR CONSULTING (퍼스널컬러)',
  '03': '2WAY HAIR CONSULTING (골격이미지)',
  '04': '1WAY HAIR CONSULTING',
};

export function PreSurveyDetailView({ detail }: { detail: PreSurveyDetail }) {
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

function DetailGroup({ label, children }: { label: string; children: ReactNode }) {
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
