'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerData } from '@/components/3way/CustomerInfo';
import { PreInterview, PreInterviewData } from '@/components/3way/PreInterview';
import { ImagePreferenceDiagnosis, ImagePreferenceData } from '@/components/3way/ImagePreferenceDiagnosis';
import { FashionPreferenceDiagnosis, FashionPreferenceData } from '@/components/3way/FashionPreferenceDiagnosis';
import { ConsultingSummary } from '@/components/3way/ConsultingSummary';
import { FaceAnalysisCapture } from '@/components/3way/FaceAnalysisCapture';
import { FaceAnalysisProcessing } from '@/components/3way/FaceAnalysisProcessing';
import { FaceAnalysisResult, type FaceResultData } from '@/components/3way/FaceAnalysisResult';
import { requestUploadUrl, uploadToS3, type AnalyzeResponse } from '@/utils/face-analysis-api';
import { prepareImageForAnalysis } from '@/utils/image-resize';
import { PersonalColorAnalysis, type PersonalColorData } from '@/components/3way/PersonalColorAnalysis';
import { SkeletonImageAnalysis, type SkeletonData } from '@/components/3way/SkeletonImageAnalysis';
import { ImageDirectionSetting, type ImageDirectionData } from '@/components/3way/ImageDirectionSetting';
import { HairDesignProposal, type HairDesignData } from '@/components/3way/HairDesignProposal';
import { HairTextureAnalysis, type HairTextureData } from '@/components/3way/HairTextureAnalysis';
import { NextDirection, type CycleData as LegacyCycleData } from '@/components/3way/NextDirection';
import { PreSurveyReview } from '@/components/3way/PreSurveyReview';
import { PremiumReport } from '@/components/3way/PremiumReport';
import { CompletionPage } from '@/components/3way/CompletionPage';
import { saveConsult, updateConsult, type SaveConsultPayload } from '@/utils/3way-api';
import { getCustomerById, getConsultationsByCustomerId } from '@/utils/api';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ── 'new' 코스(시안 이식) 전용 화면 ────────────────────────────────────
// components/new/ 는 시안에서 그대로 옮겨온 것. 기존 코스는 이 파일들을 쓰지 않는다.
import { ConsultingSummary as NewConsultingSummary } from '@/components/new/ConsultingSummary';
import { FaceAnalysisProcessing as NewFaceAnalysisProcessing } from '@/components/new/FaceAnalysisProcessing';
import { AIFaceFeature } from '@/components/new/AIFaceFeature';
import { AIFaceResultDerived } from '@/components/new/AIFaceResultDerived';
import { HairConsulting, type HairConsultingData } from '@/components/new/HairConsulting';
import { NextDirection as NewNextDirection, type CycleData } from '@/components/new/NextDirection';
import { PremiumReport as NewPremiumReport } from '@/components/new/PremiumReport';
// 시안3 구조(표지+4장). new 코스만 쓴다 — 공유 링크의 옛 기록은 아직 위쪽 V1 이 그린다.
import { PremiumReport as NewPremiumReportV2 } from '@/components/new/PremiumReportV2';
import { CompletionPage as NewCompletionPage } from '@/components/new/CompletionPage';
import { preSurveyToPreInterview, EMPTY_PRE_INTERVIEW, type PreInterviewData as NewPreInterviewData } from '@/components/new/preSurveyToPreInterview';
import { faceAnalysisToPosMap, faceAnalysisToMeasurements, faceAnalysisToValues, faceAnalysisToNumbers, deriveImageType } from '@/components/new/faceAnalysisToPosMap';
import { designScreenRecommendation, strategyOf } from '@/components/new/hairPrescription';
import { FORM, PROP, dominantIdx } from '@/components/new/faceAnalysisData';
import { listPreSurveysByCustomer, getPreSurvey } from '@/utils/pre-survey-api';
import { ShareLinkModal } from '@/components/ShareLinkModal';

type PageKey =
  | 'preInterview' | 'imagePreference' | 'fashionPreference' | 'summary'
  | 'faceAnalysis' | 'faceProcessing' | 'faceResult'
  | 'personalColor' | 'skeletonImage'
  | 'imageDirection' | 'hairDesign' | 'hairTexture'
  | 'nextDirection' | 'preSurveyReview' | 'completion'
  // ↓ 'new' 코스(시안 이식) 전용 화면. 기존 코스는 쓰지 않는다.
  | 'aiFaceFeature' | 'aiFaceResultDerived' | 'hairConsulting';

// ─────────────────────────────────────────────────────────────────────────
// 코스별 단계 구성. 배열 순서 = 진행 순서.
//
// 흐름을 바꾸려면 여기만 고친다. 이전/다음/진행률이 전부 이 표에서 파생되므로
// 예전처럼 분기 조건이 여러 곳에 흩어져 서로 어긋나는 일이 생기지 않는다.
//
// N-WAY = 진단 축의 개수 (코스 선택 카드 문구와 동일한 약속):
//   1WAY 얼굴 / 2WAY 얼굴+1개 / 3WAY 얼굴+2개(퍼스널컬러·골격)
// ─────────────────────────────────────────────────────────────────────────
const BASE_STEPS: PageKey[] = [
  'preInterview',
  'imagePreference',
  'fashionPreference',
  'summary',
  'faceAnalysis',
  'faceProcessing',
  'faceResult',
];
const TAIL_STEPS: PageKey[] = [
  'imageDirection',
  'hairDesign',
  'hairTexture',
  'nextDirection',
  'preSurveyReview',
];

