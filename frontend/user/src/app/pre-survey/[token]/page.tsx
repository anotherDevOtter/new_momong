'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  fetchPreSurveyByToken,
  savePreSurveyAnswers,
  type PreSurveyAnswers,
} from '@/utils/pre-survey-api';
import { describeApiError } from '@/utils/api-error';
import { Cover } from '@/components/pre-survey/sections/Cover';
import { ConsultingPrograms } from '@/components/pre-survey/sections/ConsultingPrograms';
import { Notice } from '@/components/pre-survey/sections/Notice';
import { Intro } from '@/components/pre-survey/sections/Intro';
import { DetailedConcerns } from '@/components/pre-survey/sections/DetailedConcerns';
import { Summary } from '@/components/pre-survey/sections/Summary';
import { HairGuide } from '@/components/pre-survey/sections/HairGuide';
import { BodyGuide } from '@/components/pre-survey/sections/BodyGuide';

type Step =
  | 'cover'
  | 'programs'
  | 'notice'
  | 'intro'
  | 'concerns'
  | 'summary'
  | 'hair'
  | 'body';

const STEPS: Step[] = ['cover', 'programs', 'notice', 'intro', 'concerns', 'summary', 'hair', 'body'];

function emptyAnswers(): PreSurveyAnswers {
  return {
    age: '',
    job: '',
    preferences: [],
    dislikes: [],
    bodyConcerns: [],
    otherBodyConcern: '',
    faceConcerns: [],
    otherFaceConcern: '',
    hairConcerns: [],
    otherHairConcern: '',
    treatmentPreference: '',
    selectedProgram: '',
    hasBodyAnalysis: false,
    facePhotos: [],
    preferredHairPhotos: [],
    dislikedHairPhotos: [],
    bodyPhotos: [],
  };
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
}

