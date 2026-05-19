'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminHeader from '@/components/AdminHeader';
import { getFeatureSettings, updateFeatureSettings, FeatureSettings } from '@/utils/api';
import { getAdminToken } from '@/utils/auth';

type CourseKey = '1way' | '2way-personal' | '2way-skeleton' | '3way';

const COURSE_LABELS: Record<CourseKey, string> = {
  '1way': '1WAY (얼굴 분석)',
  '2way-personal': '2WAY (얼굴 + 퍼스널컬러)',
  '2way-skeleton': '2WAY (얼굴 + 골격 이미지)',
  '3way': '3WAY (얼굴 + 퍼스널컬러 + 골격)',
};

export default function FeaturesPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<FeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/login');
      return;
    }

    getFeatureSettings()
      .then(setFeatures)
      .catch(() => toast.error('기능 설정을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [router]);

  const persist = async (patch: Partial<FeatureSettings>) => {
    const token = getAdminToken();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateFeatureSettings(token, patch);
      setFeatures(updated);
      toast.success('저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTop = (key: 'fitEnabled' | 'threeWayEnabled') => {
    if (!features) return;
    persist({ [key]: !features[key] });
  };

  const toggleCourse = (course: CourseKey) => {
    if (!features) return;
    persist({ courses: { ...features.courses, [course]: !features.courses[course] } });
  };

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader currentPath="/features" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-lg font-medium text-[#111111] mb-2">기능 설정</h1>
        <p className="text-sm text-[#999999] mb-10">
          유저 화면에 표시되는 컨설팅 종류와 코스를 켜고 끕니다.
        </p>

        {loading || !features ? (
          <div className="text-sm text-[#999999]">불러오는 중...</div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="text-sm font-medium text-[#111111] mb-4 tracking-wide">
                컨설팅 종류
              </h2>
              <div className="border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                <ToggleRow
                  label="FIT 컨설팅"
                  description="기존 12단계 FIT 헤어컨설팅"
                  enabled={features.fitEnabled}
                  disabled={saving}
                  onToggle={() => toggleTop('fitEnabled')}
                />
                <ToggleRow
                  label="3WAY 컨설팅"
                  description="신규 3WAY 컨설팅 (1/2/3WAY 코스)"
                  enabled={features.threeWayEnabled}
                  disabled={saving}
                  onToggle={() => toggleTop('threeWayEnabled')}
                />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-[#111111] mb-2 tracking-wide">
                3WAY 코스 세부 설정
              </h2>
              <p className="text-xs text-[#999999] mb-4">
                3WAY 컨설팅 내부의 코스 선택 화면에 표시되는 항목입니다.
              </p>
              <div
                className={`border border-[#E5E5E5] divide-y divide-[#E5E5E5] ${
                  features.threeWayEnabled ? '' : 'opacity-40 pointer-events-none'
                }`}
              >
                {(Object.keys(COURSE_LABELS) as CourseKey[]).map((key) => (
                  <ToggleRow
                    key={key}
                    label={COURSE_LABELS[key]}
                    description=""
                    enabled={features.courses[key]}
                    disabled={saving}
                    onToggle={() => toggleCourse(key)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, description, enabled, disabled, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm text-[#111111]">{label}</p>
        {description ? <p className="text-xs text-[#999999] mt-0.5">{description}</p> : null}
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