const COURSE_STEPS: Record<string, PageKey[]> = {
  '1way':          [...BASE_STEPS, ...TAIL_STEPS],
  '2way-personal': [...BASE_STEPS, 'personalColor', ...TAIL_STEPS],
  '2way-skeleton': [...BASE_STEPS, 'skeletonImage', ...TAIL_STEPS],
  '3way':          [...BASE_STEPS, 'personalColor', 'skeletonImage', ...TAIL_STEPS],

  // ───────────────────────────────────────────────────────────────────
  // 'new' — 시안(figma/1way (Copy)) 이식용 임시 코스. 개발 전용.
  //
  //   접속: /3way/consulting?course=new&customerId=<고객 UUID>
  //   코스 선택 카드에는 노출되지 않는다 (CourseSelection 은 주소로만 열림).
  //
  // 기준은 '1way'. 현재 실제로 열려있고 개발된 코스가 1WAY 하나뿐이고,
  // 시안 폴더 이름이 '1way (Copy)' 인 것도 1WAY 를 다시 그린 것이기 때문이다.
  //
  // 기존 코스는 건드리지 않으므로, 이식 중에도 1WAY 흐름은 그대로 동작한다.
  // 이식이 끝나면 '1way' 를 이 목록으로 바꾸고 'new' 는 지운다.
  //
  // 1WAY 13화면 → 10화면. 통합 2곳 · 분리 1곳:
  //   preInterview        ← 기존 preInterview + imagePreference + fashionPreference
  //   aiFaceFeature       ┐ 기존 faceResult 를 둘로 분리
  //   aiFaceResultDerived ┘
  //   hairConsulting      ← 기존 imageDirection + hairDesign + hairTexture
  // faceAnalysis 는 시안 것을 쓰지 않는다 — 우리 쪽에만 카메라·검출·크롭·S3·분석이 있다.
  // preSurveyReview 는 시안에 없지만 우리 기능이라 유지한다.
  // ───────────────────────────────────────────────────────────────────
  'new': [
    // 사전 인터뷰 제외 (2026-09-01) — 고객이 방문 전 /pre-survey 에서 이미 작성한다.
    'summary',
    'faceAnalysis',
    'faceProcessing',
    'aiFaceFeature',
    'aiFaceResultDerived',
    'hairConsulting',
    // 헤어 디자인(hairDesign) · 헤어 질감(hairTexture) 제외 (2026-09-08 · 2026-09-10)
    // 두 화면 다 헤어컨설팅 안에 같은 문항이 있다 —
    //   hairDesign  ↔ '스타일 제안'(앞머리·가르마·길이·컬감·컬러)
    //   hairTexture ↔ '모질 분석 및 컨디션'(손상도·굵기·숱·곱슬)
    // 상담 저장의 hairDesign·hairTexture 는 null 로 남고, hairConsulting 이 만드는
    // style·condition 이 그 자리를 채운다. 리포트는 hairDesign 을 읽지 않는다.
    // 시안 흐름은 '다음 방향' 에서 바로 리포트가 뜬다.
    // 사전설문 내용은 첫 화면(요약)이 이미 보여주므로 끝에 다시 확인하지 않는다.
    'nextDirection',
  ],
};

/** 'new' 화면 흐름을 쓰는 코스 */
const usesNewFlow = (course: string) => course === 'new';

// 짧은 전환 화면 — 진행률에 세지 않고, "이전" 으로 되돌아가지도 않는다.
const TRANSIENT_STEPS: PageKey[] = ['faceProcessing'];


// 'new' 의 요약(INFO) 화면은 사전설문 답변을 보여주는 화면이다.
// 사전설문이 없으면 보여줄 게 없으므로 흐름에서 아예 뺀다.
type StepOpts = { noPreSurvey?: boolean };

function stepsFor(course: string, opts?: StepOpts): PageKey[] {
  // 알 수 없는 코스는 1WAY 로 떨어뜨린다 — 실제로 열려있는 코스가 1WAY 하나이고,
  // 진단 축이 가장 적어 없는 화면을 요구하지 않는 가장 안전한 기본값이다.
  const base = COURSE_STEPS[course] ?? COURSE_STEPS['1way'];
  if (usesNewFlow(course) && opts?.noPreSurvey) return base.filter((s) => s !== 'summary');
  return base;
}

function stepAfter(course: string, current: PageKey, opts?: StepOpts): PageKey | null {
  const steps = stepsFor(course, opts);
  const i = steps.indexOf(current);
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
}

function stepBefore(course: string, current: PageKey, opts?: StepOpts): PageKey | null {
  const steps = stepsFor(course, opts);
  let i = steps.indexOf(current) - 1;
  while (i >= 0 && TRANSIENT_STEPS.includes(steps[i])) i--;   // 전환 화면은 건너뛴다
  return i >= 0 ? steps[i] : null;
}

// 진행률 표시에 포함되는 페이지 (transient 제외).
// completion 은 흐름이 끝난 뒤라 애초에 구성표에 없다.
function buildVisibleSteps(course: string, opts?: StepOpts): PageKey[] {
  return stepsFor(course, opts).filter((s) => !TRANSIENT_STEPS.includes(s));
}