export default function PreSurveyPage() {
  const params = useParams();
  const surveyToken = params.token as string;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [filled, setFilled] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [answers, setAnswers] = useState<PreSurveyAnswers>(emptyAnswers());
  const [step, setStep] = useState<Step>('cover');
  const [submitting, setSubmitting] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const view = await fetchPreSurveyByToken(surveyToken);
        setCustomerName(view.customer.name);
        setFilled(view.filled_at);
        setAnswers({ ...emptyAnswers(), ...view.answers });
      } catch (e) {
        setLoadError(describeApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [surveyToken]);

  const stepIndex = STEPS.indexOf(step);

  const update = useCallback(<K extends keyof PreSurveyAnswers>(key: K, value: PreSurveyAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    dirtyRef.current = true;
  }, []);

  const toggle = useCallback((key: keyof PreSurveyAnswers) => (item: string) => {
    setAnswers((prev) => {
      const list = ((prev[key] as string[] | undefined) ?? []).slice();
      const idx = list.indexOf(item);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(item);
      return { ...prev, [key]: list };
    });
    dirtyRef.current = true;
  }, []);

  // Debounced autosave (2s after last change)
  useEffect(() => {
    if (loading || loadError) return;
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      dirtyRef.current = false;
      try {
        await savePreSurveyAnswers(surveyToken, answers, false);
      } catch {
        // Silent — surface errors on submit instead
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [answers, loading, loadError, surveyToken]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
      window.scrollTo(0, 0);
    }
  }, [stepIndex]);

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1]);
      window.scrollTo(0, 0);
    }
  }, [stepIndex]);

  const requestSubmit = useCallback(() => setSubmitConfirmOpen(true), []);

  const confirmSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await savePreSurveyAnswers(surveyToken, answers, true);
      setFilled(res.filled_at);
      setJustSubmitted(true);
      setSubmitConfirmOpen(false);
    } catch (e) {
      alert(describeApiError(e));
    } finally {
      setSubmitting(false);
    }
  }, [surveyToken, answers]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#7A7A7A] text-sm">
        불러오는 중...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-base text-[#111111]">사전설문지를 불러올 수 없습니다</p>
          <p className="text-sm text-[#7A7A7A]">{loadError}</p>
        </div>
      </div>
    );
  }

  if (filled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-6">
        <div className="max-w-sm text-center space-y-4 bg-white border border-[#E5E5E5] px-8 py-12">
          <p className="text-[10px] text-[#B88A5A] tracking-[0.3em]" style={{ fontWeight: 500 }}>
            MERCI MOMONG
          </p>
          {justSubmitted ? (
            <>
              <p className="text-base text-[#111111]" style={{ fontWeight: 600 }}>
                제출 완료
              </p>
              <p className="text-sm text-[#7A7A7A] leading-relaxed">
                사전설문지를 제출해 주셔서 감사합니다.
                <br />
                방문 시 디자이너가 작성하신 내용을 함께 확인합니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-base text-[#111111]" style={{ fontWeight: 600 }}>
                이미 완료된 사전설문지입니다
              </p>
              <p className="text-sm text-[#7A7A7A] leading-relaxed">
                제출하신 내용은 더 이상 수정할 수 없습니다.
                <br />
                방문 시 디자이너가 작성하신 내용을 함께 확인합니다.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'cover':
        return <Cover customerName={customerName} onNext={goNext} />;
      case 'programs':
        return (
          <ConsultingPrograms
            selectedProgram={answers.selectedProgram ?? ''}
            onSelect={(program, hasBodyAnalysis) => {
              setAnswers((prev) => ({ ...prev, selectedProgram: program, hasBodyAnalysis }));
              dirtyRef.current = true;
            }}
            onPrev={goPrev}
            onNext={goNext}
          />
        );
      case 'notice':
        return <Notice onPrev={goPrev} onNext={goNext} />;
      case 'intro':
        return (
          <Intro
            age={answers.age ?? ''}
            job={answers.job ?? ''}
            preferences={answers.preferences ?? []}
            dislikes={answers.dislikes ?? []}
            onChangeAge={(v) => update('age', v)}
            onChangeJob={(v) => update('job', v)}
            onTogglePreference={toggle('preferences')}
            onToggleDislike={toggle('dislikes')}
            onPrev={goPrev}
            onNext={goNext}
          />
        );
      case 'concerns':
        return (
          <DetailedConcerns
            bodyConcerns={answers.bodyConcerns ?? []}
            faceConcerns={answers.faceConcerns ?? []}
            hairConcerns={answers.hairConcerns ?? []}
            otherBodyConcern={answers.otherBodyConcern ?? ''}
            otherFaceConcern={answers.otherFaceConcern ?? ''}
            otherHairConcern={answers.otherHairConcern ?? ''}
            treatmentPreference={answers.treatmentPreference ?? ''}
            onToggleBody={toggle('bodyConcerns')}
            onToggleFace={toggle('faceConcerns')}
            onToggleHair={toggle('hairConcerns')}
            onChangeOtherBody={(v) => update('otherBodyConcern', v)}
            onChangeOtherFace={(v) => update('otherFaceConcern', v)}
            onChangeOtherHair={(v) => update('otherHairConcern', v)}
            onChangeTreatment={(v) => update('treatmentPreference', v)}
            onPrev={goPrev}
            onNext={goNext}
          />
        );
      case 'summary':
        return <Summary answers={answers} currentDate={todayString()} onPrev={goPrev} onNext={goNext} />;
      case 'hair':
        return (
          <HairGuide
            surveyToken={surveyToken}
            facePhotos={answers.facePhotos ?? []}
            preferredHairPhotos={answers.preferredHairPhotos ?? []}
            dislikedHairPhotos={answers.dislikedHairPhotos ?? []}
            onChangeFacePhotos={(v) => update('facePhotos', v)}
            onChangePreferredHairPhotos={(v) => update('preferredHairPhotos', v)}
            onChangeDislikedHairPhotos={(v) => update('dislikedHairPhotos', v)}
            onPrev={goPrev}
            onNext={goNext}
            nextLabel="NEXT"
          />
        );
      case 'body':
        return (
          <BodyGuide
            surveyToken={surveyToken}
            bodyPhotos={answers.bodyPhotos ?? []}
            onChangeBodyPhotos={(v) => update('bodyPhotos', v)}
            onPrev={goPrev}
            onNext={requestSubmit}
            nextLabel="제출"
          />
        );
    }
  };

  return (
    <>
      {renderStep()}
      <SubmitConfirmDialog
        open={submitConfirmOpen}
        submitting={submitting}
        onCancel={() => setSubmitConfirmOpen(false)}
        onConfirm={confirmSubmit}
      />
    </>
  );
}

function SubmitConfirmDialog({
  open,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, submitting]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={() => !submitting && onCancel()}
    >
      <div
        className="w-full max-w-sm bg-white border border-[#E5E5E5] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-8 text-center space-y-4">
          <p className="text-[10px] text-[#B88A5A] tracking-[0.3em]" style={{ fontWeight: 500 }}>
            MERCI MOMONG
          </p>
          <h3 className="text-[17px] text-[#111111]" style={{ fontWeight: 600 }}>
            사전설문지를 제출하시겠습니까?
          </h3>
          <p className="text-[13px] text-[#7A7A7A] leading-[1.7]" style={{ fontWeight: 400 }}>
            제출 후에는 내용을 수정할 수 없습니다.
            <br />
            모든 내용을 한 번 더 확인해 주세요.
          </p>
        </div>

        <div className="flex border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-4 text-[13px] text-[#7A7A7A] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
            style={{ fontWeight: 500 }}
          >
            취소
          </button>
          <div className="w-px bg-[#E5E5E5]"></div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-4 text-[13px] text-[#B88A5A] hover:bg-[#FFFBF7] transition-colors disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            {submitting ? '제출 중...' : '제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