export default function ThreeWayConsultingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading } = useAuth();

  // 코스 선택을 거치면 항상 course 가 붙지만, 주소를 직접 친 경우를 대비한 기본값.
  // 현재 열려있는 코스가 1WAY 하나뿐이라 1way 로 둔다.
  const selectedCourse = searchParams.get('course') || '1way';
  const isNewFlow = usesNewFlow(selectedCourse);
  const customerId = searchParams.get('customerId');
  const occupation = searchParams.get('occupation') || '';

  // ── 개발용 화면 점프 ──────────────────────────────────────────────
  // 이식 작업 중 뒤쪽 화면을 보려면 매번 얼굴 촬영·분석을 통과해야 해서 느리다.
  // 개발 모드에서만 ?step=<화면키> 로 해당 화면에 바로 진입한다.
  // 운영 빌드에서는 process.env.NODE_ENV 가 'production' 이라 무시된다.
  const devJump = process.env.NODE_ENV === 'development';
  // 사전설문 조회 결과. 'new' 에서 요약(INFO) 화면을 넣을지 결정한다.
  //   null = 아직 확인 전 · true = 있음 · false = 없음
  const [hasPreSurvey, setHasPreSurvey] = useState<boolean | null>(
    isNewFlow ? null : false,
  );

  // 사전설문 유무에 따라 'new' 의 화면 목록이 달라진다 (요약 화면 포함 여부).
  const stepOpts: StepOpts = { noPreSurvey: hasPreSurvey === false };
  const jumpSteps: PageKey[] = devJump ? [...stepsFor(selectedCourse, stepOpts), 'completion'] : [];
  // 시작 화면은 코스 구성표의 첫 항목. 'preInterview' 로 못박으면 그 화면을 뺀 코스가 깨진다.
  const firstStep = stepsFor(selectedCourse, stepOpts)[0];

  const [currentPage, setCurrentPage] = useState<PageKey>(() => {
    if (!devJump) return firstStep;
    const s = searchParams.get('step') as PageKey | null;
    return s && jumpSteps.includes(s) ? s : firstStep;
  });
  // 개발용 — 주소에 &report=1 을 붙이면 마지막 화면에서 리포트가 바로 열린다.
  // 리포트 안을 확인할 때마다 앞 단계를 클릭해 내려갈 필요가 없게. (2026-09-11)
  const [showReport, setShowReport] = useState(() => devJump && searchParams.get('report') === '1');
  // 저장된 상담 id — 완료 화면의 '링크 공유' 가 이걸로 공유 링크를 만든다
  const [savedConsultId, setSavedConsultId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [preInterviewData, setPreInterviewData] = useState<PreInterviewData | null>(null);
  const [imagePreferenceData, setImagePreferenceData] = useState<ImagePreferenceData | null>(null);
  const [fashionPreferenceData, setFashionPreferenceData] = useState<FashionPreferenceData | null>(null);
  const [cycleData, setCycleData] = useState<LegacyCycleData | null>(null);
  // ── new 코스 전용 ──────────────────────────────────────────────
  // 시안의 '퍼스널 리포트' 화면이 주는 값. 옛 코스의 cycleData 와 모양이 달라
  // 상태를 따로 둔다 — 1way/3way 배선은 건드리지 않는다. (2026-09-11)
  const [newCycleData, setNewCycleData] = useState<CycleData | null>(null);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  // 시술 전·후 사진의 저장용 주소. 화면은 blob: 주소로 바로 보여주고, 뒤에서 S3 에 올린 주소를
  // 상담 기록에 저장한다. blob: 은 이 탭에서만 살아 있어서 그대로 저장하면 다시 열 때 사라진다.
  // 시술 후 사진은 리포트를 만든 뒤에 찍으므로, 돌아와서 올려도 남아 있어야 한다.
  const [treatmentPhotoUrls, setTreatmentPhotoUrls] = useState<{ before: string | null; after: string | null }>({ before: null, after: null });
  const latestPhotoRef = useRef<{ before: string | null; after: string | null }>({ before: null, after: null });
  // 사진이 바뀌어 저장이 필요하다는 표시 — 복원으로 채울 때는 세우지 않는다
  const photoDirtyRef = useRef(false);
  const handleTreatmentPhoto = (slot: 'before' | 'after') => (url: string | null) => {
    const setPhoto = slot === 'before' ? setBeforePhoto : setAfterPhoto;
    const previous = slot === 'before' ? beforePhoto : afterPhoto;
    setPhoto(url);
    latestPhotoRef.current[slot] = url;
    if (!url) {
      photoDirtyRef.current = true;
      setTreatmentPhotoUrls((p) => ({ ...p, [slot]: null }));
      return;
    }
    if (!url.startsWith('blob:')) return;
    (async () => {
      const blob = await (await fetch(url)).blob();
      // 휴대폰 사진은 3MB(업로드 한도)를 넘기 쉽다 — 얼굴 사진과 같은 방식으로 줄여서 올린다
      const { file } = await prepareImageForAnalysis(
        new File([blob], `treatment-${slot}-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' }),
      );
      const { uploadUrl, publicUrl } = await requestUploadUrl(file.type, undefined, file.size);
      await uploadToS3(uploadUrl, file, file.type);
      // 올리는 동안 다른 사진으로 바꾸거나 지웠으면 이 결과는 버린다
      if (latestPhotoRef.current[slot] !== url) return;
      photoDirtyRef.current = true;
      setTreatmentPhotoUrls((p) => ({ ...p, [slot]: publicUrl.split('?')[0] }));
    })().catch((e) => {
      console.error('시술 사진 업로드 실패', e);
      if (latestPhotoRef.current[slot] !== url) return;
      // 화면에 사진이 남아 있으면 저장된 줄 안다 — 이전 사진으로 되돌리고 알린다
      setPhoto(previous);
      latestPhotoRef.current[slot] = previous;
      alert(`${slot === 'before' ? '시술 전' : '시술 후'} 사진을 올리지 못했습니다. 인터넷 연결을 확인하고 다시 올려 주세요.`);
    });
  };
  const [directionSubSel, setDirectionSubSel] = useState<Record<string, string>>({});
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  // 디자이너가 확정/수정한 다운스트림 입력값 (저장 + step 간 연동)
  const [faceResultData, setFaceResultData] = useState<FaceResultData | null>(null);
  const [imageDirectionData, setImageDirectionData] = useState<ImageDirectionData | null>(null);
  const [hairDesignData, setHairDesignData] = useState<HairDesignData | null>(null);
  const [hairTextureData, setHairTextureData] = useState<HairTextureData | null>(null);
  const [personalColorData, setPersonalColorData] = useState<PersonalColorData | null>(null);
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const [hydrating, setHydrating] = useState(true);
  // 'new' 코스 전용 — 이목구비 분석에서 고른 축 위치를 다음 두 화면이 물려받는다.
  // 개발용 더미 측정값 — 주소에 &demoFace=1 을 붙이면 얼굴을 찍지 않아도
  // 고유 이미지타입이 잡힌다. 이미지맵의 고유미 마커·화살표를 눈으로 확인할 때 쓴다.
  // 개발 모드에서만 동작하고, 운영 빌드에서는 무시된다. (2026-09-10)
  //   demoFace=1        형태축 Cool · 비율축 Soft (뚜렷한 칸)
  //   demoFace=neutral  전 항목 가운데 → Neutral × Neutral (해석이 비는지 볼 때)
  const demoFaceMode = devJump ? searchParams.get('demoFace') : null;
  const demoFace = demoFaceMode === '1' || demoFaceMode === 'neutral';
  const [faceResultPosMap, setFaceResultPosMap] = useState<Record<string, number>>(() =>
    demoFace
      ? Object.fromEntries(
          // 형태축은 Cool 쪽(0.75), 비율축은 Soft 쪽(0.25) 으로 몰아 NATURAL 이 아닌
          // 뚜렷한 칸이 잡히게 한다 — 추구미를 아무 칸이나 골라도 화살표가 보인다.
          demoFaceMode === 'neutral'
            // 항목은 한쪽으로 기울지만 개수가 반반이라 합산이 Neutral 이 되는 경우.
            // 원장님이 지적한 '합산은 Neutral 인데 이목구비는 W·C 로 나오는' 상황이다.
            ? [...FORM, ...PROP].map((it, i) => [it.id, i % 2 === 0 ? 0.18 : 0.82] as const)
            : [...FORM.map((it) => [it.id, 0.75] as const), ...PROP.map((it) => [it.id, 0.25] as const)],
        )
      : {},
  );
  // 'new' 헤어컨설팅에서 고른 값 (스타일 5축 + 모질 4축 + 목표 이미지타입)
  const [hairConsultingData, setHairConsultingData] = useState<HairConsultingData | null>(null);
  // 'new' 의 사전 인터뷰는 이미지·패션 선호까지 흡수해 필드가 12개다 (기존은 2개).
  // 모양이 달라 기존 preInterviewData 와 섞을 수 없으므로 따로 들고 있는다.
  const [newPreInterviewData, setNewPreInterviewData] = useState<NewPreInterviewData | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // 고객 데이터 로드
  useEffect(() => {
    if (!token) return;
    if (!customerId) {
      router.replace('/3way');
      return;
    }
    setHydrating(true);
    getCustomerById(token, customerId)
      .then((c) => {
        setCustomerData({
          name: c.name,
          phone: c.phone || '',
          occupation,
          ageGroup: c.age_group || '',
          gender: c.gender === 'male' ? '남자' : '여자',
          designerName: user?.ownerName || '',
        });
      })
      .catch(() => router.replace('/3way'))
      .finally(() => setHydrating(false));
  }, [token, customerId, occupation, user, router]);

  // 저장된 상담 복원 — 새로고침하거나 리포트를 닫고 다시 들어오면 고른 값이
  // 전부 날아갔다. 화면들이 값을 자기 안에만 들고 있어서다.
  //
  // 같은 날 기록만 되살린다. 재방문 고객의 지난 방문 값을 미리 채워 두면
  // 디자이너가 못 보고 그대로 저장해 엉뚱한 기록이 남는다. (2026-09-11)
  const [restored, setRestored] = useState<Record<string, unknown> | null>(null);
  // 임시저장이 마지막으로 본 화면. 복원도 이걸 건드리므로 복원 effect 보다 먼저 선언한다.
  const lastDraftPageRef = useRef<PageKey | null>(null);
  // 이 상담이 이미 완료(리포트 '완료')됐는지. 완료 뒤에 돌아와 고친 것은 임시저장이 아니라
  // 완료 기록을 고치는 것이므로 draft 표시를 다시 붙이지 않는다.
  const completedRef = useRef(false);
  const [restoring, setRestoring] = useState(isNewFlow);
  useEffect(() => {
    if (!isNewFlow || !token || !customerId) { setRestoring(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const list = await getConsultationsByCustomerId(token, customerId);
        const today = new Date().toDateString();
        const latest = list
          .filter((c) => c.createdAt && new Date(c.createdAt).toDateString() === today)
          .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())[0];
        const three = (latest?.clientInfo as { threeWay?: Record<string, unknown> } | undefined)?.threeWay;
        if (cancelled || !three) return;
        setRestored(three);
        setSavedConsultId(latest.id);
        savedIdRef.current = latest.id;
        const pos = three.faceItemPositions as Record<string, number> | undefined;
        if (pos && Object.keys(pos).length) setFaceResultPosMap(pos);
        const fa = three.faceAnalysis as { faceImageUrl?: string } | undefined;
        if (fa?.faceImageUrl) setFaceImageUrl(fa.faceImageUrl);
        const tp = three.treatmentPhotos as { before?: string | null; after?: string | null } | undefined;
        if (tp) {
          if (tp.before) setBeforePhoto(tp.before);
          if (tp.after) setAfterPhoto(tp.after);
          latestPhotoRef.current = { before: tp.before ?? null, after: tp.after ?? null };
          setTreatmentPhotoUrls({
            before: tp.before ? tp.before.split('?')[0] : null,
            after: tp.after ? tp.after.split('?')[0] : null,
          });
        }
        const hc = three.hairConsulting as HairConsultingData | undefined;
        if (hc) setHairConsultingData(hc);
        const cd = three.cycleData as CycleData | undefined;
        if (cd) {
          setNewCycleData(cd);
          if (cd.subSelections) setDirectionSubSel(cd.subSelections);
        }
        // 임시저장된 상담이면 그 화면에서 이어간다. 사진 이후 화면은 분석 결과 원본이 있어야 열린다.
        const draftStep = (three.draft as { step?: PageKey } | undefined)?.step;
        completedRef.current = !draftStep;
        if (draftStep) {
          const raw = three.faceAnalysisRaw as AnalyzeResponse | null | undefined;
          if (raw) setFaceAnalysisResult(raw);
          const order = stepsFor(selectedCourse);
          const afterPhoto = order.indexOf(draftStep) > order.indexOf('faceAnalysis');
          const target = order.includes(draftStep) && !TRANSIENT_STEPS.includes(draftStep) ? draftStep : null;
          if (target) {
            const to = afterPhoto && !raw ? 'faceAnalysis' : target;
            // 복원으로 옮겨 가는 것은 사용자가 화면을 넘긴 게 아니다 — 임시저장 대상이 아니라고 알려 둔다.
            // (토큰이 늦게 와서 위 restoring 이 먼저 false 가 되는 경우, 이걸 안 하면 복원 직후 덮어써진다)
            lastDraftPageRef.current = to;
            setCurrentPage(to);
          }
        }
      } catch {
        // 이력 조회가 실패해도 화면은 빈 상태로 그대로 쓴다
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isNewFlow, token, customerId, selectedCourse]);

  // 'new' 코스는 사전 인터뷰 화면을 뺐으므로, 고객이 방문 전 작성한 사전설문을 대신 읽는다.
  // 제출된 것 중 가장 최근 1건. 없으면 빈 값으로 두고 화면은 그대로 띄운다.
  useEffect(() => {
    if (!isNewFlow || !token || !customerId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await listPreSurveysByCustomer(token, customerId);
        const submitted = list
          .filter((s) => s.filled_at)
          .sort((a, b) => new Date(b.filled_at as string).getTime() - new Date(a.filled_at as string).getTime());
        if (!submitted[0]) {
          if (!cancelled) setHasPreSurvey(false);
          return;
        }
        const detail = await getPreSurvey(token, submitted[0].id);
        if (!cancelled) {
          setNewPreInterviewData(preSurveyToPreInterview(detail.answers));
          setHasPreSurvey(true);
        }
      } catch (e) {
        console.error('사전설문 조회 실패', e);
        if (!cancelled) setHasPreSurvey(false);   // 조회 실패 시에도 흐름은 막지 않는다
      }
    })();
    return () => { cancelled = true; };
  }, [isNewFlow, token, customerId]);

  // currentPage 는 첫 렌더에 굳는다. 그 시점엔 사전설문 조회가 아직 끝나지 않아
  // 'summary' 로 잡힐 수 있으므로, 조회 결과가 나온 뒤 목록에 없는 화면이면 보정한다.
  useEffect(() => {
    if (hasPreSurvey === null) return;
    const steps = stepsFor(selectedCourse, { noPreSurvey: hasPreSurvey === false });
    if (currentPage !== 'completion' && !steps.includes(currentPage)) setCurrentPage(steps[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPreSurvey, selectedCourse]);

  // 상담 저장 내용 만들기. draftStep 이 있으면 임시저장, null 이면 최종 저장.
  const buildSavePayload = (draftStep: PageKey | null): SaveConsultPayload | null => {
    // customerId 는 진입 시 항상 존재(없으면 입장 거부) → 전화번호 유무와 무관하게 저장
    if (!customerId || !customerData) return null;
    const COURSE_NAMES: Record<string, string> = {
      '3way': '3WAY',
      '2way-personal': '2WAY (Personal Color)',
      '2way-skeleton': '2WAY (Skeleton Image)',
      '1way': '1WAY',
      'new': '1WAY (신규 이식 · 개발)',
    };
    // F6: 알 수 없는 코스는 '1WAY' 로 단정하지 않고 받은 값 그대로 보존
    const courseName = COURSE_NAMES[selectedCourse] || selectedCourse;

    return {
      customerId,
      phone: customerData.phone,
      name: customerData.name,
      course: courseName,
      designerName: customerData.designerName,
      ageGroup: customerData.ageGroup,
      gender: customerData.gender as 'female' | 'male' | '여자' | '남자' | '',
      occupation: customerData.occupation,
      consultData: {
        faceAnalysis: faceAnalysisResult
          ? {
              wncId: faceAnalysisResult.wncId,
              snhId: faceAnalysisResult.snhId,
              // 디자이너가 수정한 최종값 우선, 없으면 원본 분석값
              wncFinal: faceResultData?.wncFinal ?? faceAnalysisResult.wnc.final,
              snhFinal: faceResultData?.snhFinal ?? faceAnalysisResult.snh.final,
              imageType: `${faceResultData?.wncFinal ?? faceAnalysisResult.wnc.final} / ${faceResultData?.snhFinal ?? faceAnalysisResult.snh.final}`,
              ratios: faceResultData?.ratios,
              summaryItems: faceResultData?.summaryItems,
              warmCool: faceResultData?.warmCool,
              softHard: faceResultData?.softHard,
              // 화면 표시용은 5분짜리 서명 주소라 서명을 떼고 원래 주소만 저장한다.
              // 다시 읽을 때 백엔드가 새로 서명해 준다 (S3Service.refreshOwnUrls, 2026-10-11)
              faceImageUrl: faceImageUrl ? faceImageUrl.split('?')[0] : null,
            }
          : null,
        // B1: 이전에 저장 누락되던 디자이너 입력값들
        personalColor: personalColorData,
        skeleton: skeletonData,
        imageDirection: imageDirectionData,
        hairDesign: hairDesignData,
        hairTexture: hairTextureData,
        cycleData: isNewFlow ? newCycleData : cycleData,
        imagePreferenceData,
        fashionPreferenceData,
        preInterviewData,

        // ── 'new' 코스 전용 ────────────────────────────────────────
        // 시안 화면들은 값을 자기 안에만 들고 있어 저장되지 않던 것들.
        ...(isNewFlow
          ? {
              // 사전설문에서 끌어온 값 (사전 인터뷰 화면을 뺐으므로 이게 그 자리)
              newPreInterview: newPreInterviewData,
              // 이목구비 20개 항목의 최종 위치값 — 디자이너가 슬라이더로 고친 결과가 반영된 값
              faceItemPositions: faceResultPosMap,
              // 항목별 실측 표시값·숫자. 공유 페이지는 로그인 없이 열리므로 분석 결과를
              // 다시 조회할 수 없다 → 리포트를 그리는 데 필요한 값을 함께 저장한다
              faceValues: faceAnalysisToValues(faceAnalysisResult),
              faceNumbers: faceAnalysisToNumbers(faceAnalysisResult),
              // 위 위치값에서 나온 최종 이미지타입 (화면과 같은 계산)
              finalImageType: Object.keys(faceResultPosMap).length
                ? deriveImageType(faceResultPosMap)
                : null,
              hairConsulting: hairConsultingData,
              // 시술 전·후 사진 (S3 주소, 서명 없이) — 다시 읽을 때 백엔드가 새로 서명해 준다
              treatmentPhotos: treatmentPhotoUrls,
              // 임시저장 표시 — 끝나지 않은 상담. 최종 저장(draftStep=null)에서는 빠져서 완료로 바뀐다.
              // faceAnalysisRaw 는 사진 이후 화면을 다시 열 때 필요한 분석 결과 원본.
              // 서명 주소(faceImageDownloadUrl)는 5분짜리라 떼고 저장한다.
              ...(draftStep
                ? {
                    draft: { step: draftStep, savedAt: new Date().toISOString() },
                    faceAnalysisRaw: faceAnalysisResult
                      ? { ...faceAnalysisResult, faceImageDownloadUrl: undefined }
                      : null,
                  }
                : {}),
            }
          : {}),
      },
    };
  };

  // 저장은 한 줄로 세운다 — 임시저장이 겹쳐 나가도 첫 저장이 끝나 id 를 받은 뒤에
  // 다음 저장이 그 id 로 덮어쓴다. (안 그러면 상담이 두 건으로 갈라진다)
  const savedIdRef = useRef<string | null>(null);
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());
  const persistConsult = (payload: SaveConsultPayload) => {
    const run = saveChainRef.current.then(async () => {
      const id = savedIdRef.current;
      const res = id ? await updateConsult(id, payload) : await saveConsult(payload);
      if (res?.id) { savedIdRef.current = res.id; setSavedConsultId(res.id); }
    });
    saveChainRef.current = run.catch(() => undefined);
    return run;
  };

  // 임시저장 — 'new' 코스에서 화면이 바뀔 때마다 지금까지 값을 저장한다.
  // 새로고침하거나 나갔다 와도 그 화면에서 이어서 하도록 (restore 가 읽는다).
  // 첫 화면(아직 입력 전)과 복원 직후 화면은 저장하지 않는다.
  useEffect(() => {
    if (!isNewFlow || restoring || hasPreSurvey === null) return;
    if (currentPage === 'completion' || TRANSIENT_STEPS.includes(currentPage)) return;
    if (lastDraftPageRef.current === null) { lastDraftPageRef.current = currentPage; return; }
    if (lastDraftPageRef.current === currentPage) return;
    lastDraftPageRef.current = currentPage;
    if (currentPage === stepsFor(selectedCourse, stepOpts)[0]) return;
    const payload = buildSavePayload(completedRef.current ? null : currentPage);
    if (payload) persistConsult(payload).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, restoring, hasPreSurvey]);

  // 시술 사진은 올라가는 즉시 저장한다. 시술 후 사진은 상담을 끝낸 뒤 올리는 경우가 많아,
  // 화면을 넘기거나 리포트를 다시 끝내기 전에 나가도 남아 있어야 한다.
  useEffect(() => {
    if (!isNewFlow || !photoDirtyRef.current) return;
    photoDirtyRef.current = false;
    const payload = buildSavePayload(completedRef.current || currentPage === 'completion' ? null : currentPage);
    if (payload) persistConsult(payload).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatmentPhotoUrls]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 'new' 는 사전설문 유무에 따라 첫 화면이 달라진다. 확인 전에 그리면
  // 요약 화면이 잠깐 보였다 사라지므로, 조회가 끝날 때까지 기다린다.
  if (loading || hydrating || restoring || (isNewFlow && hasPreSurvey === null)) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user || !customerData) return null;

  // 구성표에서 파생되는 이동. 코스별 분기를 여기서 따로 하지 않는다.
  const goNext = (from: PageKey) => {
    const next = stepAfter(selectedCourse, from, stepOpts);
    if (next) setCurrentPage(next);
  };
  const goBack = (from: PageKey) => {
    const prev = stepBefore(selectedCourse, from, stepOpts);
    if (prev) { setCurrentPage(prev); return; }
    // 첫 화면에서 뒤로 = 컨설팅 시작(고객 확인) 화면으로 나간다.
    // 기존 코스는 사전 인터뷰가 그 역할을 했는데, 'new' 는 그 화면을 빼서 여기서 처리한다.
    if (!customerId) { router.push('/3way'); return; }
    const q = new URLSearchParams({ type: '3way', course: selectedCourse, customerId });
    router.push(`/consulting/start?${q.toString()}`);
  };

  const handlePreInterviewBack = () => {
    // 사전 인터뷰의 "이전" → 컨설팅 시작 (CustomerConfirm) 으로
    const q = new URLSearchParams({ type: '3way', course: selectedCourse, customerId: customerId! });
    router.push(`/consulting/start?${q.toString()}`);
  };
  const handlePreInterviewNext = (data: PreInterviewData) => {
    setPreInterviewData(data);
    goNext('preInterview');
  };

  const handleImagePreferenceBack = () => goBack('imagePreference');
  const handleImagePreferenceNext = (data: ImagePreferenceData) => {
    setImagePreferenceData(data);
    goNext('imagePreference');
  };

  const handleFashionPreferenceBack = () => goBack('fashionPreference');
  const handleFashionPreferenceNext = (data: FashionPreferenceData) => {
    setFashionPreferenceData(data);
    goNext('fashionPreference');
  };

  const handleSummaryBack = () => goBack('summary');
  const handleSummaryNext = () => goNext('summary');

  const handleFaceAnalysisBack = () => goBack('faceAnalysis');
  const handleFaceAnalysisNext = (result: AnalyzeResponse, imageUrl: string) => {
    setFaceAnalysisResult(result);
    // 화면 표시는 GET presigned URL 로 한다. 업로드에 쓴 imageUrl 은 비공개 버킷이라 읽히지 않는다.
    setFaceImageUrl(result.faceImageDownloadUrl || imageUrl);
    goNext('faceAnalysis');
  };
  const handleFaceProcessingComplete = () => goNext('faceProcessing');

  const handleFaceResultBack = () => goBack('faceResult');
  const handleFaceResultNext = (data: FaceResultData) => {
    setFaceResultData(data);
    goNext('faceResult');
  };

  // 얼굴 분석에서 도출된 현재 이미지 타입 (디자이너 수정 반영). 분석 전이면 N/N.
  const currentImageType = {
    warmCool: faceResultData?.wncFinal ?? 'N',
    softHard: faceResultData?.snhFinal ?? 'N',
  } as const;
  const toneLabel = { W: 'Warm', N: 'Neutral', C: 'Cool' } as const;
  const balanceLabel = { S: 'Soft', N: 'Neutral', H: 'Hard' } as const;
  const imageTypeLabel = `${toneLabel[currentImageType.warmCool]} / ${balanceLabel[currentImageType.softHard]}`;

  const handlePersonalColorBack = () => goBack('personalColor');
  const handlePersonalColorNext = () => goNext('personalColor');

  const handleSkeletonImageBack = () => goBack('skeletonImage');
  const handleSkeletonImageNext = () => goNext('skeletonImage');

  const handleImageDirectionBack = () => goBack('imageDirection');
  const handleImageDirectionNext = () => goNext('imageDirection');

  const handleHairDesignBack = () => goBack('hairDesign');
  const handleHairDesignNext = () => goNext('hairDesign');

  const handleHairTextureBack = () => goBack('hairTexture');
  const handleHairTextureNext = () => goNext('hairTexture');

  const handleNextDirectionBack = () => goBack('nextDirection');
  const handleNextDirectionNext = () => goNext('nextDirection');

  const handlePreSurveyReviewBack = () => goBack('preSurveyReview');
  const handlePreSurveyReviewNext = () => setShowReport(true);

  const handleReportClose = () => {
    setShowReport(false);
    completedRef.current = true;
    const payload = buildSavePayload(null);
    if (payload) persistConsult(payload).catch(() => undefined);
    setCurrentPage('completion');
  };

  // 'new' 코스는 리포트 안에 PDF 저장이 들어 있다 → 완료 화면에서는 리포트를 다시 연다.
  const handleDownloadPDF = () => {
    if (isNewFlow) { setShowReport(true); return; }
    alert('PDF 다운로드 기능은 추후 연동 예정입니다.');
  };
  /**
   * 결과 공유 — 앱에 이미 있는 ShareLinkModal 을 연다.
   * (비밀번호 입력 · QR · 링크 복사가 그 모달에 들어 있다. 예전에는 window.prompt 로 물어서
   *  화면 톤과 맞지 않았고, 그전에는 전화 뒤 4자리로 몰래 만들고 있었다)
   */
  const handleShareLink = () => {
    if (!savedConsultId) {
      alert('상담 저장이 끝난 뒤에 공유할 수 있습니다.');
      return;
    }
    setShareModalOpen(true);
  };

  const handleGoHome = () => router.push('/');

  // 페이지 렌더링
  // ── 'new' 코스 전용 렌더 ────────────────────────────────────────────
  // 시안 이식본. 기존 코스 렌더(renderPage)와 완전히 분리해 서로 영향이 없다.
  // 1단계는 "화면이 뜨는 것"까지가 목표라 저장 배선은 아직 최소한만 이어져 있다.
  const renderNewCourse = () => {
    if (currentPage === 'summary') {
      // 값은 위 useEffect 가 사전설문에서 끌어와 채운다. 조회가 실패한 경우를 대비해
      // 빈 값으로라도 화면은 뜨게 둔다 (사전설문이 아예 없으면 이 화면은 흐름에서 빠진다).
      return (
        <NewConsultingSummary
          selectedCourse={selectedCourse}
          preInterviewData={newPreInterviewData ?? EMPTY_PRE_INTERVIEW}
          onBack={() => goBack('summary')}
          onNext={() => goNext('summary')}
        />
      );
    }
    // 얼굴 촬영만 우리 것 — 카메라·얼굴검출·크롭·S3 업로드·Python 분석이 여기 있다.
    if (currentPage === 'faceAnalysis') {
      return (
        <>
          <FaceAnalysisCapture onBack={handleFaceAnalysisBack} onNext={handleFaceAnalysisNext} />
          {/* 실제 얼굴이 타원 안에 잡혀야 촬영 버튼이 풀린다. 확인 작업에서는 통과가 어려워
              개발 모드에서만 건너뛰기를 둔다. 운영 빌드에서는 렌더되지 않는다. */}
          {devJump && (
            <button
              onClick={() => goNext('faceAnalysis')}
              className="fixed bottom-5 right-5 z-[9999] px-4 py-2 rounded-full bg-white border border-[#DDDDDD] shadow-lg text-[11px] text-[#666666] hover:bg-[#F5F5F5] transition-colors"
            >
              DEV 얼굴분석 건너뛰기 →
            </button>
          )}
        </>
      );
    }
    if (currentPage === 'faceProcessing') {
      return <NewFaceAnalysisProcessing onComplete={() => goNext('faceProcessing')} />;
    }
    if (currentPage === 'aiFaceFeature') {
      return (
        <AIFaceFeature
          facePhotoUrl={faceImageUrl}
          /* 한 번 조정한 뒤 되돌아오면 그 값에서 다시 시작한다.
             (예전에는 분석 결과로 되돌아가 디자이너가 잡은 값이 전부 날아갔다) */
          initialPosMap={
            Object.keys(faceResultPosMap).length
              ? faceResultPosMap
              : faceAnalysisToPosMap(faceAnalysisResult)
          }
          measurements={faceAnalysisToMeasurements(faceAnalysisResult)}
          values={faceAnalysisToValues(faceAnalysisResult)}
          onNext={(posMap) => { setFaceResultPosMap(posMap); setCurrentPage('aiFaceResultDerived'); }}
          onBack={() => goBack('aiFaceFeature')}
        />
      );
    }
    if (currentPage === 'aiFaceResultDerived') {
      return (
        <AIFaceResultDerived
          facePhotoUrl={faceImageUrl}
          posMap={faceResultPosMap}
          onNext={() => goNext('aiFaceResultDerived')}
          onBack={() => goBack('aiFaceResultDerived')}
        />
      );
    }
    if (currentPage === 'hairDesign') {
      // 8.10 헤어 처방 — 이목구비 판정 좌표에서 바로 나온다. 촬영 전이면 null 이라 추천이 안 뜬다.
      const col = dominantIdx(FORM, faceResultPosMap);
      const row = dominantIdx(PROP, faceResultPosMap);
      const rx = designScreenRecommendation(col, row);
      const currentTypeLabel = hairConsultingData?.currentType
        ? `${hairConsultingData.currentType.en} · ${hairConsultingData.currentType.ko}`
        : imageTypeLabel;
      return (
        <HairDesignProposal
          onBack={() => goBack('hairDesign')}
          onNext={() => goNext('hairDesign')}
          imageTypeLabel={currentTypeLabel}
          onChange={setHairDesignData}
          recommendedIds={rx ? { length: rx.length, bangs: rx.bangs, curl: rx.curl, color: rx.color } : undefined}
          strategy={strategyOf(col, row, hairConsultingData?.targetType?.en ?? null)}
          directionKeyword={rx?.keyword ?? null}
          prescriptionVerified={rx?.verified}
          startEmpty
        />
      );
    }
    if (currentPage === 'hairTexture') {
      return (
        <HairTextureAnalysis
          onBack={() => goBack('hairTexture')}
          onNext={() => goNext('hairTexture')}
          onChange={setHairTextureData}
          startEmpty
        />
      );
    }
    if (currentPage === 'hairConsulting') {
      return (
        <HairConsulting
          posMap={faceResultPosMap}
          initial={(restored?.hairConsulting as HairConsultingData | undefined) ?? null}
          onChange={setHairConsultingData}
          onNext={() => goNext('hairConsulting')}
          onBack={() => goBack('hairConsulting')}
        />
      );
    }
    if (currentPage === 'nextDirection') {
      return (
        <>
          <NewNextDirection
            onBack={() => goBack('nextDirection')}
            onNext={() => setShowReport(true)}
            onCycleDataChange={setNewCycleData}
            initial={(restored?.cycleData as CycleData | undefined) ?? null}
            onSubSelectionsChange={setDirectionSubSel}
            beforePhoto={beforePhoto}
            afterPhoto={afterPhoto}
            onBeforePhotoChange={handleTreatmentPhoto('before')}
            onAfterPhotoChange={handleTreatmentPhoto('after')}
          />
          {showReport && (
            <NewPremiumReportV2
              onBack={handleReportClose}
              onExit={() => setShowReport(false)}
              customerName={customerData.name}
              consultDate={new Date().toLocaleDateString('ko-KR')}
              designerName={customerData.designerName || '디자이너'}
              cycleData={newCycleData}
              hairTargetType={hairConsultingData?.targetType?.en ?? null}
              hairCondition={hairConsultingData?.condition ?? null}
              hairStyle={hairConsultingData?.style ?? null}
              facePosMap={faceResultPosMap}
              facePhotoUrl={faceImageUrl}
              beforePhoto={beforePhoto}
              afterPhoto={afterPhoto}
              onBeforePhotoChange={handleTreatmentPhoto('before')}
              onAfterPhotoChange={handleTreatmentPhoto('after')}
              initialSubSel={directionSubSel}
              selectedCourse={selectedCourse}
            />
          )}
        </>
      );
    }
    if (currentPage === 'completion') {
      return (
        <>
          <NewCompletionPage
            onDownloadPDF={handleDownloadPDF}
            onEdit={() => setCurrentPage('nextDirection')}
            onShareLink={handleShareLink}
            onGoHome={handleGoHome}
            courseLabel={courseChipLabel}
          />
          {shareModalOpen && savedConsultId && (
            <ShareLinkModal
              consultationId={savedConsultId}
              clientName={customerData.name}
              visitDate={new Date().toLocaleDateString('ko-KR')}
              designerName={customerData.designerName || undefined}
              onClose={() => setShareModalOpen(false)}
            />
          )}
          {/* 완료 화면에서 'PDF 저장' 을 누르면 리포트를 다시 열어 거기서 내려받는다 */}
          {showReport && (
            <NewPremiumReportV2
              autoPdf
              onBack={() => setShowReport(false)}
              customerName={customerData.name}
              consultDate={new Date().toLocaleDateString('ko-KR')}
              designerName={customerData.designerName || '디자이너'}
              cycleData={newCycleData}
              hairTargetType={hairConsultingData?.targetType?.en ?? null}
              hairCondition={hairConsultingData?.condition ?? null}
              hairStyle={hairConsultingData?.style ?? null}
              facePosMap={faceResultPosMap}
              facePhotoUrl={faceImageUrl}
              beforePhoto={beforePhoto}
              afterPhoto={afterPhoto}
              onBeforePhotoChange={handleTreatmentPhoto('before')}
              onAfterPhotoChange={handleTreatmentPhoto('after')}
              initialSubSel={directionSubSel}
              selectedCourse={selectedCourse}
            />
          )}
        </>
      );
    }
    return null;
  };

  const renderPage = () => {
    if (isNewFlow) return renderNewCourse();
    if (currentPage === 'preInterview') return <PreInterview onBack={handlePreInterviewBack} onNext={handlePreInterviewNext} />;
    if (currentPage === 'imagePreference') return <ImagePreferenceDiagnosis onBack={handleImagePreferenceBack} onNext={handleImagePreferenceNext} />;
    if (currentPage === 'fashionPreference') return <FashionPreferenceDiagnosis onBack={handleFashionPreferenceBack} onNext={handleFashionPreferenceNext} />;
    if (currentPage === 'summary') {
      if (!imagePreferenceData || !fashionPreferenceData) {
        return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-600">데이터 로딩 중...</p></div>;
      }
      return (
        <ConsultingSummary
          selectedCourse={selectedCourse}
          customerData={customerData}
          imagePreferenceData={imagePreferenceData}
          fashionPreferenceData={fashionPreferenceData}
          onBack={handleSummaryBack}
          onNext={handleSummaryNext}
        />
      );
    }
    if (currentPage === 'faceAnalysis') return <FaceAnalysisCapture onBack={handleFaceAnalysisBack} onNext={handleFaceAnalysisNext} />;
    if (currentPage === 'faceProcessing') return <FaceAnalysisProcessing onComplete={handleFaceProcessingComplete} />;
    if (currentPage === 'faceResult') return <FaceAnalysisResult analysisResult={faceAnalysisResult} onBack={handleFaceResultBack} onNext={handleFaceResultNext} />;
    if (currentPage === 'personalColor') return <PersonalColorAnalysis onBack={handlePersonalColorBack} onNext={handlePersonalColorNext} onChange={setPersonalColorData} />;
    if (currentPage === 'skeletonImage') return <SkeletonImageAnalysis onBack={handleSkeletonImageBack} onNext={handleSkeletonImageNext} onChange={setSkeletonData} />;
    if (currentPage === 'imageDirection') return <ImageDirectionSetting onBack={handleImageDirectionBack} onNext={handleImageDirectionNext} currentType={currentImageType} onChange={setImageDirectionData} />;
    if (currentPage === 'hairDesign') return <HairDesignProposal onBack={handleHairDesignBack} onNext={handleHairDesignNext} imageTypeLabel={imageTypeLabel} onChange={setHairDesignData} />;
    if (currentPage === 'hairTexture') return <HairTextureAnalysis onBack={handleHairTextureBack} onNext={handleHairTextureNext} onChange={setHairTextureData} />;
    if (currentPage === 'nextDirection') {
      return (
        <NextDirection
          onBack={handleNextDirectionBack}
          onNext={handleNextDirectionNext}
          onCycleDataChange={setCycleData}
        />
      );
    }
    // 사전설문 확인은 시안에 없는 우리 기능이라 그대로 유지한다.
    if (currentPage === 'preSurveyReview') {
      return (
        <>
          <PreSurveyReview
            customerId={customerId}
            onBack={handlePreSurveyReviewBack}
            onNext={handlePreSurveyReviewNext}
          />
          {showReport && (
            <PremiumReport
              onClose={handleReportClose}
              customerName={customerData.name}
              consultDate={new Date().toLocaleDateString('ko-KR')}
              designerName={customerData.designerName || '디자이너'}
              cycleData={cycleData}
              selectedCourse={selectedCourse}
              imageType={currentImageType}
              ratios={faceResultData?.ratios}
            />
          )}
        </>
      );
    }
    if (currentPage === 'completion') {
      return <CompletionPage onDownloadPDF={handleDownloadPDF} onShareLink={handleShareLink} onGoHome={handleGoHome} />;
    }
    return null;
  };

  // 진행률 — visibleSteps 에 포함된 페이지에서만 ProgressBar 표시
  const visibleSteps = buildVisibleSteps(selectedCourse, stepOpts);
  const stepIndex = visibleSteps.indexOf(currentPage);
  const showProgress = stepIndex >= 0;

  // F5: 디자이너가 현재 코스를 인지할 수 있도록 칩 표시
  const COURSE_CHIP: Record<string, string> = {
    '3way': '3WAY',
    '2way-personal': '2WAY 퍼스널컬러',
    '2way-skeleton': '2WAY 골격',
    '1way': '1WAY',
    'new': '1WAY · 신규',
  };
  const courseChipLabel = COURSE_CHIP[selectedCourse] || selectedCourse;

  return (
    <>
      {showProgress && (
        <ProgressBar
          currentStep={stepIndex + 1}
          totalSteps={visibleSteps.length + 1}
          leftSlot={
            // 'new' 는 코스 칩을 띄우지 않는다 — 이 코스가 곧 1WAY 가 되므로 구분 표시가 불필요하다.
            selectedCourse === 'new' ? undefined : (
              <span className="shrink-0 inline-flex items-center rounded-full bg-[#111111] text-white text-xs font-medium px-3 py-1 tracking-wide">
                {courseChipLabel}
              </span>
            )
          }
        />
      )}
      {renderPage()}
    </>
  );
}
